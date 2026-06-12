"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
  getDocumentsCollection,
  getRepetitionsCollection,
  getGoogleIntegrationsCollection,
  serializeDoc,
} from "@/lib/db/collections";
import { getCustomNextReviewDate } from "@/lib/srs/engine";
import {
  getValidAccessToken,
  getFileMetadata,
  normalizeGoogleDocsUrl,
  isGoogleDocMimeType,
} from "@/lib/google/drive";
import type { ActionResult, Difficulty, Document } from "@/types";

export interface PickerFile {
  id: string;
  name?: string;
}

export interface ImportOptions {
  difficulty: Difficulty;
  tags: string[];
  initialDelayDays: number;
}

export interface ImportResult {
  imported: number;
  alreadyImported: number;
  failed: number;
  docs: Document[];
}

export interface SyncResult {
  synced: number;
  failed: number;
  needsReconnect: boolean;
}

/** Check if the current user has a connected Google Docs integration. */
export async function getGoogleConnectionStatusAction(): Promise<
  ActionResult<{ connected: boolean; needsReconnect: boolean }>
> {
  const user = await requireAuth();
  const col = await getGoogleIntegrationsCollection();
  const integration = await col.findOne({
    userId: new ObjectId(user.id),
    provider: "google",
  });

  if (!integration) {
    return { success: true, data: { connected: false, needsReconnect: false } };
  }

  const hasRefreshToken = !!integration.refreshTokenEncrypted;
  return {
    success: true,
    data: {
      connected: hasRefreshToken,
      needsReconnect: !hasRefreshToken,
    },
  };
}

/** Return a short-lived access token for Google Picker (client-side use). */
export async function getPickerAccessTokenAction(): Promise<
  ActionResult<{ accessToken: string }>
> {
  const user = await requireAuth();
  const accessToken = await getValidAccessToken(user.id);

  if (!accessToken) {
    return { success: false, error: "Google account not connected or token expired. Please reconnect." };
  }

  return { success: true, data: { accessToken } };
}

/** Import selected Google Docs from Picker into the user's library. */
export async function importSelectedGoogleDocsAction(
  files: PickerFile[],
  options: ImportOptions
): Promise<ActionResult<ImportResult>> {
  const user = await requireAuth();

  if (!files.length) {
    return { success: false, error: "No files selected." };
  }

  const accessToken = await getValidAccessToken(user.id);
  if (!accessToken) {
    return { success: false, error: "Google account not connected. Please reconnect." };
  }

  const docs = await getDocumentsCollection();
  const reps = await getRepetitionsCollection();
  const userId = new ObjectId(user.id);
  const now = new Date();

  const result: ImportResult = { imported: 0, alreadyImported: 0, failed: 0, docs: [] };

  for (const file of files) {
    try {
      // Server-side metadata verification — do not trust client-provided names
      const metadata = await getFileMetadata(accessToken, file.id);

      if (!isGoogleDocMimeType(metadata.mimeType)) {
        result.failed += 1;
        continue;
      }

      // Check for duplicates by googleDriveFileId
      const existing = await docs.findOne({ userId, googleDriveFileId: metadata.id });
      if (existing) {
        result.alreadyImported += 1;
        continue;
      }

      const url = normalizeGoogleDocsUrl(metadata.id);
      const nextReviewDate = getCustomNextReviewDate(options.initialDelayDays);

      const insertResult = await docs.insertOne({
        _id: new ObjectId(),
        userId,
        url,
        title: metadata.name,
        status: "first_visit",
        difficulty: options.difficulty,
        tags: options.tags,
        isLinkBroken: false,
        mediaType: "google-doc",
        source: "google-picker",
        googleDriveFileId: metadata.id,
        googleDriveModifiedTime: new Date(metadata.modifiedTime),
        googleDriveVersion: metadata.version,
        googleDriveWebViewLink: metadata.webViewLink,
        googleDriveSyncStatus: "synced",
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      await reps.insertOne({
        _id: new ObjectId(),
        userId,
        docId: insertResult.insertedId,
        nextReviewDate,
        intervalDays: options.initialDelayDays,
        reviewCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      const inserted = await docs.findOne({ _id: insertResult.insertedId });
      if (inserted) result.docs.push(serializeDoc(inserted));
      result.imported += 1;
    } catch {
      result.failed += 1;
    }
  }

  revalidatePath("/documents");
  revalidatePath("/dashboard");

  return { success: true, data: result };
}

/** Sync previously imported Google Docs (updates title and metadata). */
export async function syncGoogleDocsAction(
  docIds?: string[]
): Promise<ActionResult<SyncResult>> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);

  const accessToken = await getValidAccessToken(user.id);
  if (!accessToken) {
    // Mark all imported docs as needing reconnect
    const docs = await getDocumentsCollection();
    await docs.updateMany(
      { userId, googleDriveFileId: { $exists: true } },
      { $set: { googleDriveSyncStatus: "needs_reconnect", updatedAt: new Date() } }
    );
    return {
      success: true,
      data: { synced: 0, failed: 0, needsReconnect: true },
    };
  }

  const docs = await getDocumentsCollection();
  const query: Record<string, unknown> = { userId, googleDriveFileId: { $exists: true } };
  if (docIds?.length) {
    query._id = { $in: docIds.map((id) => new ObjectId(id)) };
  }

  const docsToSync = await docs.find(query).toArray();
  const now = new Date();
  const result: SyncResult = { synced: 0, failed: 0, needsReconnect: false };

  for (const doc of docsToSync) {
    if (!doc.googleDriveFileId) continue;
    try {
      const metadata = await getFileMetadata(accessToken, doc.googleDriveFileId);

      if (!isGoogleDocMimeType(metadata.mimeType)) {
        result.failed += 1;
        continue;
      }

      await docs.updateOne(
        { _id: doc._id },
        {
          $set: {
            title: metadata.name,
            googleDriveModifiedTime: new Date(metadata.modifiedTime),
            googleDriveVersion: metadata.version,
            googleDriveWebViewLink: metadata.webViewLink,
            googleDriveSyncStatus: "synced",
            googleDriveSyncError: undefined,
            lastSyncedAt: now,
            updatedAt: now,
          },
        }
      );
      result.synced += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const needsReconnect = message.includes("401") || message.includes("invalid_grant");

      await docs.updateOne(
        { _id: doc._id },
        {
          $set: {
            googleDriveSyncStatus: needsReconnect ? "needs_reconnect" : "error",
            googleDriveSyncError: message,
            updatedAt: now,
          },
        }
      );

      if (needsReconnect) result.needsReconnect = true;
      result.failed += 1;
    }
  }

  revalidatePath("/documents");
  revalidatePath("/dashboard");

  return { success: true, data: result };
}

/** Remove stored Google integration tokens (stops future syncs; keeps imported docs). */
export async function disconnectGoogleDocsAction(): Promise<ActionResult> {
  const user = await requireAuth();
  const col = await getGoogleIntegrationsCollection();

  await col.deleteOne({ userId: new ObjectId(user.id), provider: "google" });

  // Clear sync status on all imported docs
  const docs = await getDocumentsCollection();
  await docs.updateMany(
    { userId: new ObjectId(user.id), googleDriveFileId: { $exists: true } },
    {
      $set: {
        googleDriveSyncStatus: "needs_reconnect",
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath("/documents");
  return { success: true };
}
