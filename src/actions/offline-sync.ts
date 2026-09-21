"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import {
  getAiChatsCollection,
  getCalorieEntriesCollection,
  getCalorieLibraryCollection,
  getCalorieSettingsCollection,
  getDocumentSharesCollection,
  getDocumentsCollection,
  getNotesCollection,
  getPostDraftsCollection,
  getRepetitionsCollection,
  getReviewEventsCollection,
  getTasksCollection,
  getTermsCollection,
  getTopicCollectionsCollection,
  getYoutubeBookmarksCollection,
  getYoutubePlaylistsCollection,
  getYoutubeRepetitionsCollection,
  getYoutubeSessionsCollection,
  getYoutubeSharesCollection,
} from "@/lib/db/collections";
import type { OfflineSyncRow, OfflineSyncSnapshot } from "@/lib/offline/schema";
import type { ActionResult } from "@/types";

function cleanValue(value: unknown): unknown {
  if (value instanceof ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(cleanValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key === "userId" || key === "ownerId") continue;
      out[key === "_id" ? "id" : key] = cleanValue(nested);
    }
    return out;
  }
  return value;
}

function cleanRows(rows: Record<string, unknown>[]): OfflineSyncRow[] {
  return rows
    .map((row) => cleanValue(row) as OfflineSyncRow)
    .filter((row) => typeof row.id === "string");
}

export async function getOfflineSyncSnapshotAction(): Promise<ActionResult<OfflineSyncSnapshot>> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);

  const [
    documents,
    notes,
    terms,
    repetitions,
    tasks,
    topicCollections,
    postDrafts,
    aiChats,
    reviewEvents,
    youtubeSessions,
    youtubeBookmarks,
    youtubePlaylists,
    youtubeRepetitions,
    documentShares,
    youtubeShares,
    calorieEntries,
    calorieLibrary,
    calorieSettings,
  ] = await Promise.all([
    (await getDocumentsCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getNotesCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getTermsCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getRepetitionsCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getTasksCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getTopicCollectionsCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getPostDraftsCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getAiChatsCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getReviewEventsCollection()).find({ userId }).sort({ reviewedAt: -1 }).toArray(),
    (await getYoutubeSessionsCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getYoutubeBookmarksCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getYoutubePlaylistsCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getYoutubeRepetitionsCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getDocumentSharesCollection()).find({ ownerId: userId }).sort({ createdAt: -1 }).toArray(),
    (await getYoutubeSharesCollection()).find({ ownerId: userId }).sort({ createdAt: -1 }).toArray(),
    (await getCalorieEntriesCollection()).find({ userId }).sort({ dayKey: -1, updatedAt: -1 }).toArray(),
    (await getCalorieLibraryCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
    (await getCalorieSettingsCollection()).find({ userId }).sort({ updatedAt: -1 }).toArray(),
  ]);

  return {
    success: true,
    data: {
      schemaVersion: 1,
      syncedAt: new Date().toISOString(),
      user: { id: user.id, name: user.name, email: user.email },
      collections: {
        documents: cleanRows(documents as unknown as Record<string, unknown>[]),
        notes: cleanRows(notes as unknown as Record<string, unknown>[]),
        terms: cleanRows(terms as unknown as Record<string, unknown>[]),
        repetitions: cleanRows(repetitions as unknown as Record<string, unknown>[]),
        tasks: cleanRows(tasks as unknown as Record<string, unknown>[]),
        topicCollections: cleanRows(topicCollections as unknown as Record<string, unknown>[]),
        postDrafts: cleanRows(postDrafts as unknown as Record<string, unknown>[]),
        aiChats: cleanRows(aiChats as unknown as Record<string, unknown>[]),
        reviewEvents: cleanRows(reviewEvents as unknown as Record<string, unknown>[]),
        youtubeSessions: cleanRows(youtubeSessions as unknown as Record<string, unknown>[]),
        youtubeBookmarks: cleanRows(youtubeBookmarks as unknown as Record<string, unknown>[]),
        youtubePlaylists: cleanRows(youtubePlaylists as unknown as Record<string, unknown>[]),
        youtubeRepetitions: cleanRows(youtubeRepetitions as unknown as Record<string, unknown>[]),
        documentShares: cleanRows(documentShares as unknown as Record<string, unknown>[]),
        youtubeShares: cleanRows(youtubeShares as unknown as Record<string, unknown>[]),
        calorieEntries: cleanRows(calorieEntries as unknown as Record<string, unknown>[]),
        calorieLibrary: cleanRows(calorieLibrary as unknown as Record<string, unknown>[]),
        calorieSettings: cleanRows(calorieSettings as unknown as Record<string, unknown>[]),
      },
    },
  };
}
