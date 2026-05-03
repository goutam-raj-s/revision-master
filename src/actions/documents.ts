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
  serializeRepetition,
} from "@/lib/db/collections";
import { getCustomNextReviewDate, getNextReviewDate } from "@/lib/srs/engine";
import {
  isValidGoogleDocUrl,
  computeTitleSimilarity,
  computeTagOverlap,
} from "@/lib/utils";
import type { ActionResult, Document, SimilarityMatch, MediaType, Difficulty } from "@/types";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

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

  const docs = await getDocumentsCollection();
  const doc = await docs.findOne({ _id: new ObjectId(docId), userId: new ObjectId(user.id) });

  // Delete Cloudinary asset if present (before removing MongoDB record)
  if (doc?.cloudinaryPublicId) {
    try {
      await deleteCloudinaryAsset(doc.cloudinaryPublicId);
    } catch (err) {
      console.error("[deleteDocumentAction] Cloudinary deletion error (continuing):", err);
    }
  }

  await docs.deleteOne({ _id: new ObjectId(docId), userId: new ObjectId(user.id) });

  // Cascade delete
  const reps = await getRepetitionsCollection();
  await reps.deleteOne({ docId: new ObjectId(docId) });

  const notes = await getNotesCollection();
  await notes.deleteMany({ docId: new ObjectId(docId) });

  const terms = await getTermsCollection();
  await terms.deleteMany({ docId: new ObjectId(docId) });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function bulkDeleteDocumentsAction(docIds: string[]): Promise<ActionResult> {
  const user = await requireAuth();
  if (!docIds.length) return { success: false, error: "No documents selected." };

  const docs = await getDocumentsCollection();
  const reps = await getRepetitionsCollection();
  const notes = await getNotesCollection();
  const terms = await getTermsCollection();

  const objectIds = docIds.map((id) => new ObjectId(id));

  // Delete Cloudinary assets for any file-backed docs
  const docsToDelete = await docs
    .find({ _id: { $in: objectIds }, userId: new ObjectId(user.id) })
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

  await docs.deleteMany({ _id: { $in: objectIds }, userId: new ObjectId(user.id) });
  await reps.deleteMany({ docId: { $in: objectIds } });
  await notes.deleteMany({ docId: { $in: objectIds } });
  await terms.deleteMany({ docId: { $in: objectIds } });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rescheduleDocAction(
  docId: string,
  daysFromNow: number
): Promise<ActionResult> {
  const user = await requireAuth();
  const nextReviewDate = getCustomNextReviewDate(daysFromNow);

  const reps = await getRepetitionsCollection();
  await reps.updateOne(
    { docId: new ObjectId(docId), userId: new ObjectId(user.id) },
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
  docId: string
): Promise<ActionResult> {
  const user = await requireAuth();

  const docs = await getDocumentsCollection();
  const doc = await docs.findOne({ _id: new ObjectId(docId), userId: new ObjectId(user.id) });
  if (!doc) return { success: false, error: "Document not found." };

  const reps = await getRepetitionsCollection();
  const rep = await reps.findOne({ docId: new ObjectId(docId) });
  if (!rep) return { success: false, error: "Repetition record not found." };

  const newReviewCount = rep.reviewCount + 1;
  const nextReviewDate = getNextReviewDate(doc.difficulty, newReviewCount);

  await reps.updateOne(
    { docId: new ObjectId(docId) },
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
    { _id: new ObjectId(docId) },
    { $set: { status: "revision", updatedAt: new Date() } }
  );

  revalidatePath("/dashboard");
  return { success: true };
}

export async function markDocCompletedAction(docId: string): Promise<ActionResult> {
  const user = await requireAuth();

  const docs = await getDocumentsCollection();
  await docs.updateOne(
    { _id: new ObjectId(docId), userId: new ObjectId(user.id) },
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
  const query: Record<string, any> = { userId: new ObjectId(user.id) };

  if (filter?.tags && filter.tags.length > 0) {
    query.tags = { $in: filter.tags };
  }
  if (filter?.status) {
    query.status = filter.status;
  }
  if (filter?.search) {
    query.$or = [
      { title: { $regex: filter.search, $options: "i" } },
      { tags: { $regex: filter.search, $options: "i" } },
    ];
  }

  const results = await docs.find(query).sort({ createdAt: -1 }).toArray();
  return results.map(serializeDoc);
}

export async function getAllUserTags(): Promise<{ tag: string; count: number }[]> {
  const user = await requireAuth();
  const docs = await getDocumentsCollection();

  const pipeline = [
    { $match: { userId: new ObjectId(user.id) } },
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
