"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import { generateToken } from "@/lib/crypto";
import {
  getYoutubeSharesCollection,
  getYoutubeShareByToken,
  serializeYoutubeShare,
  getYoutubeSessionsCollection,
  getYoutubePlaylistsCollection,
  serializeYoutubeSession,
  serializeYoutubePlaylist,
} from "@/lib/db/collections";
import type { ActionResult, YoutubeShare, YoutubeSession, YoutubePlaylist } from "@/types";

export async function createYoutubeShareAction(
  resourceType: "session" | "playlist",
  resourceId: string,
  title: string,
  shareType: "public" | "email",
  emails?: string[],
  accessLevel: "read" | "write" = "read"
): Promise<ActionResult<{ token: string; accessLevel: "read" | "write" }>> {
  const user = await requireAuth();
  if (!ObjectId.isValid(resourceId)) return { success: false, error: "Invalid resource ID." };

  const shares = await getYoutubeSharesCollection();
  const resourceObjectId = new ObjectId(resourceId);
  const ownerObjectId = new ObjectId(user.id);

  const existing = await shares.findOne({
    resourceType,
    resourceId: resourceObjectId,
    ownerId: ownerObjectId,
  });

  if (existing) {
    if (existing.accessLevel !== accessLevel) {
      await shares.updateOne({ _id: existing._id }, { $set: { accessLevel } });
    }
    return { success: true, data: { token: existing.token, accessLevel } };
  }

  const token = generateToken();
  await shares.insertOne({
    _id: new ObjectId(),
    token,
    ownerId: ownerObjectId,
    resourceType,
    resourceId: resourceObjectId,
    accessLevel,
    shareType,
    emails: emails && emails.length > 0 ? emails : undefined,
    title,
    createdAt: new Date(),
  });

  return { success: true, data: { token, accessLevel } };
}

export async function revokeYoutubeShareAction(token: string): Promise<ActionResult> {
  const user = await requireAuth();
  const share = await getYoutubeShareByToken(token);
  if (!share) return { success: false, error: "Share not found." };
  if (share.ownerId.toString() !== user.id) return { success: false, error: "Not authorized." };

  const shares = await getYoutubeSharesCollection();
  await shares.deleteOne({ token });
  return { success: true };
}

export async function getYoutubeShareAction(
  resourceType: "session" | "playlist",
  resourceId: string
): Promise<ActionResult<YoutubeShare | null>> {
  const user = await requireAuth();
  if (!ObjectId.isValid(resourceId)) return { success: true, data: null };

  const shares = await getYoutubeSharesCollection();
  const share = await shares.findOne({
    resourceType,
    resourceId: new ObjectId(resourceId),
    ownerId: new ObjectId(user.id),
  });
  return { success: true, data: share ? serializeYoutubeShare(share) : null };
}

/** Load the resource referenced by a YouTube share token. */
export async function getYoutubeSharedResource(
  token: string
): Promise<ActionResult<{ share: YoutubeShare; session?: YoutubeSession; playlist?: YoutubePlaylist }>> {
  const share = await getYoutubeShareByToken(token);
  if (!share) return { success: false, error: "Share not found or expired." };

  const serialized = serializeYoutubeShare(share);

  if (share.resourceType === "session") {
    const col = await getYoutubeSessionsCollection();
    const session = await col.findOne({
      _id: share.resourceId,
      userId: share.ownerId,
    });
    if (!session) return { success: false, error: "Video session not found." };
    return { success: true, data: { share: serialized, session: serializeYoutubeSession(session) } };
  }

  if (share.resourceType === "playlist") {
    const playlistCol = await getYoutubePlaylistsCollection();
    const sessionCol = await getYoutubeSessionsCollection();
    const playlist = await playlistCol.findOne({
      _id: share.resourceId,
      userId: share.ownerId,
    });
    if (!playlist) return { success: false, error: "Playlist not found." };

    const sessions = playlist.sessionIds.length
      ? await sessionCol.find({ _id: { $in: playlist.sessionIds } }).toArray()
      : [];
    const sessionMap = new Map(sessions.map((s) => [s._id.toString(), s]));
    const items = playlist.sessionIds
      .map((id) => sessionMap.get(id.toString()))
      .filter(Boolean)
      .map((s) => ({
        sessionId: s!._id.toString(),
        videoId: s!.videoId,
        title: s!.videoTitle,
        thumbnailUrl: s!.thumbnailUrl,
        videoUrl: s!.videoUrl,
        sourceType: (s!.sourceType ?? "youtube") as "youtube" | "external",
      }));

    return {
      success: true,
      data: { share: serialized, playlist: serializeYoutubePlaylist(playlist, items) },
    };
  }

  return { success: false, error: "Unknown resource type." };
}
