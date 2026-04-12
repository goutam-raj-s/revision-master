import { ObjectId, type Collection } from "mongodb";
import { getDb } from "./client";
import type {
  DbUser,
  DbSession,
  DbDocument,
  DbRepetition,
  DbNote,
  DbTerm,
  Document,
  Note,
  Repetition,
  Term,
  User,
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

// ─── Index setup ───────────────────────────────────────────────────────────────

export async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  await db.collection("users").createIndexes([
    { key: { email: 1 }, unique: true },
  ]);

  await db.collection("sessions").createIndexes([
    { key: { token: 1 }, unique: true },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ]);

  await db.collection("documents").createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { userId: 1, tags: 1 } },
    { key: { userId: 1, title: "text", tags: "text" } },
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
    docId: t.docId.toString(),
    term: t.term,
    definition: t.definition,
    isDone: t.isDone,
    nextReviewDate: t.nextReviewDate?.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// ─── Common queries ────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<DbUser | null> {
  const col = await getUsersCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

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
