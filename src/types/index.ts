import type { ObjectId } from "mongodb";

export type DocumentStatus = "first_visit" | "revision" | "updated" | "completed";
export type Difficulty = "easy" | "medium" | "hard";
export type UserRole = "user" | "admin";
export type TaskFilter = "today" | "pending" | "upcoming" | "all";
export type MediaType = "google-doc" | "pdf" | "audio" | "video" | "image" | "document";

// ─── MongoDB Documents ─────────────────────────────────────────────────────────

export interface DbUser {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  geminiApiKeyEncrypted?: string;
  provider?: "email" | "google" | "github" | "discord";
  providerAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbPasswordResetToken {
  _id: ObjectId;
  userId: ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
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
  mediaType?: MediaType;
  cloudinaryPublicId?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  isFavourite?: boolean;
  playCount?: number;
  lastPlayedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbPlaylist {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  trackIds: ObjectId[];
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
  mediaType?: MediaType;
  cloudinaryPublicId?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  isFavourite?: boolean;
  playCount?: number;
  lastPlayedAt?: string;
  createdAt: string;
  updatedAt: string;
  nextReviewDate?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
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

// ─── YouTube Sessions ──────────────────────────────────────────────────────────

export interface DbYoutubeSession {
  _id: ObjectId;
  userId: ObjectId;
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
  notes: string;
  tags: string[];
  difficulty: Difficulty;
  createdAt: Date;
  updatedAt: Date;
}

export interface YoutubeSession {
  id: string;
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
  notes: string;
  tags: string[];
  difficulty: Difficulty;
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

export interface YoutubeTaskItem {
  source: "youtube";
  session: YoutubeSession;
  repetition: Repetition;
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
