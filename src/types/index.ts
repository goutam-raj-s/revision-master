import type { ObjectId } from "mongodb";

export type DocumentStatus = "first_visit" | "revision" | "updated" | "completed";
export type Difficulty = "easy" | "medium" | "hard";
export type UserRole = "user" | "admin";
export type TaskFilter = "today" | "pending" | "upcoming" | "all";

// ─── MongoDB Documents ─────────────────────────────────────────────────────────

export interface DbUser {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  geminiApiKeyEncrypted?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbSession {
  _id: ObjectId;
  userId: ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface DbDocument {
  _id: ObjectId;
  userId: ObjectId;
  url: string;
  title: string;
  cachedTitle?: string;
  status: DocumentStatus;
  difficulty: Difficulty;
  tags: string[];
  isLinkBroken: boolean;
  lastValidatedAt?: Date;
  parentDocId?: ObjectId; // for merge/topic tree
  createdAt: Date;
  updatedAt: Date;
}

export interface DbRepetition {
  _id: ObjectId;
  userId: ObjectId;
  docId: ObjectId;
  nextReviewDate: Date;
  intervalDays: number;
  reviewCount: number;
  lastReviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbNote {
  _id: ObjectId;
  userId: ObjectId;
  docId: ObjectId;
  content: string;
  isDone: boolean;
  nextReviewDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbTerm {
  _id: ObjectId;
  userId: ObjectId;
  docId: ObjectId;
  term: string;
  definition: string;
  isDone: boolean;
  nextReviewDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Serialized (client-safe) types ───────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  hasGeminiKey: boolean;
}

export interface Document {
  id: string;
  url: string;
  title: string;
  status: DocumentStatus;
  difficulty: Difficulty;
  tags: string[];
  isLinkBroken: boolean;
  parentDocId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Repetition {
  id: string;
  docId: string;
  nextReviewDate: string;
  intervalDays: number;
  reviewCount: number;
  lastReviewedAt?: string;
}

export interface Note {
  id: string;
  docId: string;
  content: string;
  isDone: boolean;
  nextReviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Term {
  id: string;
  docId: string;
  term: string;
  definition: string;
  isDone: boolean;
  nextReviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Task Queue ────────────────────────────────────────────────────────────────

export interface TaskItem {
  doc: Document;
  repetition: Repetition;
  notes: Note[];
  urgency: "today" | "upcoming" | "overdue";
}

// ─── Dashboard Analytics ───────────────────────────────────────────────────────

export interface DashboardStats {
  totalDocs: number;
  pendingRevisions: number;
  totalCompleted: number;
  mostRepeatedTopics: { tag: string; count: number }[];
  leastRevisedAreas: { tag: string; daysSinceLastRevision: number }[];
}

// ─── Similarity ────────────────────────────────────────────────────────────────

export interface SimilarityMatch {
  doc: Document;
  score: number;
  reason: string;
}

// ─── Server Action Results ─────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
