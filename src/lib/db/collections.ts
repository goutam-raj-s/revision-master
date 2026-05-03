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
  DbUdemySession,
  DbPlaylist,
  Document,
  Note,
  Repetition,
  Term,
  User,
  YoutubeSession,
  YoutubeBookmark,
  UdemySession,
  Playlist,
  DbLoginRecord,
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

export async function getYoutubeSessionsCollection(): Promise<Collection<DbYoutubeSession>> {
  const db = await getDb();
  return db.collection<DbYoutubeSession>("youtube_sessions");
}

export async function getYoutubeBookmarksCollection(): Promise<Collection<DbYoutubeBookmark>> {
  const db = await getDb();
  return db.collection<DbYoutubeBookmark>("youtube_bookmarks");
}

export async function getYoutubeRepetitionsCollection(): Promise<Collection<DbRepetition>> {
  const db = await getDb();
  return db.collection<DbRepetition>("youtube_repetitions");
}

export async function getUdemySessionsCollection(): Promise<Collection<DbUdemySession>> {
  const db = await getDb();
  return db.collection<DbUdemySession>("udemy_sessions");
}

export async function getPlaylistsCollection(): Promise<Collection<DbPlaylist>> {
  const db = await getDb();
  return db.collection<DbPlaylist>("playlists");
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
  ]);

  await db.collection("playlists").createIndexes([
    { key: { userId: 1, createdAt: -1 } },
  ]);

  await db.collection("repetitions").createIndexes([
    { key: { userId: 1, nextReviewDate: 1 } },
    { key: { docId: 1 }, unique: true },
  ]);

  await db.collection("notes").createIndexes([
    { key: { docId: 1, createdAt: -1 } },
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

  await db.collection("youtube_repetitions").createIndexes([
    { key: { userId: 1, nextReviewDate: 1 } },
    { key: { docId: 1 }, unique: true },
  ]);

  await db.collection("udemy_sessions").createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { userId: 1, courseSlug: 1 } },
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
    isFavourite: d.isFavourite ?? false,
    playCount: d.playCount ?? 0,
    lastPlayedAt: d.lastPlayedAt?.toISOString(),
    content: d.content,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export function serializePlaylist(p: DbPlaylist): Playlist {
  return {
    id: p._id.toString(),
    name: p.name,
    trackIds: p.trackIds.map((id) => id.toString()),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
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
    docId: t.docId.toString(),
    term: t.term,
    definition: t.definition,
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
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

export function serializeUdemySession(s: DbUdemySession): UdemySession {
  return {
    id: s._id.toString(),
    courseSlug: s.courseSlug,
    lectureId: s.lectureId,
    lectureTitle: s.lectureTitle,
    courseTitle: s.courseTitle,
    courseUrl: s.courseUrl,
    notes: s.notes,
    tags: s.tags,
    difficulty: s.difficulty,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
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

export async function getRepetitionByDocId(docId: string): Promise<DbRepetition | null> {
  const col = await getRepetitionsCollection();
  return col.findOne({ docId: new ObjectId(docId) });
}
