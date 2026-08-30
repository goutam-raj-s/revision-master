import type { ObjectId } from "mongodb";

export type DocumentStatus = "first_visit" | "revision" | "updated" | "completed";
export type Difficulty = "easy" | "medium" | "hard";
export type UserRole = "user" | "admin";
export type TaskFilter = "today" | "pending" | "upcoming" | "all";
export type MediaType = "google-doc" | "pdf" | "audio" | "video" | "image" | "document" | "native-doc";

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
  emailReminders?: boolean;
  lastReminderSentAt?: Date;
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

export interface DbReviewEvent {
  _id: ObjectId;
  userId: ObjectId;
  docId?: ObjectId;
  source: "document" | "youtube";
  reviewedAt: Date;
  /** Local calendar day key (YYYY-MM-DD) for streak/heatmap aggregation. */
  dayKey: string;
  /** How well the user recalled this item. */
  confidence?: "easy" | "okay" | "struggled";
}

export interface DbLoginRecord {
  _id: ObjectId;
  userAgent: string;
  ipAddress: string;
  accessedAt: Date;
}

export interface DbSession {
  _id: ObjectId;
  userId: ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export type DocumentSource = "manual" | "google-picker" | "upload" | "native";
export type GoogleDriveSyncStatus = "synced" | "needs_sync" | "needs_reconnect" | "error";

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
  thumbnailUrl?: string;
  isFavourite?: boolean;
  playCount?: number;
  lastPlayedAt?: Date;
  content?: string; // For native documents (TipTap JSON/HTML)
  aiSummary?: string; // AI-generated study summary (Markdown)
  aiSummaryGeneratedAt?: Date;
  isHidden?: boolean; // private doc — only visible when "reveal" is toggled
  readingProgress?: number; // 0–100, manual reading progress
  // Google Drive sync fields
  source?: DocumentSource;
  googleDriveFileId?: string;
  googleDriveModifiedTime?: Date;
  googleDriveVersion?: string;
  googleDriveWebViewLink?: string;
  googleDriveExportMimeType?: string;
  googleDriveSyncStatus?: GoogleDriveSyncStatus;
  googleDriveSyncError?: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbGoogleIntegration {
  _id: ObjectId;
  userId: ObjectId;
  provider: "google";
  scopes: string[];
  refreshTokenEncrypted?: string;
  accessToken?: string;
  accessTokenExpiresAt?: Date;
  connectedAt: Date;
  updatedAt: Date;
}

export interface DbYoutubePlaylist {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  sessionIds: ObjectId[];
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
  docId?: ObjectId;
  term: string;
  definition: string;
  example?: string;
  antiExample?: string;
  relatedTerms?: string[];
  imageUrl?: string;
  thumbnailUrl?: string;
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
  thumbnailUrl?: string;
  isFavourite?: boolean;
  playCount?: number;
  lastPlayedAt?: string;
  content?: string;
  aiSummary?: string;
  aiSummaryGeneratedAt?: string;
  isHidden?: boolean;
  readingProgress?: number;
  // Google Drive sync fields
  source?: DocumentSource;
  googleDriveFileId?: string;
  googleDriveModifiedTime?: string;
  googleDriveVersion?: string;
  googleDriveWebViewLink?: string;
  googleDriveSyncStatus?: GoogleDriveSyncStatus;
  googleDriveSyncError?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  nextReviewDate?: string;
}

export interface DocumentTreeNode extends Document {
  children: DocumentTreeNode[];
}

export interface YoutubePlaylistItem {
  sessionId: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  sourceType: "youtube" | "external";
}

export interface YoutubePlaylist {
  id: string;
  name: string;
  sessionIds: string[];
  items: YoutubePlaylistItem[];
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
  docId?: string;
  term: string;
  definition: string;
  example?: string;
  antiExample?: string;
  relatedTerms?: string[];
  imageUrl?: string;
  thumbnailUrl?: string;
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
  sourceType?: "youtube" | "external";
  playerType?: "youtube" | "direct" | "iframe";
  notes: string;
  tags: string[];
  difficulty: Difficulty;
  status?: "active" | "completed";
  transcript?: string; // cached video transcript (for AI context)
  aiSummary?: string;
  aiSummaryGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface YoutubeSession {
  id: string;
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
  sourceType: "youtube" | "external";
  playerType: "youtube" | "direct" | "iframe";
  notes: string;
  tags: string[];
  difficulty: Difficulty;
  aiSummary?: string;
  aiSummaryGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── AI chat (per user, per document/video/glossary) ────────────────────────
export type AiContextKind = "document" | "video" | "glossary";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  at: Date;
}

export interface DbAiChat {
  _id: ObjectId;
  userId: ObjectId;
  contextKind: AiContextKind;
  contextId: string;
  messages: AiChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaylistVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

export interface DbYoutubeBookmark {
  _id: ObjectId;
  userId: ObjectId;
  type: "video" | "playlist";
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  /** For playlists: the persisted video list so it survives YouTube fetch glitches. */
  videos?: PlaylistVideo[];
  createdAt: Date;
  updatedAt: Date;
}

export interface YoutubeBookmark {
  id: string;
  type: "video" | "playlist";
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  videos?: PlaylistVideo[];
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

export interface DbStatShare {
  _id: ObjectId;
  token: string;
  userId: ObjectId;
  name: string;
  createdAt: Date;
}

export type PostPlatform = "linkedin" | "twitter" | "instagram" | "other";
export type PostStatus = "draft" | "scheduled" | "published";

export interface PostImageAttachment {
  imageDataUrl: string;
  imageName?: string;
  imageMimeType?: string;
}

export interface DbPostDraft {
  _id: ObjectId;
  userId: ObjectId;
  platform: PostPlatform;
  status: PostStatus;
  body: string;
  images?: PostImageAttachment[];
  imageDataUrl?: string;
  imageName?: string;
  imageMimeType?: string;
  scheduledFor?: Date;
  publishedUrl?: string;
  providerPostId?: string;
  publishError?: string;
  docId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostDraft {
  id: string;
  platform: PostPlatform;
  status: PostStatus;
  body: string;
  images?: PostImageAttachment[];
  imageDataUrl?: string;
  imageName?: string;
  imageMimeType?: string;
  scheduledFor?: string;
  publishedUrl?: string;
  providerPostId?: string;
  publishError?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Social connections (direct publishing) ─────────────────────────────────
export type SocialProvider = "linkedin" | "twitter";

export interface DbSocialConnection {
  _id: ObjectId;
  userId: ObjectId;
  provider: SocialProvider;
  providerUserId: string;
  displayName?: string;
  accessToken: string;
  accessTokenExpiresAt?: Date;
  refreshTokenEncrypted?: string;
  scopes: string[];
  connectedAt: Date;
  updatedAt: Date;
}

export interface SocialConnection {
  provider: SocialProvider;
  displayName?: string;
  connectedAt: string;
  expiresAt?: string;
  expired: boolean;
}

export interface DbTopicCollection {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  docIds: ObjectId[];
  publicToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopicCollection {
  id: string;
  name: string;
  docCount: number;
  publicToken?: string;
  createdAt: string;
}

// ─── Document Shares ───────────────────────────────────────────────────────────

export interface DbDocumentShare {
  _id: ObjectId;
  token: string;
  docId: ObjectId;
  ownerId: ObjectId;
  shareType: "public" | "email";
  /** "read" = view-only (default for existing records). "write" = full edit access. */
  accessLevel: "read" | "write";
  emails?: string[];
  createdAt: Date;
}

export interface DocumentShare {
  id: string;
  token: string;
  docId: string;
  ownerId: string;
  shareType: "public" | "email";
  accessLevel: "read" | "write";
  emails?: string[];
  createdAt: string;
}

// ─── YouTube Shares ────────────────────────────────────────────────────────────

export interface DbYoutubeShare {
  _id: ObjectId;
  token: string;
  ownerId: ObjectId;
  resourceType: "session" | "playlist";
  resourceId: ObjectId;
  accessLevel: "read" | "write";
  shareType: "public" | "email";
  emails?: string[];
  title: string;
  createdAt: Date;
}

export interface YoutubeShare {
  id: string;
  token: string;
  ownerId: string;
  resourceType: "session" | "playlist";
  resourceId: string;
  accessLevel: "read" | "write";
  shareType: "public" | "email";
  emails?: string[];
  title: string;
  createdAt: string;
}

// ─── Calorie Tracking ──────────────────────────────────────────────────────────

/** How per-unit calories are expressed for a dish. */
export type FoodUnit = "per100g" | "perPiece";
export type CalorieEntryKind = "food" | "exercise";

export interface DbCalorieEntry {
  _id: ObjectId;
  userId: ObjectId;
  /** Local calendar day key (YYYY-MM-DD), computed client-side. */
  dayKey: string;
  kind: CalorieEntryKind;
  name: string;
  /** Normalized name (lowercase, collapsed whitespace) for autofill matching. */
  nameKey: string;
  /** Food only. */
  unit?: FoodUnit;
  /** Food only: grams when per100g, pieces when perPiece. */
  quantity?: number;
  /** Food only: kcal per 100 g or per piece. */
  caloriesPerUnit?: number;
  /** Food only: protein grams per 100 g or per piece. */
  proteinPerUnit?: number;
  /** Food only: carbohydrate grams per 100 g or per piece. */
  carbsPerUnit?: number;
  /** Food only: fat grams per 100 g or per piece. */
  fatPerUnit?: number;
  /** Food only: total protein grams for the eaten quantity. */
  proteinGrams?: number;
  /** Food only: total carbohydrate grams for the eaten quantity. */
  carbsGrams?: number;
  /** Food only: total fat grams for the eaten quantity. */
  fatGrams?: number;
  /** Food: kcal consumed. Exercise: kcal burned. Food can be 0 when calories are left blank. */
  totalCalories: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Remembered dishes/exercises so repeat entries autofill their calories. */
export interface DbCalorieLibraryItem {
  _id: ObjectId;
  userId: ObjectId;
  kind: CalorieEntryKind;
  nameKey: string;
  name: string;
  unit?: FoodUnit;
  caloriesPerUnit?: number;
  proteinPerUnit?: number;
  carbsPerUnit?: number;
  fatPerUnit?: number;
  /** Exercise: last logged kcal burned, used as autofill default. */
  lastCaloriesBurned?: number;
  timesLogged: number;
  lastLoggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbCalorieSettings {
  _id: ObjectId;
  userId: ObjectId;
  /** Daily intake target in kcal. */
  dailyCalorieGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalorieEntry {
  id: string;
  dayKey: string;
  kind: CalorieEntryKind;
  name: string;
  unit?: FoodUnit;
  quantity?: number;
  caloriesPerUnit?: number;
  proteinPerUnit?: number;
  carbsPerUnit?: number;
  fatPerUnit?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  totalCalories: number;
  createdAt: string;
}

export interface CalorieLibraryItem {
  id: string;
  kind: CalorieEntryKind;
  name: string;
  nameKey: string;
  unit?: FoodUnit;
  caloriesPerUnit?: number;
  proteinPerUnit?: number;
  carbsPerUnit?: number;
  fatPerUnit?: number;
  lastCaloriesBurned?: number;
  timesLogged: number;
}

export interface CalorieDaySummary {
  dayKey: string;
  foodCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  exerciseCalories: number;
  /** foodCalories - exerciseCalories */
  netCalories: number;
  entryCount: number;
}

export interface CalorieWeekSummary {
  /** Monday of the week (YYYY-MM-DD). */
  weekStartKey: string;
  weekEndKey: string;
  daysLogged: number;
  foodCalories: number;
  exerciseCalories: number;
  netCalories: number;
  avgNetPerLoggedDay: number;
}

export interface CalorieMonthSummary {
  /** YYYY-MM */
  monthKey: string;
  daysLogged: number;
  foodCalories: number;
  exerciseCalories: number;
  netCalories: number;
  avgNetPerLoggedDay: number;
}

export interface CaloriesOverview {
  dailyCalorieGoal: number | null;
  dayEntries: CalorieEntry[];
  library: CalorieLibraryItem[];
  /** Oldest→newest, one row per day in range (zero-filled), last 30 days. */
  daily: CalorieDaySummary[];
  /** Oldest→newest, last 8 weeks. */
  weekly: CalorieWeekSummary[];
  /** Oldest→newest, last 6 months. */
  monthly: CalorieMonthSummary[];
}

// ─── Server Action Results ─────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
