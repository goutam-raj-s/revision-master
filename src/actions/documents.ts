"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
  getDocumentsCollection,
  getRepetitionsCollection,
  getNotesCollection,
  getTermsCollection,
  serializeDoc,
} from "@/lib/db/collections";
import { getCustomNextReviewDate, getNextReviewDate } from "@/lib/srs/engine";
import { logReviewEvent, type ReviewConfidence } from "@/lib/streak";
import {
  isValidGoogleDocUrl,
  computeTitleSimilarity,
  computeTagOverlap,
} from "@/lib/utils";
import type { ActionResult, DbDocument, Document, SimilarityMatch, MediaType, Difficulty } from "@/types";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

function topLevelDocumentQuery(userId: ObjectId) {
  return {
    userId,
    $and: [
      { parentDocId: { $exists: false } },
    ],
  };
}

async function resolveRootDocId(docId: string, userId: ObjectId): Promise<ObjectId | null> {
  const docs = await getDocumentsCollection();
  let doc: DbDocument | null = await docs.findOne({ _id: new ObjectId(docId), userId });
  if (!doc) return null;
  while (doc?.parentDocId) {
    const parent: DbDocument | null = await docs.findOne({ _id: doc.parentDocId, userId });
    if (!parent) break;
    doc = parent;
  }
  return doc._id;
}

async function getDescendantDocIds(rootIds: ObjectId[], userId: ObjectId): Promise<ObjectId[]> {
  const docs = await getDocumentsCollection();
  const allDocs = await docs
    .find({ userId })
    .project<{ _id: ObjectId; parentDocId?: ObjectId }>({ _id: 1, parentDocId: 1 })
    .toArray();
  const childrenByParent = new Map<string, ObjectId[]>();

  allDocs.forEach((doc) => {
    const parentId = doc.parentDocId?.toString();
    if (!parentId) return;
    const children = childrenByParent.get(parentId) ?? [];
    children.push(doc._id);
    childrenByParent.set(parentId, children);
  });

  const result = new Map(rootIds.map((id) => [id.toString(), id]));
  const queue = [...rootIds];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenByParent.get(current.toString()) ?? [];
    children.forEach((childId) => {
      if (result.has(childId.toString())) return;
      result.set(childId.toString(), childId);
      queue.push(childId);
    });
  }

  return Array.from(result.values());
}

const AddDocSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(500),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  tags: z.string().optional(), // comma-separated
  initialDelayDays: z.coerce.number().int().min(1).max(365).default(2),
  parentDocId: z.string().optional(),
});

export async function addDocumentAction(
  _prev: ActionResult<{ docId: string; similarMatches: SimilarityMatch[] }>,
  formData: FormData
): Promise<ActionResult<{ docId: string; similarMatches: SimilarityMatch[] }>> {
  const user = await requireAuth();

  const raw = {
    url: formData.get("url"),
    title: formData.get("title"),
    difficulty: formData.get("difficulty") || "medium",
    tags: formData.get("tags") || undefined,
    initialDelayDays: formData.get("initialDelayDays") || "2",
    parentDocId: formData.get("parentDocId") || undefined,
  };

  const parsed = AddDocSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { url, title, difficulty, tags: tagsRaw, initialDelayDays, parentDocId } = parsed.data;

  if (!isValidGoogleDocUrl(url)) {
    return { success: false, error: "Please provide a valid public Google Docs URL." };
  }

  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const docs = await getDocumentsCollection();

  // Check for duplicates
  const existing = await docs.findOne({ userId: new ObjectId(user.id), url });
  if (existing) {
    return { success: false, error: "You already have this document in your library." };
  }

  // Similarity check
  const allDocs = await docs.find({ userId: new ObjectId(user.id) }).toArray();
  const similarMatches: SimilarityMatch[] = allDocs
    .map((d) => {
      const titleSim = computeTitleSimilarity(title, d.title);
      const tagSim = computeTagOverlap(tags, d.tags);
      const score = titleSim * 0.7 + tagSim * 0.3;
      const reasons: string[] = [];
      if (titleSim > 0.3) reasons.push("similar title");
      if (tagSim > 0.3) reasons.push("shared tags");
      return { doc: serializeDoc(d), score, reason: reasons.join(" + ") };
    })
    .filter((m) => m.score > 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const now = new Date();
  const nextReviewDate = getCustomNextReviewDate(initialDelayDays);

  const docResult = await docs.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(user.id),
    url,
    title,
    status: "first_visit",
    difficulty,
    tags,
    isLinkBroken: false,
    parentDocId: parentDocId ? new ObjectId(parentDocId) : undefined,
    createdAt: now,
    updatedAt: now,
  });

  const reps = await getRepetitionsCollection();
  await reps.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(user.id),
    docId: docResult.insertedId,
    nextReviewDate,
    intervalDays: initialDelayDays,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/dashboard");
  revalidatePath("/documents");

  return {
    success: true,
    data: { docId: docResult.insertedId.toString(), similarMatches },
  };
}

export async function fetchDocTitleAction(url: string): Promise<ActionResult<{ title: string }>> {
  if (!isValidGoogleDocUrl(url)) {
    return { success: false, error: "Not a valid Google Docs URL." };
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; lostbae/1.0)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return { success: false, error: "Could not access this document. Make sure it is publicly shared." };
    }
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1] : "";
    title = title.replace(/ - Google Docs$/i, "").trim();
    if (!title) title = "Untitled Document";
    return { success: true, data: { title } };
  } catch {
    return { success: false, error: "Failed to fetch document title." };
  }
}

const UpdateDocSchema = z.object({
  docId: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  tags: z.string().optional(),
  status: z.enum(["first_visit", "revision", "updated", "completed"]).optional(),
});

export async function updateDocumentAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const raw = {
    docId: formData.get("docId"),
    difficulty: formData.get("difficulty"),
    tags: formData.get("tags"),
    status: formData.get("status"),
  };

  const parsed = UpdateDocSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { docId, difficulty, tags: tagsRaw, status } = parsed.data;
  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (difficulty) update.difficulty = difficulty;
  if (tagsRaw !== undefined) {
    update.tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }
  if (status) update.status = status;

  const docs = await getDocumentsCollection();
  await docs.updateOne(
    { _id: new ObjectId(docId), userId: new ObjectId(user.id) },
    { $set: update }
  );

  revalidatePath("/documents");
  revalidatePath(`/documents/${docId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateDocumentTitleAction(
  docId: string,
  title: string
): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = z.string().min(1, "Title can't be empty").max(500).safeParse(title.trim());
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const docs = await getDocumentsCollection();
  await docs.updateOne(
    { _id: new ObjectId(docId), userId: new ObjectId(user.id) },
    { $set: { title: parsed.data, updatedAt: new Date() } }
  );

  revalidatePath("/documents");
  revalidatePath(`/documents/${docId}`);
  return { success: true };
}

export async function addFileDocumentAction(data: {
  title: string;
  cloudinaryPublicId?: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  mediaType: MediaType;
  tags: string[];
  difficulty: Difficulty;
  delayDays: number;
}): Promise<ActionResult<{ docId: string }>> {
  const user = await requireAuth();

  const { title, cloudinaryPublicId, fileUrl, fileSize, mimeType, mediaType, tags, difficulty, delayDays } = data;

  if (!title || title.trim().length === 0) {
    return { success: false, error: "Title is required." };
  }

  const docs = await getDocumentsCollection();
  const now = new Date();
  const nextReviewDate = getCustomNextReviewDate(delayDays);

  const docResult = await docs.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(user.id),
    url: fileUrl,
    title: title.trim(),
    status: "first_visit",
    difficulty,
    tags,
    isLinkBroken: false,
    mediaType,
    cloudinaryPublicId,
    fileUrl,
    fileSize,
    mimeType,
    createdAt: now,
    updatedAt: now,
  });

  const reps = await getRepetitionsCollection();
  await reps.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(user.id),
    docId: docResult.insertedId,
    nextReviewDate,
    intervalDays: delayDays,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/dashboard");
  revalidatePath("/documents");

  return { success: true, data: { docId: docResult.insertedId.toString() } };
}

export async function deleteDocumentAction(docId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);

  const docs = await getDocumentsCollection();
  const targetId = new ObjectId(docId);
  const doc = await docs.findOne({ _id: targetId, userId });
  if (!doc) return { success: false, error: "Document not found." };

  const docIdsToDelete = await getDescendantDocIds([targetId], userId);
  const docsToDelete = await docs.find({ _id: { $in: docIdsToDelete }, userId }).toArray();

  // Delete Cloudinary asset if present (before removing MongoDB record)
  for (const docToDelete of docsToDelete) {
    if (!docToDelete.cloudinaryPublicId) continue;
    try {
      await deleteCloudinaryAsset(docToDelete.cloudinaryPublicId);
    } catch (err) {
      console.error("[deleteDocumentAction] Cloudinary deletion error (continuing):", err);
    }
  }

  await docs.deleteMany({ _id: { $in: docIdsToDelete }, userId });

  // Cascade delete
  const reps = await getRepetitionsCollection();
  await reps.deleteMany({ docId: { $in: docIdsToDelete } });

  const notes = await getNotesCollection();
  await notes.deleteMany({ docId: { $in: docIdsToDelete } });

  const terms = await getTermsCollection();
  await terms.deleteMany({ docId: { $in: docIdsToDelete } });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateDocumentThumbnailAction(
  docId: string,
  thumbnailUrl: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const trimmedUrl = thumbnailUrl.trim();

  if (trimmedUrl && !z.string().url().safeParse(trimmedUrl).success && !trimmedUrl.startsWith("data:image/")) {
    return { success: false, error: "Please use a valid image URL." };
  }

  const docs = await getDocumentsCollection();
  const result = await docs.updateOne(
    { _id: new ObjectId(docId), userId: new ObjectId(user.id) },
    trimmedUrl
      ? { $set: { thumbnailUrl: trimmedUrl, updatedAt: new Date() } }
      : { $unset: { thumbnailUrl: "" }, $set: { updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return { success: false, error: "Document not found." };
  }

  revalidatePath(`/documents/${docId}`);
  revalidatePath("/documents");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function bulkDeleteDocumentsAction(docIds: string[]): Promise<ActionResult> {
  const user = await requireAuth();
  if (!docIds.length) return { success: false, error: "No documents selected." };
  const userId = new ObjectId(user.id);

  const docs = await getDocumentsCollection();
  const reps = await getRepetitionsCollection();
  const notes = await getNotesCollection();
  const terms = await getTermsCollection();

  const objectIds = docIds.map((id) => new ObjectId(id));
  const allObjectIds = await getDescendantDocIds(objectIds, userId);

  // Delete Cloudinary assets for any file-backed docs
  const docsToDelete = await docs
    .find({ _id: { $in: allObjectIds }, userId })
    .toArray();

  for (const doc of docsToDelete) {
    if (doc.cloudinaryPublicId) {
      try {
        await deleteCloudinaryAsset(doc.cloudinaryPublicId);
      } catch (err) {
        console.error("[bulkDeleteDocumentsAction] Cloudinary error (continuing):", err);
      }
    }
  }

  await docs.deleteMany({ _id: { $in: allObjectIds }, userId });
  await reps.deleteMany({ docId: { $in: allObjectIds } });
  await notes.deleteMany({ docId: { $in: allObjectIds } });
  await terms.deleteMany({ docId: { $in: allObjectIds } });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rescheduleDocAction(
  docId: string,
  daysFromNow: number
): Promise<ActionResult> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const rootDocId = await resolveRootDocId(docId, userId);
  if (!rootDocId) return { success: false, error: "Document not found." };

  const nextReviewDate = getCustomNextReviewDate(daysFromNow);

  const reps = await getRepetitionsCollection();
  await reps.updateOne(
    { docId: rootDocId, userId },
    {
      $set: {
        nextReviewDate,
        intervalDays: daysFromNow,
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath("/dashboard");
  return { success: true };
}

export async function completeReviewAction(
  docId: string,
  confidence?: ReviewConfidence
): Promise<ActionResult> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);

  const docs = await getDocumentsCollection();
  const doc = await docs.findOne({ _id: new ObjectId(docId), userId });
  if (!doc) return { success: false, error: "Document not found." };
  const rootDocId = await resolveRootDocId(docId, userId);
  if (!rootDocId) return { success: false, error: "Document not found." };
  const rootDoc = await docs.findOne({ _id: rootDocId, userId });
  if (!rootDoc) return { success: false, error: "Parent document not found." };

  const reps = await getRepetitionsCollection();
  const rep = await reps.findOne({ docId: rootDocId, userId });
  if (!rep) return { success: false, error: "Repetition record not found." };

  const newReviewCount = rep.reviewCount + 1;
  const nextReviewDate = applyConfidence(
    getNextReviewDate(rootDoc.difficulty, newReviewCount),
    confidence
  );

  await reps.updateOne(
    { docId: rootDocId, userId },
    {
      $set: {
        nextReviewDate,
        reviewCount: newReviewCount,
        lastReviewedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  await docs.updateOne(
    { _id: rootDocId, userId },
    { $set: { status: "revision", updatedAt: new Date() } }
  );

  await logReviewEvent(userId, rootDocId, "document", confidence);

  revalidatePath("/dashboard");
  return { success: true };
}

/** Adjusts a computed next-review date by how confidently the user recalled it:
 *  "easy" pushes it ~50% further out, "struggled" pulls it back to tomorrow. */
function applyConfidence(base: Date, confidence?: ReviewConfidence): Date {
  if (!confidence || confidence === "okay") return base;
  const now = new Date();
  const days = Math.max(1, Math.round((base.getTime() - now.getTime()) / 86400000));
  if (confidence === "struggled") return getCustomNextReviewDate(1);
  return getCustomNextReviewDate(Math.max(1, Math.round(days * 1.5))); // easy
}

/** Documents whose content @-mentions this document (incoming backlinks). */
export async function getBacklinksAction(
  docId: string
): Promise<{ id: string; title: string }[]> {
  const user = await requireAuth();
  if (!ObjectId.isValid(docId)) return [];
  const docs = await getDocumentsCollection();
  // Mentions render as <a data-id="<docId>"> in stored content.
  const rows = await docs
    .find({
      userId: new ObjectId(user.id),
      _id: { $ne: new ObjectId(docId) },
      content: { $regex: `data-id="${docId}"` },
    })
    .project({ title: 1 })
    .limit(20)
    .toArray();
  return rows.map((r) => ({ id: r._id.toString(), title: (r.title as string) ?? "Untitled" }));
}

/** Sets a document's manual reading progress (0–100). */
export async function setReadingProgressAction(
  docId: string,
  progress: number
): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(docId)) return { success: false, error: "Invalid document." };
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const docs = await getDocumentsCollection();
  const res = await docs.updateOne(
    { _id: new ObjectId(docId), userId: new ObjectId(user.id) },
    { $set: { readingProgress: clamped, updatedAt: new Date() } }
  );
  if (res.matchedCount === 0) return { success: false, error: "Document not found." };
  revalidatePath("/documents");
  return { success: true };
}

/** Resolves a list of recently-opened doc ids to lightweight items, preserving
 *  the given order and silently dropping any that no longer exist. */
export async function getRecentDocsAction(
  ids: string[]
): Promise<{ id: string; title: string; mediaType?: string }[]> {
  const user = await requireAuth();
  const valid = ids.filter((id) => ObjectId.isValid(id)).slice(0, 8);
  if (valid.length === 0) return [];
  const docs = await getDocumentsCollection();
  const rows = await docs
    .find({ _id: { $in: valid.map((id) => new ObjectId(id)) }, userId: new ObjectId(user.id) })
    .project({ title: 1, mediaType: 1 })
    .toArray();
  const byId = new Map(rows.map((r) => [r._id.toString(), r]));
  return valid
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({ id: r._id.toString(), title: (r.title as string) ?? "Untitled", mediaType: r.mediaType as string | undefined }));
}

export async function markDocCompletedAction(docId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const rootDocId = await resolveRootDocId(docId, userId);
  if (!rootDocId) return { success: false, error: "Document not found." };

  const docs = await getDocumentsCollection();
  await docs.updateOne(
    { _id: rootDocId, userId },
    { $set: { status: "completed", updatedAt: new Date() } }
  );

  revalidatePath("/dashboard");
  revalidatePath("/documents");
  return { success: true };
}

export async function mergeDocumentsAction(
  childDocId: string,
  parentDocId: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const docs = await getDocumentsCollection();

  const parent = await docs.findOne({
    _id: new ObjectId(parentDocId),
    userId: new ObjectId(user.id),
  });
  const child = await docs.findOne({
    _id: new ObjectId(childDocId),
    userId: new ObjectId(user.id),
  });
  if (!parent || !child) return { success: false, error: "Document not found." };

  // Merge tags
  const combinedTags = Array.from(new Set([...parent.tags, ...child.tags]));

  await docs.updateOne(
    { _id: new ObjectId(childDocId) },
    {
      $set: {
        parentDocId: new ObjectId(parentDocId),
        updatedAt: new Date(),
      },
    }
  );
  await docs.updateOne(
    { _id: new ObjectId(parentDocId) },
    { $set: { tags: combinedTags, updatedAt: new Date() } }
  );

  const reps = await getRepetitionsCollection();
  await reps.deleteOne({ docId: new ObjectId(childDocId), userId: new ObjectId(user.id) });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getUserDocuments(filter?: {
  tags?: string[];
  search?: string;
  status?: string;
}): Promise<Document[]> {
  const user = await requireAuth();
  const docs = await getDocumentsCollection();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = topLevelDocumentQuery(new ObjectId(user.id));

  if (filter?.tags && filter.tags.length > 0) {
    query.tags = { $in: filter.tags };
  }
  if (filter?.status) {
    query.status = filter.status;
  }
  if (filter?.search) {
    query.$and.push({
      $or: [
        { title: { $regex: filter.search, $options: "i" } },
        { tags: { $regex: filter.search, $options: "i" } },
      ],
    });
  }

  // List views never render the body — omit `content` to keep the RSC
  // payload small (full content is re-fetched on the reading page).
  const results = await docs.find(query).project({ content: 0 }).sort({ createdAt: -1 }).toArray();
  return results.map((d) => serializeDoc(d as unknown as DbDocument));
}

export async function getAllUserTags(): Promise<{ tag: string; count: number }[]> {
  const user = await requireAuth();
  const docs = await getDocumentsCollection();

  const pipeline = [
    { $match: topLevelDocumentQuery(new ObjectId(user.id)) },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { tag: "$_id", count: 1, _id: 0 } },
  ];

  const result = await docs.aggregate<{ tag: string; count: number }>(pipeline).toArray();
  return result;
}

export async function createNativeDocumentAction(data: {
  title: string;
  content: string;
  tags: string[];
  difficulty: Difficulty;
  delayDays: number;
}): Promise<ActionResult<{ docId: string }>> {
  const user = await requireAuth();
  const { title, content, tags, difficulty, delayDays } = data;

  const docs = await getDocumentsCollection();
  const now = new Date();
  const nextReviewDate = getCustomNextReviewDate(delayDays);

  const docResult = await docs.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(user.id),
    url: "native://" + new ObjectId().toString(),
    title: title.trim(),
    status: "first_visit",
    difficulty,
    tags,
    isLinkBroken: false,
    mediaType: "native-doc",
    content,
    createdAt: now,
    updatedAt: now,
  });

  const reps = await getRepetitionsCollection();
  await reps.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(user.id),
    docId: docResult.insertedId,
    nextReviewDate,
    intervalDays: delayDays,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/dashboard");
  revalidatePath("/documents");

  return { success: true, data: { docId: docResult.insertedId.toString() } };
}

export async function createSubPageAction(
  parentDocId: string,
  title: string
): Promise<ActionResult<{ docId: string }>> {
  const user = await requireAuth();
  const docs = await getDocumentsCollection();

  const parent = await docs.findOne({
    _id: new ObjectId(parentDocId),
    userId: new ObjectId(user.id),
  });
  if (!parent) return { success: false, error: "Parent document not found." };

  const now = new Date();
  const childId = new ObjectId();
  await docs.insertOne({
    _id: childId,
    userId: new ObjectId(user.id),
    url: `native://${childId.toString()}`,
    title: title.trim() || "Untitled Page",
    status: "first_visit",
    difficulty: parent.difficulty,
    tags: parent.tags,
    isLinkBroken: false,
    parentDocId: parent._id,
    mediaType: "native-doc",
    content: "",
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${parentDocId}`);
  revalidatePath("/dashboard");

  return { success: true, data: { docId: childId.toString() } };
}

export async function updateDocumentContentAction(
  docId: string,
  content: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const docs = await getDocumentsCollection();

  await docs.updateOne(
    { _id: new ObjectId(docId), userId: new ObjectId(user.id) },
    { $set: { content, updatedAt: new Date() } }
  );

  revalidatePath("/documents");
  revalidatePath(`/documents/${docId}`);
  revalidatePath(`/study/${docId}`);

  return { success: true };
}
