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
  deleteLinkedInComment,
  deleteLinkedInReaction,
  editLinkedInComment,
  getConnection,
  listLinkedInPosts,
  publish,
  isProviderConfigured,
  PROVIDERS,
} from "@/lib/social";
import type {
  ActionResult,
  SocialConnection,
  SocialProvider,
  PostPlatform,
} from "@/types";
import type { LinkedInReactionType } from "@/lib/social";
import type { LinkedInPostSummary } from "@/lib/social";

const PLATFORM_TO_PROVIDER: Partial<Record<PostPlatform, SocialProvider>> = {
  linkedin: "linkedin",
  twitter: "twitter",
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

async function requireLinkedInConnection(userId: string) {
  const conn = await getConnection(userId, "linkedin");
  if (!conn) throw new Error("Connect your LinkedIn account first.");
  return conn;
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
    const posts = await listLinkedInPosts(await requireLinkedInConnection(user.id));
    return { success: true, data: posts };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not load LinkedIn posts." };
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
