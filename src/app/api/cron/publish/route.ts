import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getPostDraftsCollection, getSocialConnectionsCollection } from "@/lib/db/collections";
import { publish } from "@/lib/social";
import type { SocialProvider, PostPlatform } from "@/types";

export const dynamic = "force-dynamic";

const PLATFORM_TO_PROVIDER: Partial<Record<PostPlatform, SocialProvider>> = {
  linkedin: "linkedin",
  twitter: "twitter",
};

/**
 * Publishes scheduled posts whose time has arrived. Invoke once a minute or
 * few minutes from a scheduler:
 *   curl -s "https://www.lostbae.com/api/cron/publish?secret=$CRON_SECRET"
 * Guarded by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-cron-secret");
  if (!secret || provided !== secret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const drafts = await getPostDraftsCollection();
  const conns = await getSocialConnectionsCollection();
  const now = new Date();

  const due = await drafts
    .find({ status: "scheduled", scheduledFor: { $lte: now } })
    .limit(50)
    .toArray();

  let published = 0;
  let failed = 0;
  let skipped = 0;

  for (const draft of due) {
    const provider = PLATFORM_TO_PROVIDER[draft.platform];
    if (!provider) {
      skipped++;
      continue;
    }
    const conn = await conns.findOne({ userId: draft.userId, provider });
    if (!conn) {
      await drafts.updateOne(
        { _id: draft._id },
        { $set: { publishError: "No connected account at publish time.", updatedAt: new Date() } }
      );
      skipped++;
      continue;
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
      published++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed.";
      await drafts.updateOne(
        { _id: draft._id as ObjectId },
        { $set: { publishError: message, updatedAt: new Date() } }
      );
      failed++;
    }
  }

  return NextResponse.json({ due: due.length, published, failed, skipped });
}
