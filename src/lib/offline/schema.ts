export const OFFLINE_SYNC_COLLECTIONS = [
  "documents",
  "notes",
  "terms",
  "repetitions",
  "tasks",
  "topicCollections",
  "postDrafts",
  "aiChats",
  "reviewEvents",
  "youtubeSessions",
  "youtubeBookmarks",
  "youtubePlaylists",
  "youtubeRepetitions",
  "documentShares",
  "youtubeShares",
  "calorieEntries",
  "calorieLibrary",
  "calorieSettings",
] as const;

export type OfflineSyncCollection = (typeof OFFLINE_SYNC_COLLECTIONS)[number];
export type OfflineSyncRow = Record<string, unknown> & { id: string };

export interface OfflineSyncSnapshot {
  schemaVersion: 1;
  syncedAt: string;
  user: { id: string; name: string; email: string };
  collections: Record<OfflineSyncCollection, OfflineSyncRow[]>;
}
