"use server";

import { createHash } from "crypto";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
  getYoutubeSessionsCollection,
  getYoutubeRepetitionsCollection,
  serializeYoutubeSession,
  serializeRepetition,
} from "@/lib/db/collections";
import { getCustomNextReviewDate, getNextReviewDate } from "@/lib/srs/engine";
import { logReviewEvent } from "@/lib/streak";
import type { ActionResult, Difficulty, YoutubeSession, Repetition } from "@/types";
import { extractYoutubeVideoId } from "@/lib/youtube-utils";
import play from "play-dl";

// ── Server actions ────────────────────────────────────────────────────────────

const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".ogv", ".mov", ".m4v"];

type YoutubePlaylistVideoPreview = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
};

type YoutubePlaylistData = {
  playlistId: string;
  title: string;
  videos: YoutubePlaylistVideoPreview[];
};

function normalizeExternalUrl(url: string): string {
  const parsed = new URL(url.trim());
  parsed.hash = "";
  return parsed.toString();
}

function getExternalVideoId(url: string): string {
  return `external-${createHash("sha256").update(url).digest("hex").slice(0, 24)}`;
}

function inferExternalPlayerType(url: string): "direct" | "iframe" {
  const pathname = new URL(url).pathname.toLowerCase();
  return DIRECT_VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext)) ? "direct" : "iframe";
}

function getExternalTitle(url: string): string {
  const parsed = new URL(url);
  const lastPathPart = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).at(-1) ?? "");
  return lastPathPart || parsed.hostname.replace(/^www\./, "");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function readText(value: unknown): string {
  const record = asRecord(value);
  if (!record) return "";

  if (typeof record.simpleText === "string") return record.simpleText;

  if (Array.isArray(record.runs)) {
    return record.runs
      .map((run) => asRecord(run)?.text)
      .filter((text): text is string => typeof text === "string")
      .join("");
  }

  return "";
}

function readThumbnailUrl(value: unknown): string {
  const record = asRecord(value);
  const thumbnails = asRecord(record?.thumbnail)?.thumbnails ?? record?.thumbnails;
  if (!Array.isArray(thumbnails)) return "";

  const last = thumbnails
    .map((thumbnail) => asRecord(thumbnail))
    .filter((thumbnail): thumbnail is Record<string, unknown> => Boolean(thumbnail))
    .at(-1);

  return typeof last?.url === "string" ? last.url : "";
}

function collectPlaylistVideosFromInitialData(data: unknown): YoutubePlaylistVideoPreview[] {
  const videos = new Map<string, YoutubePlaylistVideoPreview>();
  // FIFO breadth-first traversal so playlist videos keep their original order.
  // (A LIFO stack reverses sibling arrays — the playlist would appear backwards.)
  const queue: unknown[] = [data];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    const record = asRecord(current);
    if (!record) continue;

    const renderer = asRecord(record.playlistVideoRenderer);
    const videoId = renderer && typeof renderer.videoId === "string" ? renderer.videoId : "";
    if (renderer && videoId && !videos.has(videoId)) {
      videos.set(videoId, {
        videoId,
        title: readText(renderer.title) || "Unknown Title",
        thumbnailUrl: readThumbnailUrl(renderer.thumbnail),
      });
    }

    for (const value of Object.values(record)) {
      if (value && typeof value === "object") queue.push(value);
    }
  }

  return Array.from(videos.values());
}

function extractYoutubeInitialData(html: string): unknown | null {
  const match =
    html.match(/var ytInitialData = ([\s\S]*?);<\/script>/) ??
    html.match(/window\["ytInitialData"\]\s*=\s*([\s\S]*?);/) ??
    html.match(/ytInitialData\s*=\s*([\s\S]*?);<\/script>/);

  if (!match?.[1]) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

async function fetchYoutubePlaylistFromPage(playlistId: string, title = "YouTube Playlist"): Promise<YoutubePlaylistData> {
  const response = await fetch(`https://www.youtube.com/playlist?list=${playlistId}&hl=en`, {
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Failed to fetch playlist page");

  const initialData = extractYoutubeInitialData(await response.text());
  const videos = initialData ? collectPlaylistVideosFromInitialData(initialData) : [];

  return {
    playlistId,
    title,
    videos,
  };
}

export async function fetchYoutubeMetadata(
  url: string
): Promise<{ videoId: string; title: string; thumbnailUrl: string }> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  try {
    const videoInfo = await play.video_basic_info(`https://www.youtube.com/watch?v=${videoId}`);
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

/**
 * Reliable enumeration via the official YouTube Data API v3 (paginated, in order).
 * Returns null when no API key is configured or the request fails, so callers
 * can fall back to scraping. Costs ~1 quota unit per 50 videos.
 */
async function fetchPlaylistViaDataApi(playlistId: string): Promise<YoutubePlaylistData | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;

  try {
    let title = "YouTube Playlist";
    const pRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${key}`,
      { cache: "no-store" }
    );
    if (pRes.ok) {
      const pData = await pRes.json();
      title = pData.items?.[0]?.snippet?.title || title;
    }

    const videos: YoutubePlaylistVideoPreview[] = [];
    let pageToken = "";
    do {
      const url =
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${key}` +
        (pageToken ? `&pageToken=${pageToken}` : "");
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) break;
      const data = await res.json();
      for (const item of data.items ?? []) {
        const s = item.snippet;
        const videoId = s?.resourceId?.videoId;
        if (!videoId) continue;
        // Skip private/deleted entries that can't be played.
        if (s.title === "Private video" || s.title === "Deleted video") continue;
        videos.push({
          videoId,
          title: s.title || "Untitled",
          thumbnailUrl:
            s.thumbnails?.medium?.url || s.thumbnails?.default?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        });
      }
      pageToken = data.nextPageToken || "";
    } while (pageToken);

    return videos.length > 0 ? { playlistId, title, videos } : null;
  } catch (err) {
    console.error("YouTube Data API playlist fetch failed", err);
    return null;
  }
}

export async function fetchYoutubePlaylist(
  playlistId: string
): Promise<YoutubePlaylistData> {
  // 1) Official Data API — reliable, ordered, quota-friendly.
  const viaApi = await fetchPlaylistViaDataApi(playlistId);
  if (viaApi) return viaApi;

  // 2) play-dl fallback.
  try {
    const playlist = await play.playlist_info(`https://www.youtube.com/playlist?list=${playlistId}`, { incomplete: true });
    const videos = await playlist.all_videos();
    const playlistVideos = videos.map((v) => ({
      videoId: v.id || "",
      title: v.title || "Unknown Title",
      thumbnailUrl: v.thumbnails[0]?.url || "",
    })).filter((v) => v.videoId);

    if (playlistVideos.length === 0) {
      return await fetchYoutubePlaylistFromPage(playlistId, playlist.title || "YouTube Playlist");
    }

    return {
      playlistId,
      title: playlist.title || "YouTube Playlist",
      videos: playlistVideos,
    };
  } catch (error) {
    console.error("play-dl failed to fetch playlist; trying page fallback", error);
    // 3) Page-scrape fallback.
    try {
      return await fetchYoutubePlaylistFromPage(playlistId);
    } catch (fallbackError) {
      console.error("playlist page fallback also failed", fallbackError);
      return { playlistId, title: "YouTube Playlist", videos: [] };
    }
  }
}

export async function createOrGetYoutubeSession(
  videoId: string,
  metadata?: { title: string; thumbnailUrl: string },
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

    // Only hit the (slow) external metadata API when actually creating a new
    // session and the caller didn't already supply title/thumbnail.
    const meta = metadata ?? (await fetchYoutubeMetadata(videoUrl));

    // Create new session
    const now = new Date();
    const sessionId = new ObjectId();
    await col.insertOne({
      _id: sessionId,
      userId,
      videoId,
      videoTitle: meta.title,
      thumbnailUrl: meta.thumbnailUrl,
      videoUrl,
      sourceType: "youtube",
      playerType: "youtube",
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

export async function createOrGetExternalVideoSession(
  url: string,
  metadata: { title?: string; thumbnailUrl?: string } = {},
  options: { tags?: string[]; difficulty?: Difficulty; delayDays?: number } = {}
): Promise<ActionResult<YoutubeSession>> {
  try {
    const user = await requireAuth();
    const userId = new ObjectId(user.id);
    const { tags = [], difficulty = "medium", delayDays = 2 } = options;
    const videoUrl = normalizeExternalUrl(url);
    const videoId = getExternalVideoId(videoUrl);
    const playerType = inferExternalPlayerType(videoUrl);

    const col = await getYoutubeSessionsCollection();
    const reps = await getYoutubeRepetitionsCollection();

    const existing = await col.findOne(
      { userId, videoId, sourceType: "external" },
      { sort: { createdAt: -1 } }
    );

    if (existing) {
      return { success: true, data: serializeYoutubeSession(existing) };
    }

    const now = new Date();
    const sessionId = new ObjectId();
    await col.insertOne({
      _id: sessionId,
      userId,
      videoId,
      videoTitle: metadata.title?.trim() || getExternalTitle(videoUrl),
      thumbnailUrl: metadata.thumbnailUrl || "",
      videoUrl,
      sourceType: "external",
      playerType,
      notes: "",
      tags: Array.from(new Set(["external-video", ...tags])),
      difficulty,
      createdAt: now,
      updatedAt: now,
    });

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

export async function renameYoutubeSession(
  sessionId: string,
  newTitle: string
): Promise<ActionResult> {
  try {
    if (!ObjectId.isValid(sessionId)) return { success: false, error: "Invalid session ID" };
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return { success: false, error: "Title is required" };
    const user = await requireAuth();
    const col = await getYoutubeSessionsCollection();
    const result = await col.updateOne(
      { _id: new ObjectId(sessionId), userId: new ObjectId(user.id) },
      { $set: { videoTitle: trimmedTitle, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return { success: false, error: "Session not found" };
    revalidatePath("/study/youtube");
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

/** Reschedule a YouTube session's next review to +N days from now. */
export async function rescheduleYoutubeAction(
  sessionId: string,
  daysFromNow: number
): Promise<ActionResult> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const reps = await getYoutubeRepetitionsCollection();
  const res = await reps.updateOne(
    { docId: new ObjectId(sessionId), userId },
    { $set: { nextReviewDate: getCustomNextReviewDate(daysFromNow), intervalDays: daysFromNow, updatedAt: new Date() } }
  );
  if (res.matchedCount === 0) return { success: false, error: "Review record not found." };
  revalidatePath("/dashboard");
  return { success: true };
}

/** Advance a YouTube session through its SRS schedule (a completed review). */
export async function completeYoutubeReviewAction(sessionId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const sessionObjId = new ObjectId(sessionId);
  const reps = await getYoutubeRepetitionsCollection();
  const sessions = await getYoutubeSessionsCollection();

  const rep = await reps.findOne({ docId: sessionObjId, userId });
  if (!rep) return { success: false, error: "Review record not found." };
  const session = await sessions.findOne({ _id: sessionObjId, userId });
  if (!session) return { success: false, error: "Video session not found." };

  const newReviewCount = rep.reviewCount + 1;
  const nextReviewDate = getNextReviewDate(session.difficulty, newReviewCount);

  await reps.updateOne(
    { docId: sessionObjId, userId },
    { $set: { nextReviewDate, reviewCount: newReviewCount, lastReviewedAt: new Date(), updatedAt: new Date() } }
  );
  await logReviewEvent(userId, sessionObjId, "youtube");

  revalidatePath("/dashboard");
  return { success: true };
}

/** Mark a YouTube session fully completed (removes it from the review queue). */
export async function markYoutubeCompletedAction(sessionId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const sessions = await getYoutubeSessionsCollection();
  const res = await sessions.updateOne(
    { _id: new ObjectId(sessionId), userId },
    { $set: { status: "completed", updatedAt: new Date() } }
  );
  if (res.matchedCount === 0) return { success: false, error: "Video session not found." };
  revalidatePath("/dashboard");
  return { success: true };
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
