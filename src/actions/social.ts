"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
  getSocialConnectionsCollection,
  getPostDraftsCollection,
} from "@/lib/db/collections";
import { getConnection, publish, isProviderConfigured, PROVIDERS } from "@/lib/social";
import type {
  ActionResult,
  SocialConnection,
  SocialProvider,
  PostPlatform,
} from "@/types";

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
    const result = await publish(conn, draft.body);
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
