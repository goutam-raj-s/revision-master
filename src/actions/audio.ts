"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
  getDocumentsCollection,
  getPlaylistsCollection,
  serializeDoc,
  serializePlaylist,
} from "@/lib/db/collections";
import type { ActionResult, Document, Playlist } from "@/types";

// ─── Audio Documents ───────────────────────────────────────────────────────────

export async function getUserAudioDocuments(): Promise<Document[]> {
  const user = await requireAuth();
  const docs = await getDocumentsCollection();
  
  const results = await docs.aggregate([
    { $match: { userId: new ObjectId(user.id), mediaType: "audio" } },
    {
      $lookup: {
        from: "repetitions",
        localField: "_id",
        foreignField: "docId",
        as: "rep"
      }
    },
    { $sort: { createdAt: -1 } }
  ]).toArray();

  return results.map((r) => {
    const doc = serializeDoc(r as any);
    if (r.rep && r.rep.length > 0 && r.rep[0].nextReviewDate) {
      doc.nextReviewDate = r.rep[0].nextReviewDate.toISOString();
    }
    return doc;
  });
}

export async function toggleAudioFavourite(docId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(docId)) return { success: false, error: "Invalid document ID." };

  const docs = await getDocumentsCollection();
  const doc = await docs.findOne({ _id: new ObjectId(docId), userId: new ObjectId(user.id) });
  if (!doc) return { success: false, error: "Document not found." };

  await docs.updateOne(
    { _id: new ObjectId(docId), userId: new ObjectId(user.id) },
    { $set: { isFavourite: !doc.isFavourite, updatedAt: new Date() } }
  );

  revalidatePath("/music");
  return { success: true };
}

export async function recordPlay(docId: string): Promise<void> {
  const user = await requireAuth();
  if (!ObjectId.isValid(docId)) return;

  const docs = await getDocumentsCollection();
  await docs.updateOne(
    { _id: new ObjectId(docId), userId: new ObjectId(user.id) },
    { $inc: { playCount: 1 }, $set: { lastPlayedAt: new Date(), updatedAt: new Date() } }
  );
}

// ─── Playlists ─────────────────────────────────────────────────────────────────

export async function createPlaylist(name: string): Promise<ActionResult<Playlist>> {
  const user = await requireAuth();
  if (!name || name.trim().length === 0) return { success: false, error: "Name is required." };

  const col = await getPlaylistsCollection();
  const now = new Date();
  const result = await col.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(user.id),
    name: name.trim(),
    trackIds: [],
    createdAt: now,
    updatedAt: now,
  });

  const inserted = await col.findOne({ _id: result.insertedId });
  if (!inserted) return { success: false, error: "Failed to create playlist." };

  revalidatePath("/music");
  return { success: true, data: serializePlaylist(inserted) };
}

export async function getUserPlaylists(): Promise<Playlist[]> {
  const user = await requireAuth();
  const col = await getPlaylistsCollection();
  const results = await col
    .find({ userId: new ObjectId(user.id) })
    .sort({ createdAt: -1 })
    .toArray();
  return results.map(serializePlaylist);
}

export async function addToPlaylist(playlistId: string, docId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(playlistId)) return { success: false, error: "Invalid playlist ID." };
  if (!ObjectId.isValid(docId)) return { success: false, error: "Invalid document ID." };

  const col = await getPlaylistsCollection();
  const playlist = await col.findOne({ _id: new ObjectId(playlistId), userId: new ObjectId(user.id) });
  if (!playlist) return { success: false, error: "Playlist not found." };

  await col.updateOne(
    { _id: new ObjectId(playlistId), userId: new ObjectId(user.id) },
    { $addToSet: { trackIds: new ObjectId(docId) }, $set: { updatedAt: new Date() } }
  );

  revalidatePath("/music");
  return { success: true };
}

export async function removeFromPlaylist(playlistId: string, docId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(playlistId)) return { success: false, error: "Invalid playlist ID." };
  if (!ObjectId.isValid(docId)) return { success: false, error: "Invalid document ID." };

  const col = await getPlaylistsCollection();
  const playlist = await col.findOne({ _id: new ObjectId(playlistId), userId: new ObjectId(user.id) });
  if (!playlist) return { success: false, error: "Playlist not found." };

  await col.updateOne(
    { _id: new ObjectId(playlistId), userId: new ObjectId(user.id) },
    { $pull: { trackIds: new ObjectId(docId) }, $set: { updatedAt: new Date() } }
  );

  revalidatePath("/music");
  return { success: true };
}

export async function reorderPlaylist(playlistId: string, trackIds: string[]): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(playlistId)) return { success: false, error: "Invalid playlist ID." };

  const col = await getPlaylistsCollection();
  const playlist = await col.findOne({ _id: new ObjectId(playlistId), userId: new ObjectId(user.id) });
  if (!playlist) return { success: false, error: "Playlist not found." };

  if (!trackIds.every((id) => ObjectId.isValid(id))) {
    return { success: false, error: "Invalid track ID in list." };
  }

  await col.updateOne(
    { _id: new ObjectId(playlistId), userId: new ObjectId(user.id) },
    {
      $set: {
        trackIds: trackIds.map((id) => new ObjectId(id)),
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath("/music");
  return { success: true };
}

export async function deletePlaylist(playlistId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(playlistId)) return { success: false, error: "Invalid playlist ID." };

  const col = await getPlaylistsCollection();
  const result = await col.deleteOne({ _id: new ObjectId(playlistId), userId: new ObjectId(user.id) });
  if (result.deletedCount === 0) return { success: false, error: "Playlist not found." };

  revalidatePath("/music");
  return { success: true };
}
