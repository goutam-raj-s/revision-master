import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getUsersCollection,
  getRepetitionsCollection,
  getDocumentsCollection,
} from "@/lib/db/collections";
import { sendReviewReminderEmail, type ReminderItem } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Daily review-reminder digest. Invoke from a scheduler (crontab/GitHub
 * Action) once a day:
 *   curl -s "https://www.lostbae.com/api/cron/reminders?secret=$CRON_SECRET"
 *
 * Guarded by CRON_SECRET. A 20h per-user cooldown (lastReminderSentAt)
 * makes accidental double-invocations harmless.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("x-cron-secret");

  if (!secret || provided !== secret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.lostbae.com").replace(/\/$/, "");
  const users = await getUsersCollection();
  const reps = await getRepetitionsCollection();
  const docs = await getDocumentsCollection();

  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const cooldownCutoff = new Date(now.getTime() - 20 * 60 * 60 * 1000);

  const candidates = await users
    .find({
      emailReminders: { $ne: false },
      $or: [
        { lastReminderSentAt: { $exists: false } },
        { lastReminderSentAt: { $lt: cooldownCutoff } },
      ],
    })
    .toArray();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of candidates) {
    try {
      const due = await reps
        .find({ userId: user._id, nextReviewDate: { $lte: todayEnd } })
        .sort({ nextReviewDate: 1 })
        .toArray();

      if (due.length === 0) {
        skipped++;
        continue;
      }

      const docIds = due.map((r) => r.docId);
      const docList = await docs
        .find({ _id: { $in: docIds } })
        .project({ title: 1 })
        .toArray();
      const titleById = new Map(docList.map((d) => [d._id.toString(), d.title as string]));

      const todayMidnight = new Date(now);
      todayMidnight.setHours(0, 0, 0, 0);

      const items: ReminderItem[] = due.map((r) => ({
        title: titleById.get(r.docId.toString()) ?? "Untitled document",
        overdueDays: Math.max(
          0,
          Math.floor((todayMidnight.getTime() - new Date(r.nextReviewDate).getTime()) / 86400000)
        ),
      }));

      await sendReviewReminderEmail(user.email, user.name, items, appUrl);
      await users.updateOne(
        { _id: user._id },
        { $set: { lastReminderSentAt: new Date() } }
      );
      sent++;
    } catch (err) {
      console.error(`Reminder failed for ${user.email}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, skipped, failed, candidates: candidates.length });
}
