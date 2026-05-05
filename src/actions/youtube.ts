"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import {
  getYoutubeSessionsCollection,
  getYoutubeRepetitionsCollection,
  serializeYoutubeSession,
  serializeRepetition,
} from "@/lib/db/collections";
import { getCustomNextReviewDate } from "@/lib/srs/engine";
import type { ActionResult, Difficulty, YoutubeSession, Repetition } from "@/types";
import { extractYoutubeVideoId } from "@/lib/youtube-utils";
import play from "play-dl";

// ── Server actions ────────────────────────────────────────────────────────────

export async function fetchYoutubeMetadata(
  url: string
): Promise<{ videoId: string; title: string; thumbnailUrl: string }> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  try {
    const videoInfo = await play.video_basic_info(url);
    return {
      videoId,
      title: videoInfo.video_details.title || videoId,
      thumbnailUrl: videoInfo.video_details.thumbnails[0]?.url || "",
    };
  } catch (error) {
    console.error("fetchYoutubeMetadata error:", error);
    // Fallback to minimal info
    return { videoId, title: videoId, thumbnailUrl: "" };
  }
}

export async function fetchYoutubePlaylist(
  playlistId: string
): Promise<{ playlistId: string; title: string; videos: { videoId: string; title: string; thumbnailUrl: string }[] }> {
  try {
    const playlist = await play.playlist_info(`https://www.youtube.com/playlist?list=${playlistId}`, { incomplete: true });
    const videos = await playlist.all_videos();
    
    return {
      playlistId,
      title: playlist.title || "YouTube Playlist",
      videos: videos.map((v) => ({
        videoId: v.id || "",
        title: v.title || "Unknown Title",
        thumbnailUrl: v.thumbnails[0]?.url || "",
      })).filter((v) => v.videoId), // Remove any invalid videos
    };
  } catch (error) {
    console.error("Failed to fetch playlist", error);
    throw new Error("Failed to fetch playlist data");
  }
}

export async function createOrGetYoutubeSession(
  videoId: string,
  metadata: { title: string; thumbnailUrl: string },
  options: { tags?: string[]; difficulty?: Difficulty; delayDays?: number } = {}
): Promise<ActionResult<YoutubeSession>> {
  try {
    const user = await requireAuth();
    const userId = new ObjectId(user.id);
    const { tags = [], difficulty = "medium", delayDays = 2 } = options;

    const col = await getYoutubeSessionsCollection();
    const reps = await getYoutubeRepetitionsCollection();

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Find the most recent existing session for this user+videoId
    const existing = await col.findOne(
      { userId, videoId },
      { sort: { createdAt: -1 } }
    );

    if (existing) {
      return { success: true, data: serializeYoutubeSession(existing) };
    }

    // Create new session
    const now = new Date();
    const sessionId = new ObjectId();
    await col.insertOne({
      _id: sessionId,
      userId,
      videoId,
      videoTitle: metadata.title,
      thumbnailUrl: metadata.thumbnailUrl,
      videoUrl,
      notes: "",
      tags,
      difficulty,
      createdAt: now,
      updatedAt: now,
    });

    // Create repetition record — docId field holds the sessionId
    const nextReviewDate = getCustomNextReviewDate(delayDays);
    await reps.insertOne({
      _id: new ObjectId(),
      userId,
      docId: sessionId,
      nextReviewDate,
      intervalDays: delayDays,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const created = await col.findOne({ _id: sessionId });
    if (!created) return { success: false, error: "Failed to retrieve created session" };

    return { success: true, data: serializeYoutubeSession(created) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateYoutubeSessionNotes(
  sessionId: string,
  notes: string
): Promise<ActionResult> {
  try {
    if (!ObjectId.isValid(sessionId)) return { success: false, error: "Invalid session ID" };
    const user = await requireAuth();
    const col = await getYoutubeSessionsCollection();
    const result = await col.updateOne(
      { _id: new ObjectId(sessionId), userId: new ObjectId(user.id) },
      { $set: { notes, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return { success: false, error: "Session not found" };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteYoutubeSession(sessionId: string): Promise<ActionResult> {
  try {
    if (!ObjectId.isValid(sessionId)) return { success: false, error: "Invalid session ID" };
    const user = await requireAuth();
    const col = await getYoutubeSessionsCollection();
    const reps = await getYoutubeRepetitionsCollection();
    const result = await col.deleteOne({
      _id: new ObjectId(sessionId),
      userId: new ObjectId(user.id),
    });
    if (result.deletedCount === 0) return { success: false, error: "Session not found" };
    await reps.deleteOne({ docId: new ObjectId(sessionId) });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getYoutubeSession(sessionId: string): Promise<YoutubeSession | null> {
  try {
    if (!ObjectId.isValid(sessionId)) return null;
    const user = await requireAuth();
    const col = await getYoutubeSessionsCollection();
    const session = await col.findOne({
      _id: new ObjectId(sessionId),
      userId: new ObjectId(user.id),
    });
    return session ? serializeYoutubeSession(session) : null;
  } catch {
    return null;
  }
}

export async function listYoutubeSessions(): Promise<YoutubeSession[]> {
  try {
    const user = await requireAuth();
    const col = await getYoutubeSessionsCollection();
    const sessions = await col
      .find({ userId: new ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .toArray();
    return sessions.map(serializeYoutubeSession);
  } catch {
    return [];
  }
}

export async function getYoutubeSessionRepetition(sessionId: string): Promise<Repetition | null> {
  try {
    const user = await requireAuth();
    const reps = await getYoutubeRepetitionsCollection();
    const rep = await reps.findOne({
      docId: new ObjectId(sessionId),
      userId: new ObjectId(user.id),
    });
    return rep ? serializeRepetition(rep) : null;
  } catch {
    return null;
  }
}
export async function searchYoutubeVideos(
  query: string,
  limit = 5
): Promise<{ videoId: string; title: string; thumbnailUrl: string; duration: string }[]> {
  try {
    const results = await play.search(query, { limit, source: { youtube: "video" } });
    return results.map((v) => ({
      videoId: v.id || "",
      title: v.title || "Unknown Title",
      thumbnailUrl: v.thumbnails[0]?.url || "",
      duration: v.durationRaw || "0:00",
    })).filter((v) => v.videoId);
  } catch (error) {
    console.error("YouTube search failed", error);
    return [];
  }
}
