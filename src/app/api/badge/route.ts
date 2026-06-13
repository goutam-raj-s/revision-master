import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { getRepetitionsCollection } from "@/lib/db/collections";

export const dynamic = "force-dynamic";

/**
 * Lightweight due-count endpoint for the desktop shell's dock/tray badge.
 * Auth comes from the shared rm_session cookie, so the Electron window can
 * fetch it directly. Returns { due } = items whose nextReviewDate <= end of
 * today (overdue + due today).
 */
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ due: 0, authenticated: false });
  }

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const reps = await getRepetitionsCollection();
  const due = await reps.countDocuments({
    userId: new ObjectId(user.id),
    nextReviewDate: { $lte: todayEnd },
  });

  return NextResponse.json({ due, authenticated: true });
}
