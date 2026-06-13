import { ObjectId, type Collection } from "mongodb";
import { cache } from "react";
import { getDb } from "./client";
import type {
  DbUser,
  DbSession,
  DbDocument,
  DbRepetition,
  DbNote,
  DbTerm,
  DbPasswordResetToken,
  DbYoutubeSession,
  DbYoutubeBookmark,
  DbYoutubePlaylist,
  DbDocumentShare,
  DbGoogleIntegration,
  Document,
  DocumentTreeNode,
  Note,
  Repetition,
  Term,
  User,
  YoutubeSession,
  YoutubeBookmark,
  YoutubePlaylist,
  DbLoginRecord,
  DbReviewEvent,
  DbStatShare,
  DbYoutubeShare,
  YoutubeShare,
} from "@/types";

// ─── Collection accessors ──────────────────────────────────────────────────────

export async function getUsersCollection(): Promise<Collection<DbUser>> {
  const db = await getDb();
  return db.collection<DbUser>("users");
}

export async function getSessionsCollection(): Promise<Collection<DbSession>> {
  const db = await getDb();
  return db.collection<DbSession>("sessions");
}

export async function getDocumentsCollection(): Promise<Collection<DbDocument>> {
  const db = await getDb();
  return db.collection<DbDocument>("documents");
}

export async function getRepetitionsCollection(): Promise<Collection<DbRepetition>> {
  const db = await getDb();
  return db.collection<DbRepetition>("repetitions");
}

export async function getNotesCollection(): Promise<Collection<DbNote>> {
  const db = await getDb();
  return db.collection<DbNote>("notes");
}

export async function getTermsCollection(): Promise<Collection<DbTerm>> {
  const db = await getDb();
  return db.collection<DbTerm>("terms");
}

export async function getPasswordResetTokensCollection(): Promise<Collection<DbPasswordResetToken>> {
  const db = await getDb();
  return db.collection<DbPasswordResetToken>("password_reset_tokens");
}

export async function getLoginRecordsCollection(): Promise<Collection<DbLoginRecord>> {
  const db = await getDb();
  return db.collection<DbLoginRecord>("login-records");
}

export async function getReviewEventsCollection(): Promise<Collection<DbReviewEvent>> {
  const db = await getDb();
  return db.collection<DbReviewEvent>("review_events");
}

export async function getStatSharesCollection(): Promise<Collection<DbStatShare>> {
  const db = await getDb();
  return db.collection<DbStatShare>("stat_shares");
}

export async function getYoutubeSessionsCollection(): Promise<Collection<DbYoutubeSession>> {
  const db = await getDb();
  return db.collection<DbYoutubeSession>("youtube_sessions");
}

export async function getYoutubeBookmarksCollection(): Promise<Collection<DbYoutubeBookmark>> {
  const db = await getDb();
  return db.collection<DbYoutubeBookmark>("youtube_bookmarks");
}

export async function getYoutubePlaylistsCollection(): Promise<Collection<DbYoutubePlaylist>> {
  const db = await getDb();
  return db.collection<DbYoutubePlaylist>("youtube_playlists");
}

export async function getYoutubeRepetitionsCollection(): Promise<Collection<DbRepetition>> {
  const db = await getDb();
  return db.collection<DbRepetition>("youtube_repetitions");
}

export async function getDocumentSharesCollection(): Promise<Collection<DbDocumentShare>> {
  const db = await getDb();
  return db.collection<DbDocumentShare>("document_shares");
}

export async function getYoutubeSharesCollection(): Promise<Collection<DbYoutubeShare>> {
  const db = await getDb();
  return db.collection<DbYoutubeShare>("youtube_shares");
}

export async function getGoogleIntegrationsCollection(): Promise<Collection<DbGoogleIntegration>> {
  const db = await getDb();
  return db.collection<DbGoogleIntegration>("google_integrations");
}

export async function getShareByToken(token: string): Promise<DbDocumentShare | null> {
  const shares = await getDocumentSharesCollection();
  return shares.findOne({ token });
}

export async function getYoutubeShareByToken(token: string): Promise<DbYoutubeShare | null> {
  const shares = await getYoutubeSharesCollection();
  return shares.findOne({ token });
}

export function serializeYoutubeShare(s: DbYoutubeShare): YoutubeShare {
  return {
    id: s._id.toString(),
    token: s.token,
    ownerId: s.ownerId.toString(),
    resourceType: s.resourceType,
    resourceId: s.resourceId.toString(),
    accessLevel: s.accessLevel,
    shareType: s.shareType,
    emails: s.emails,
    title: s.title,
    createdAt: s.createdAt.toISOString(),
  };
}

// ─── Index setup ───────────────────────────────────────────────────────────────

export async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  await db.collection("users").createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { provider: 1, providerAccountId: 1 }, unique: true, sparse: true },
  ]);

  await db.collection("password_reset_tokens").createIndexes([
    { key: { token: 1 }, unique: true },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ]);

  await db.collection("sessions").createIndexes([
    { key: { token: 1 }, unique: true },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ]);

  await db.collection("documents").createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { userId: 1, tags: 1 } },
    { key: { userId: 1, title: "text", tags: "text" } },
    { key: { userId: 1, mediaType: 1 } },
    { key: { userId: 1, googleDriveFileId: 1 }, unique: true, sparse: true },
  ]);

  await db.collection("repetitions").createIndexes([
    { key: { userId: 1, nextReviewDate: 1 } },
    { key: { docId: 1 }, unique: true },
  ]);

  await db.collection("notes").createIndexes([
    { key: { docId: 1, createdAt: -1 } },
  ]);

  await db.collection("review_events").createIndexes([
    { key: { userId: 1, reviewedAt: -1 } },
    { key: { userId: 1, dayKey: 1 } },
  ]);

  await db.collection("terms").createIndexes([
    { key: { userId: 1, term: 1 } },
    { key: { docId: 1 } },
  ]);

  await db.collection("youtube_sessions").createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { userId: 1, videoId: 1 } },
  ]);

  await db.collection("youtube_bookmarks").createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { userId: 1, youtubeId: 1 }, unique: true },
  ]);

  await db.collection("youtube_playlists").createIndexes([
    { key: { userId: 1, createdAt: -1 } },
  ]);

  await db.collection("youtube_repetitions").createIndexes([
    { key: { userId: 1, nextReviewDate: 1 } },
    { key: { docId: 1 }, unique: true },
  ]);

  await db.collection("google_integrations").createIndexes([
    { key: { userId: 1, provider: 1 }, unique: true },
  ]);

}

// ─── Serializers ───────────────────────────────────────────────────────────────

export function serializeUser(u: DbUser): User {
  return {
    id: u._id.toString(),
    email: u.email,
    name: u.name,
    role: u.role,
    hasGeminiKey: !!u.geminiApiKeyEncrypted,
  };
}

export function serializeDoc(d: DbDocument): Document {
  return {
    id: d._id.toString(),
    url: d.url,
    title: d.title,
    status: d.status,
    difficulty: d.difficulty,
    tags: d.tags,
    isLinkBroken: d.isLinkBroken,
    parentDocId: d.parentDocId?.toString(),
    mediaType: d.mediaType ?? "google-doc",
    cloudinaryPublicId: d.cloudinaryPublicId,
    fileUrl: d.fileUrl,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    thumbnailUrl: d.thumbnailUrl,
    isFavourite: d.isFavourite ?? false,
    playCount: d.playCount ?? 0,
    lastPlayedAt: d.lastPlayedAt?.toISOString(),
    content: d.content,
    readingProgress: d.readingProgress,
    source: d.source,
    googleDriveFileId: d.googleDriveFileId,
    googleDriveModifiedTime: d.googleDriveModifiedTime?.toISOString(),
    googleDriveVersion: d.googleDriveVersion,
    googleDriveWebViewLink: d.googleDriveWebViewLink,
    googleDriveSyncStatus: d.googleDriveSyncStatus,
    googleDriveSyncError: d.googleDriveSyncError,
    lastSyncedAt: d.lastSyncedAt?.toISOString(),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export function serializeRepetition(r: DbRepetition): Repetition {
  return {
    id: r._id.toString(),
    docId: r.docId.toString(),
    nextReviewDate: r.nextReviewDate.toISOString(),
    intervalDays: r.intervalDays,
    reviewCount: r.reviewCount,
    lastReviewedAt: r.lastReviewedAt?.toISOString(),
  };
}

export function serializeNote(n: DbNote): Note {
  return {
    id: n._id.toString(),
    docId: n.docId.toString(),
    content: n.content,
    isDone: n.isDone,
    nextReviewDate: n.nextReviewDate?.toISOString(),
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

export function serializeTerm(t: DbTerm): Term {
  return {
    id: t._id.toString(),
    docId: t.docId?.toString(),
    term: t.term,
    definition: t.definition,
    imageUrl: t.imageUrl,
    thumbnailUrl: t.thumbnailUrl,
    isDone: t.isDone,
    nextReviewDate: t.nextReviewDate?.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function serializeYoutubeSession(s: DbYoutubeSession): YoutubeSession {
  return {
    id: s._id.toString(),
    videoId: s.videoId,
    videoTitle: s.videoTitle,
    thumbnailUrl: s.thumbnailUrl,
    videoUrl: s.videoUrl,
    sourceType: s.sourceType ?? "youtube",
    playerType: s.playerType ?? "youtube",
    notes: s.notes,
    tags: s.tags,
    difficulty: s.difficulty,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function serializeYoutubeBookmark(b: DbYoutubeBookmark): YoutubeBookmark {
  return {
    id: b._id.toString(),
    type: b.type,
    youtubeId: b.youtubeId,
    title: b.title,
    thumbnailUrl: b.thumbnailUrl,
    ...(b.videos ? { videos: b.videos } : {}),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

export function serializeYoutubePlaylist(p: DbYoutubePlaylist, items: YoutubePlaylist["items"] = []): YoutubePlaylist {
  return {
    id: p._id.toString(),
    name: p.name,
    sessionIds: p.sessionIds.map((id) => id.toString()),
    items,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ─── Common queries ────────────────────────────────────────────────────────────

export const getUserById = cache(async function getUserById(id: string): Promise<DbUser | null> {
  const col = await getUsersCollection();
  return col.findOne({ _id: new ObjectId(id) });
});

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const col = await getUsersCollection();
  return col.findOne({ email: email.toLowerCase() });
}

export async function getDocById(id: string, userId: string): Promise<DbDocument | null> {
  const col = await getDocumentsCollection();
  return col.findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
}

export async function getRootDocForDoc(id: string, userId: string): Promise<DbDocument | null> {
  const col = await getDocumentsCollection();
  const userObjectId = new ObjectId(userId);
  let doc: DbDocument | null = await col.findOne({ _id: new ObjectId(id), userId: userObjectId });
  if (!doc) return null;

  while (doc?.parentDocId) {
    const parent: DbDocument | null = await col.findOne({ _id: doc.parentDocId, userId: userObjectId });
    if (!parent) break;
    doc = parent;
  }

  return doc;
}

export async function getRepetitionByDocId(docId: string): Promise<DbRepetition | null> {
  const col = await getRepetitionsCollection();
  return col.findOne({ docId: new ObjectId(docId) });
}

export async function getSubPages(docId: string, userId: string): Promise<DbDocument[]> {
  const col = await getDocumentsCollection();
  return col.find({ parentDocId: new ObjectId(docId), userId: new ObjectId(userId) }).sort({ createdAt: 1 }).toArray();
}

export async function getDocumentTree(rootDocId: string, userId: string): Promise<DocumentTreeNode[]> {
  const col = await getDocumentsCollection();
  const userObjectId = new ObjectId(userId);
  const rootObjectId = new ObjectId(rootDocId);
  const docs = await col.find({ userId: userObjectId }).sort({ createdAt: 1 }).toArray();
  const nodes = new Map<string, DocumentTreeNode>();

  docs.forEach((doc) => {
    nodes.set(doc._id.toString(), { ...serializeDoc(doc), children: [] });
  });

  const root = nodes.get(rootObjectId.toString());
  if (!root) return [];

  docs.forEach((doc) => {
    const parentId = doc.parentDocId?.toString();
    if (!parentId) return;
    const parent = nodes.get(parentId);
    const child = nodes.get(doc._id.toString());
    if (parent && child) parent.children.push(child);
  });

  return [root];
}
