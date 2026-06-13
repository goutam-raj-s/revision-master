"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import { getYoutubeBookmarksCollection, serializeYoutubeBookmark } from "@/lib/db/collections";
import type { ActionResult, YoutubeBookmark, PlaylistVideo } from "@/types";
import { revalidatePath } from "next/cache";
import { fetchYoutubePlaylist } from "@/actions/youtube";

export async function toggleYoutubeBookmark(
  youtubeId: string,
  type: "video" | "playlist",
  title: string,
  thumbnailUrl: string,
  videos?: PlaylistVideo[]
): Promise<ActionResult<{ isBookmarked: boolean }>> {
  try {
    const user = await requireAuth();
    const userId = new ObjectId(user.id);
    const col = await getYoutubeBookmarksCollection();

    const existing = await col.findOne({ userId, youtubeId });

    if (existing) {
      // Remove bookmark
      await col.deleteOne({ _id: existing._id });
      revalidatePath("/study/youtube");
      return { success: true, data: { isBookmarked: false } };
    } else {
      // Add bookmark — for playlists, persist the video list so it survives
      // YouTube fetch glitches later.
      const now = new Date();
      await col.insertOne({
        _id: new ObjectId(),
        userId,
        type,
        youtubeId,
        title,
        thumbnailUrl,
        ...(type === "playlist" && videos?.length ? { videos } : {}),
        createdAt: now,
        updatedAt: now,
      });
      revalidatePath("/study/youtube");
      return { success: true, data: { isBookmarked: true } };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** Returns the persisted videos of a bookmarked playlist (empty if none stored). */
export async function getBookmarkedPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
  try {
    const user = await requireAuth();
    const col = await getYoutubeBookmarksCollection();
    const bm = await col.findOne({ userId: new ObjectId(user.id), youtubeId: playlistId, type: "playlist" });
    return bm?.videos ?? [];
  } catch {
    return [];
  }
}

/** Overwrites the stored videos for a bookmarked playlist (used by the page to keep
 *  the persisted copy fresh whenever a live fetch succeeds). */
export async function persistPlaylistVideos(
  playlistId: string,
  videos: PlaylistVideo[]
): Promise<void> {
  try {
    if (!videos.length) return;
    const user = await requireAuth();
    const col = await getYoutubeBookmarksCollection();
    await col.updateOne(
      { userId: new ObjectId(user.id), youtubeId: playlistId, type: "playlist" },
      { $set: { videos, updatedAt: new Date() } }
    );
  } catch {
    // best-effort
  }
}

/** CRUD: remove a single video from a saved playlist. */
export async function removePlaylistVideo(
  playlistId: string,
  videoId: string
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const col = await getYoutubeBookmarksCollection();
    const res = await col.updateOne(
      { userId: new ObjectId(user.id), youtubeId: playlistId, type: "playlist" },
      { $pull: { videos: { videoId } }, $set: { updatedAt: new Date() } }
    );
    if (res.matchedCount === 0) return { success: false, error: "Saved playlist not found." };
    revalidatePath("/study/youtube");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** CRUD: re-pull the playlist from YouTube and overwrite the stored videos. */
export async function refreshPlaylistVideos(playlistId: string): Promise<ActionResult<{ count: number }>> {
  try {
    const data = await fetchYoutubePlaylist(playlistId);
    if (data.videos.length === 0) {
      return { success: false, error: "YouTube returned no videos right now. Try again shortly." };
    }
    await persistPlaylistVideos(playlistId, data.videos);
    revalidatePath("/study/youtube");
    return { success: true, data: { count: data.videos.length } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getYoutubeBookmarks(): Promise<YoutubeBookmark[]> {
  try {
    const user = await requireAuth();
    const col = await getYoutubeBookmarksCollection();
    const bookmarks = await col
      .find({ userId: new ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .toArray();
    return bookmarks.map(serializeYoutubeBookmark);
  } catch {
    return [];
  }
}

export async function checkYoutubeBookmark(youtubeId: string): Promise<boolean> {
  try {
    const user = await requireAuth();
    const col = await getYoutubeBookmarksCollection();
    const existing = await col.findOne({
      userId: new ObjectId(user.id),
      youtubeId,
    });
    return !!existing;
  } catch {
    return false;
  }
}
