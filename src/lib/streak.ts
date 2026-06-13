import { ObjectId } from "mongodb";
import { getReviewEventsCollection } from "@/lib/db/collections";

/** Local-day key (YYYY-MM-DD) used to bucket review activity. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type ReviewConfidence = "easy" | "okay" | "struggled";

/** Records one review for streak/heatmap aggregation. Best-effort: never throws. */
export async function logReviewEvent(
  userId: ObjectId,
  docId: ObjectId | undefined,
  source: "document" | "youtube",
  confidence?: ReviewConfidence
): Promise<void> {
  try {
    const now = new Date();
    const events = await getReviewEventsCollection();
    await events.insertOne({
      _id: new ObjectId(),
      userId,
      docId,
      source,
      reviewedAt: now,
      dayKey: dayKey(now),
      ...(confidence ? { confidence } : {}),
    });
  } catch (err) {
    console.error("logReviewEvent failed:", err);
  }
}

export interface StreakData {
  current: number;
  best: number;
  reviewedToday: boolean;
  /** Last 182 days of activity, oldest first. */
  heatmap: { date: string; count: number }[];
  totalReviews: number;
}

/** Computes current/best streak and a ~6-month activity heatmap from review_events. */
export async function computeStreak(userId: ObjectId): Promise<StreakData> {
  const events = await getReviewEventsCollection();

  const DAYS = 182;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - (DAYS - 1));

  // Per-day counts within the window (heatmap), plus all distinct active days
  // (streak can extend past the window, so aggregate day keys separately).
  const [windowAgg, allDays, total] = await Promise.all([
    events
      .aggregate<{ _id: string; count: number }>([
        { $match: { userId, reviewedAt: { $gte: windowStart } } },
        { $group: { _id: "$dayKey", count: { $sum: 1 } } },
      ])
      .toArray(),
    events.distinct("dayKey", { userId }),
    events.countDocuments({ userId }),
  ]);

  const countByDay = new Map(windowAgg.map((r) => [r._id, r.count]));

  const heatmap: { date: string; count: number }[] = [];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(windowStart);
    d.setDate(d.getDate() + i);
    const key = dayKey(d);
    heatmap.push({ date: key, count: countByDay.get(key) ?? 0 });
  }

  const activeSet = new Set(allDays as string[]);
  const reviewedToday = activeSet.has(dayKey(today));

  // Current streak: walk back from today (or yesterday if not yet reviewed today).
  let current = 0;
  const cursor = new Date(today);
  if (!reviewedToday) cursor.setDate(cursor.getDate() - 1);
  while (activeSet.has(dayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak: scan sorted distinct days for the longest consecutive run.
  const sorted = [...activeSet].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const [y, m, dd] = key.split("-").map(Number);
    const d = new Date(y, m - 1, dd);
    if (prev) {
      const diff = Math.round((d.getTime() - prev.getTime()) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = d;
  }

  return { current, best, reviewedToday, heatmap, totalReviews: total };
}
