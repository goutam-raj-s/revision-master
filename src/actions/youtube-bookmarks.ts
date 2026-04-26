"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import { getYoutubeBookmarksCollection, serializeYoutubeBookmark } from "@/lib/db/collections";
import type { ActionResult, YoutubeBookmark } from "@/types";
import { revalidatePath } from "next/cache";

export async function toggleYoutubeBookmark(
  youtubeId: string,
  type: "video" | "playlist",
  title: string,
  thumbnailUrl: string
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
      // Add bookmark
      const now = new Date();
      await col.insertOne({
        _id: new ObjectId(),
        userId,
        type,
        youtubeId,
        title,
        thumbnailUrl,
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
