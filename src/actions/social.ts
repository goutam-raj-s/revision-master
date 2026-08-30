"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
  getSocialConnectionsCollection,
  getPostDraftsCollection,
} from "@/lib/db/collections";
import {
  createLinkedInComment,
  createLinkedInReaction,
  createTwitterReply,
  deleteLinkedInComment,
  deleteLinkedInReaction,
  deleteTwitterDirectMessage,
  deleteTwitterTweet,
  editLinkedInComment,
  getConnection,
  listLinkedInPosts,
  listTwitterDmEvents,
  listTwitterTweets,
  publish,
  sendTwitterDirectMessage,
  isProviderConfigured,
  PROVIDERS,
} from "@/lib/social";
import type {
  ActionResult,
  SocialConnection,
  SocialProvider,
  PostPlatform,
} from "@/types";
import type {
  LinkedInPostSummary,
  LinkedInReactionType,
  TwitterDmEventSummary,
  TwitterPostSummary,
} from "@/lib/social";

const PLATFORM_TO_PROVIDER: Partial<Record<PostPlatform, SocialProvider>> = {
  linkedin: "linkedin",
  twitter: "twitter",
  tumblr: "tumblr",
};

export async function getSocialConnectionsAction(): Promise<{
  connections: SocialConnection[];
  configured: SocialProvider[];
}> {
  const user = await requireAuth();
  const col = await getSocialConnectionsCollection();
  const rows = await col.find({ userId: new ObjectId(user.id) }).toArray();
  const now = Date.now();

  const connections: SocialConnection[] = rows.map((c) => ({
    provider: c.provider,
    displayName: c.displayName,
    connectedAt: c.connectedAt.toISOString(),
    expiresAt: c.accessTokenExpiresAt?.toISOString(),
    expired: Boolean(
      c.accessTokenExpiresAt &&
        c.accessTokenExpiresAt.getTime() < now &&
        !c.refreshTokenEncrypted
    ),
  }));

  const configured = (Object.keys(PROVIDERS) as SocialProvider[]).filter((p) =>
    isProviderConfigured(p)
  );

  return { connections, configured };
}

export async function disconnectSocialAction(
  provider: SocialProvider
): Promise<ActionResult> {
  const user = await requireAuth();
  const col = await getSocialConnectionsCollection();
  await col.deleteOne({ userId: new ObjectId(user.id), provider });
  revalidatePath("/posts");
  return { success: true };
}

/** Publish a draft directly to its platform via the connected account. */
export async function publishPostAction(draftId: string): Promise<ActionResult<{ url: string }>> {
  const user = await requireAuth();
  if (!ObjectId.isValid(draftId)) return { success: false, error: "Invalid draft." };

  const drafts = await getPostDraftsCollection();
  const draft = await drafts.findOne({
    _id: new ObjectId(draftId),
    userId: new ObjectId(user.id),
  });
  if (!draft) return { success: false, error: "Draft not found." };

  const provider = PLATFORM_TO_PROVIDER[draft.platform];
  if (!provider) {
    return {
      success: false,
      error: "Direct publishing isn't available for this platform — use “Open to post”.",
    };
  }

  const conn = await getConnection(user.id, provider);
  if (!conn) {
    return {
      success: false,
      error: `Connect your ${PROVIDERS[provider].label} account first.`,
    };
  }

  try {
    const result = await publish(conn, draft.body, {
      images: draft.images,
      imageDataUrl: draft.imageDataUrl,
      imageName: draft.imageName,
      imageMimeType: draft.imageMimeType,
    });
    await drafts.updateOne(
      { _id: draft._id },
      {
        $set: {
          status: "published",
          publishedUrl: result.url,
          providerPostId: result.providerPostId,
          updatedAt: new Date(),
        },
        $unset: { publishError: "" },
      }
    );
    revalidatePath("/posts");
    return { success: true, data: { url: result.url } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed.";
    await drafts.updateOne(
      { _id: draft._id },
      { $set: { publishError: message, updatedAt: new Date() } }
    );
    revalidatePath("/posts");
    return { success: false, error: message };
  }
}

function normalizeLinkedInTarget(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const decoded = decodeURIComponent(raw);
  const urnMatch = decoded.match(/urn:li:(?:activity|share|ugcPost|comment):(?:\([^)\s]+,[^)]+\)|[A-Za-z0-9_-]+)/);
  if (urnMatch) return urnMatch[0];

  const activityMatch =
    decoded.match(/activity[-/:](\d{10,})/) ??
    decoded.match(/linkedin\.com\/feed\/update\/(\d{10,})/);
  if (activityMatch?.[1]) return `urn:li:activity:${activityMatch[1]}`;

  return null;
}

function normalizeLinkedInCommentId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const decoded = decodeURIComponent(raw);
  const commentUrn = decoded.match(/urn:li:comment:\([^,]+,([^)]+)\)/);
  if (commentUrn?.[1]) return commentUrn[1];
  const id = decoded.match(/\d{10,}/);
  return id?.[0] ?? null;
}

function normalizeTwitterTweetId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const decoded = decodeURIComponent(raw);
  const statusMatch = decoded.match(/(?:twitter|x)\.com\/[^/\s]+\/status\/(\d{5,})/i);
  if (statusMatch?.[1]) return statusMatch[1];
  const idMatch = decoded.match(/\b\d{5,}\b/);
  return idMatch?.[0] ?? null;
}

function normalizeTwitterDmId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  return /^[0-9-]{2,}$/.test(raw) ? raw : null;
}

async function requireLinkedInConnection(userId: string) {
  const conn = await getConnection(userId, "linkedin");
  if (!conn) throw new Error("Connect your LinkedIn account first.");
  return conn;
}

async function requireTwitterConnection(userId: string) {
  const conn = await getConnection(userId, "twitter");
  if (!conn) throw new Error("Connect your X account first.");
  return conn;
}

async function listTrackedLinkedInPosts(userId: string): Promise<LinkedInPostSummary[]> {
  const drafts = await getPostDraftsCollection();
  const rows = await drafts
    .find({
      userId: new ObjectId(userId),
      platform: "linkedin",
      status: "published",
      $or: [
        { providerPostId: { $type: "string" } },
        { publishedUrl: { $type: "string" } },
      ],
    })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  const posts: LinkedInPostSummary[] = [];
  for (const post of rows) {
    const id = post.providerPostId ?? normalizeLinkedInTarget(post.publishedUrl ?? "");
    if (!id) continue;
    posts.push({
      id,
      url: post.publishedUrl ?? `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}`,
      commentary: post.body,
      publishedAt: post.updatedAt.getTime(),
      lastModifiedAt: post.updatedAt.getTime(),
      source: "lostbae",
    });
  }
  return posts;
}

export async function createLinkedInCommentAction(
  target: string,
  text: string
): Promise<ActionResult<{ id: string; commentUrn?: string }>> {
  const user = await requireAuth();
  const targetUrn = normalizeLinkedInTarget(target);
  if (!targetUrn) return { success: false, error: "Paste a LinkedIn post URL or URN." };
  if (!text.trim()) return { success: false, error: "Write a comment first." };

  try {
    const result = await createLinkedInComment(
      await requireLinkedInConnection(user.id),
      targetUrn,
      text.trim()
    );
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Comment failed." };
  }
}

export async function listLinkedInPostsAction(): Promise<ActionResult<LinkedInPostSummary[]>> {
  const user = await requireAuth();
  try {
    const [linkedInPosts, trackedPosts] = await Promise.all([
      listLinkedInPosts(await requireLinkedInConnection(user.id)),
      listTrackedLinkedInPosts(user.id),
    ]);
    const seen = new Set<string>();
    const posts = [...linkedInPosts, ...trackedPosts].filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
    return { success: true, data: posts };
  } catch (err) {
    const trackedPosts = await listTrackedLinkedInPosts(user.id);
    if (trackedPosts.length > 0) {
      return { success: true, data: trackedPosts };
    }
    const message = err instanceof Error ? err.message : "Could not load LinkedIn posts.";
    if (message.includes("ACCESS_DENIED") || message.includes("403")) {
      return {
        success: false,
        error: "LinkedIn did not grant this app permission to fetch your full post history. Posts published or tracked in lostbae will appear here after you create them.",
      };
    }
    return { success: false, error: message };
  }
}

async function listTrackedTwitterPosts(userId: string): Promise<TwitterPostSummary[]> {
  const drafts = await getPostDraftsCollection();
  const rows = await drafts
    .find({
      userId: new ObjectId(userId),
      platform: "twitter",
      status: "published",
      $or: [
        { providerPostId: { $type: "string" } },
        { publishedUrl: { $type: "string" } },
      ],
    })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  return rows.flatMap((post) => {
    const id = post.providerPostId ?? normalizeTwitterTweetId(post.publishedUrl ?? "");
    if (!id) return [];
    return [{
      id,
      url: post.publishedUrl ?? `https://twitter.com/i/status/${id}`,
      text: post.body,
      createdAt: post.updatedAt.toISOString(),
      source: "lostbae" as const,
    }];
  });
}

export async function listTwitterTweetsAction(): Promise<ActionResult<TwitterPostSummary[]>> {
  const user = await requireAuth();
  try {
    const [twitterPosts, trackedPosts] = await Promise.all([
      listTwitterTweets(await requireTwitterConnection(user.id)),
      listTrackedTwitterPosts(user.id),
    ]);
    const seen = new Set<string>();
    const posts = [...twitterPosts, ...trackedPosts].filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
    return { success: true, data: posts };
  } catch (err) {
    const trackedPosts = await listTrackedTwitterPosts(user.id);
    if (trackedPosts.length > 0) return { success: true, data: trackedPosts };
    return { success: false, error: err instanceof Error ? err.message : "Could not load X posts." };
  }
}

export async function createTwitterReplyAction(
  target: string,
  text: string
): Promise<ActionResult<{ id: string; url: string }>> {
  const user = await requireAuth();
  const tweetId = normalizeTwitterTweetId(target);
  if (!tweetId) return { success: false, error: "Paste an X post URL or ID." };
  if (!text.trim()) return { success: false, error: "Write a reply first." };
  if (text.length > 280) {
    return { success: false, error: `X replies are limited to 280 characters (yours is ${text.length}).` };
  }

  try {
    const result = await createTwitterReply(await requireTwitterConnection(user.id), tweetId, text.trim());
    return { success: true, data: { id: result.providerPostId, url: result.url } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Reply failed." };
  }
}

export async function deleteTwitterTweetAction(target: string): Promise<ActionResult> {
  const user = await requireAuth();
  const tweetId = normalizeTwitterTweetId(target);
  if (!tweetId) return { success: false, error: "Paste an X post URL or ID." };

  try {
    await deleteTwitterTweet(await requireTwitterConnection(user.id), tweetId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Delete failed." };
  }
}

export async function listTwitterDmEventsAction(): Promise<ActionResult<TwitterDmEventSummary[]>> {
  const user = await requireAuth();
  try {
    return { success: true, data: await listTwitterDmEvents(await requireTwitterConnection(user.id)) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not load X DMs." };
  }
}

export async function sendTwitterDirectMessageAction(
  target: string,
  text: string,
  mode: "participant" | "conversation"
): Promise<ActionResult<{ conversationId: string; eventId: string }>> {
  const user = await requireAuth();
  const dmTarget = normalizeTwitterDmId(target);
  if (!dmTarget) return { success: false, error: "Enter a user ID or conversation ID." };
  if (!text.trim()) return { success: false, error: "Write a DM first." };

  try {
    const result = await sendTwitterDirectMessage(
      await requireTwitterConnection(user.id),
      dmTarget,
      text.trim(),
      mode
    );
    return { success: true, data: { conversationId: result.conversationId, eventId: result.eventId } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "DM send failed." };
  }
}

export async function deleteTwitterDirectMessageAction(eventId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const id = normalizeTwitterDmId(eventId);
  if (!id) return { success: false, error: "Enter a DM event ID." };

  try {
    await deleteTwitterDirectMessage(await requireTwitterConnection(user.id), id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "DM delete failed." };
  }
}

export async function editLinkedInCommentAction(
  target: string,
  commentIdOrUrn: string,
  text: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const targetUrn = normalizeLinkedInTarget(target);
  const commentId = normalizeLinkedInCommentId(commentIdOrUrn);
  if (!targetUrn) return { success: false, error: "Paste the LinkedIn post URL or URN." };
  if (!commentId) return { success: false, error: "Paste the comment ID or comment URN." };
  if (!text.trim()) return { success: false, error: "Write the updated comment text." };

  try {
    await editLinkedInComment(
      await requireLinkedInConnection(user.id),
      targetUrn,
      commentId,
      text.trim()
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Comment edit failed." };
  }
}

export async function deleteLinkedInCommentAction(
  target: string,
  commentIdOrUrn: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const targetUrn = normalizeLinkedInTarget(target);
  const commentId = normalizeLinkedInCommentId(commentIdOrUrn);
  if (!targetUrn) return { success: false, error: "Paste the LinkedIn post URL or URN." };
  if (!commentId) return { success: false, error: "Paste the comment ID or comment URN." };

  try {
    await deleteLinkedInComment(await requireLinkedInConnection(user.id), targetUrn, commentId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Comment delete failed." };
  }
}

export async function createLinkedInReactionAction(
  target: string,
  reactionType: LinkedInReactionType
): Promise<ActionResult> {
  const user = await requireAuth();
  const targetUrn = normalizeLinkedInTarget(target);
  if (!targetUrn) return { success: false, error: "Paste a LinkedIn post, comment URL, or URN." };

  try {
    await createLinkedInReaction(await requireLinkedInConnection(user.id), targetUrn, reactionType);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Reaction failed." };
  }
}

export async function deleteLinkedInReactionAction(target: string): Promise<ActionResult> {
  const user = await requireAuth();
  const targetUrn = normalizeLinkedInTarget(target);
  if (!targetUrn) return { success: false, error: "Paste a LinkedIn post, comment URL, or URN." };

  try {
    await deleteLinkedInReaction(await requireLinkedInConnection(user.id), targetUrn);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Reaction delete failed." };
  }
}
