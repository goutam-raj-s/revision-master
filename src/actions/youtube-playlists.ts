"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
  getYoutubePlaylistsCollection,
  getYoutubeSessionsCollection,
  serializeYoutubePlaylist,
} from "@/lib/db/collections";
import type { ActionResult, YoutubePlaylist, YoutubePlaylistItem } from "@/types";

function toPlaylistItem(session: {
  _id: ObjectId;
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
  sourceType?: "youtube" | "external";
}): YoutubePlaylistItem {
  return {
    sessionId: session._id.toString(),
    videoId: session.videoId,
    title: session.videoTitle,
    thumbnailUrl: session.thumbnailUrl,
    videoUrl: session.videoUrl,
    sourceType: session.sourceType ?? "youtube",
  };
}

export async function createYoutubePlaylist(name: string): Promise<ActionResult<YoutubePlaylist>> {
  const user = await requireAuth();
  const trimmedName = name.trim();
  if (!trimmedName) return { success: false, error: "Name is required." };

  const col = await getYoutubePlaylistsCollection();
  const now = new Date();
  const result = await col.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(user.id),
    name: trimmedName,
    sessionIds: [],
    createdAt: now,
    updatedAt: now,
  });

  const inserted = await col.findOne({ _id: result.insertedId });
  if (!inserted) return { success: false, error: "Failed to create playlist." };

  revalidatePath("/study/youtube");
  return { success: true, data: serializeYoutubePlaylist(inserted) };
}

export async function getYoutubePlaylists(): Promise<YoutubePlaylist[]> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const [playlistCol, sessionCol] = await Promise.all([
    getYoutubePlaylistsCollection(),
    getYoutubeSessionsCollection(),
  ]);

  const playlists = await playlistCol.find({ userId }).sort({ createdAt: -1 }).toArray();
  const sessionIds = Array.from(
    new Map(playlists.flatMap((playlist) => playlist.sessionIds).map((id) => [id.toString(), id])).values()
  );
  const sessions = sessionIds.length
    ? await sessionCol.find({ userId, _id: { $in: sessionIds } }).toArray()
    : [];
  const sessionMap = new Map(sessions.map((session) => [session._id.toString(), toPlaylistItem(session)]));

  return playlists.map((playlist) =>
    serializeYoutubePlaylist(
      playlist,
      playlist.sessionIds
        .map((id) => sessionMap.get(id.toString()))
        .filter((item): item is YoutubePlaylistItem => Boolean(item))
    )
  );
}

export async function renameYoutubePlaylist(
  playlistId: string,
  newName: string
): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(playlistId)) return { success: false, error: "Invalid playlist ID." };
  const trimmedName = newName.trim();
  if (!trimmedName) return { success: false, error: "Name is required." };

  const col = await getYoutubePlaylistsCollection();
  const result = await col.updateOne(
    { _id: new ObjectId(playlistId), userId: new ObjectId(user.id) },
    { $set: { name: trimmedName, updatedAt: new Date() } }
  );
  if (result.matchedCount === 0) return { success: false, error: "Playlist not found." };

  revalidatePath("/study/youtube");
  return { success: true };
}

export async function deleteYoutubePlaylist(playlistId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(playlistId)) return { success: false, error: "Invalid playlist ID." };

  const col = await getYoutubePlaylistsCollection();
  const result = await col.deleteOne({
    _id: new ObjectId(playlistId),
    userId: new ObjectId(user.id),
  });
  if (result.deletedCount === 0) return { success: false, error: "Playlist not found." };

  revalidatePath("/study/youtube");
  return { success: true };
}

export async function removeYoutubeSessionFromPlaylist(
  playlistId: string,
  sessionId: string
): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(playlistId)) return { success: false, error: "Invalid playlist ID." };
  if (!ObjectId.isValid(sessionId)) return { success: false, error: "Invalid session ID." };

  const col = await getYoutubePlaylistsCollection();
  const result = await col.updateOne(
    { _id: new ObjectId(playlistId), userId: new ObjectId(user.id) },
    { $pull: { sessionIds: new ObjectId(sessionId) }, $set: { updatedAt: new Date() } }
  );
  if (result.matchedCount === 0) return { success: false, error: "Playlist not found." };

  revalidatePath("/study/youtube");
  return { success: true };
}

export async function addYoutubeSessionToPlaylist(
  playlistId: string,
  sessionId: string
): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(playlistId)) return { success: false, error: "Invalid playlist ID." };
  if (!ObjectId.isValid(sessionId)) return { success: false, error: "Invalid video session ID." };

  const userId = new ObjectId(user.id);
  const playlistObjectId = new ObjectId(playlistId);
  const sessionObjectId = new ObjectId(sessionId);
  const [playlistCol, sessionCol] = await Promise.all([
    getYoutubePlaylistsCollection(),
    getYoutubeSessionsCollection(),
  ]);

  const [playlist, session] = await Promise.all([
    playlistCol.findOne({ _id: playlistObjectId, userId }),
    sessionCol.findOne({ _id: sessionObjectId, userId }),
  ]);
  if (!playlist) return { success: false, error: "Playlist not found." };
  if (!session) return { success: false, error: "Video session not found." };

  await playlistCol.updateOne(
    { _id: playlistObjectId, userId },
    { $addToSet: { sessionIds: sessionObjectId }, $set: { updatedAt: new Date() } }
  );

  revalidatePath("/study/youtube");
  return { success: true };
}
