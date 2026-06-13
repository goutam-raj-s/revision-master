"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import {
  getDocumentsCollection,
  getRepetitionsCollection,
} from "@/lib/db/collections";
import { computeStreak, type StreakData } from "@/lib/streak";
import type { DashboardStats } from "@/types";

export async function getStreakAction(): Promise<StreakData> {
  const user = await requireAuth();
  return computeStreak(new ObjectId(user.id));
}

function topLevelDocumentMatch(userId: ObjectId) {
  return {
    userId,
    $and: [
      { parentDocId: { $exists: false } },
    ],
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const docs = await getDocumentsCollection();
  const reps = await getRepetitionsCollection();

  const [totalDocs, totalCompleted] = await Promise.all([
    docs.countDocuments(topLevelDocumentMatch(userId)),
    docs.countDocuments({ ...topLevelDocumentMatch(userId), status: "completed" }),
  ]);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const activeTopLevelDocIds = await docs
    .find({ ...topLevelDocumentMatch(userId), status: { $ne: "completed" } })
    .project({ _id: 1 })
    .toArray()
    .then((ds) => ds.map((d) => d._id));

  const pendingRevisions = await reps.countDocuments({
    userId,
    nextReviewDate: { $lte: todayEnd },
    docId: { $in: activeTopLevelDocIds },
  });

  // Most repeated topics: tags ranked by total revision count
  const mostRepeatedTopics = await docs
    .aggregate<{ tag: string; count: number }>([
      { $match: topLevelDocumentMatch(userId) },
      { $unwind: "$tags" },
      {
        $lookup: {
          from: "repetitions",
          localField: "_id",
          foreignField: "docId",
          as: "rep",
        },
      },
      { $unwind: { path: "$rep", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$tags",
          count: { $sum: { $ifNull: ["$rep.reviewCount", 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { tag: "$_id", count: 1, _id: 0 } },
    ])
    .toArray();

  // Least revised areas: tags with longest gap since last revision
  const leastRevisedAreas = await docs
    .aggregate<{ tag: string; daysSinceLastRevision: number }>([
      { $match: topLevelDocumentMatch(userId) },
      { $unwind: "$tags" },
      {
        $lookup: {
          from: "repetitions",
          localField: "_id",
          foreignField: "docId",
          as: "rep",
        },
      },
      { $unwind: { path: "$rep", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$tags",
          // Fall back to when the doc was added (not epoch 0) so never-reviewed
          // items show a real "days since added", not ~56 years.
          lastReviewedAt: {
            $max: { $ifNull: ["$rep.lastReviewedAt", "$createdAt"] },
          },
        },
      },
      {
        $project: {
          tag: "$_id",
          daysSinceLastRevision: {
            $divide: [
              { $subtract: [new Date(), "$lastReviewedAt"] },
              86400000,
            ],
          },
          _id: 0,
        },
      },
      { $sort: { daysSinceLastRevision: -1 } },
      { $limit: 5 },
    ])
    .toArray();

  return {
    totalDocs,
    pendingRevisions,
    totalCompleted,
    mostRepeatedTopics,
    leastRevisedAreas: leastRevisedAreas.map((l) => ({
      ...l,
      daysSinceLastRevision: Math.round(l.daysSinceLastRevision),
    })),
  };
}

export async function getReviewTrendAction(): Promise<{ day: string; count: number }[]> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const reps = await getRepetitionsCollection();
  const docs = await getDocumentsCollection();

  // Build a 7-day window starting from 6 days ago (inclusive of today)
  const days: { day: string; date: Date }[] = [];
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({ day: DAY_LABELS[d.getDay()], date: d });
  }

  const windowStart = days[0].date;
  const windowEnd = new Date();
  windowEnd.setHours(23, 59, 59, 999);

  const topLevelDocIds = await docs
    .find(topLevelDocumentMatch(userId))
    .project({ _id: 1 })
    .toArray()
    .then((ds) => ds.map((d) => d._id));

  const reviewed = await reps
    .find({
      userId,
      docId: { $in: topLevelDocIds },
      lastReviewedAt: { $gte: windowStart, $lte: windowEnd },
    })
    .project({ lastReviewedAt: 1 })
    .toArray();

  // Count by day label index
  const counts = new Map<string, number>();
  for (const { day } of days) counts.set(day, 0);

  for (const rep of reviewed) {
    const d = new Date(rep.lastReviewedAt as Date);
    const label = DAY_LABELS[d.getDay()];
    // Only count if this label is within our 7-day window
    if (counts.has(label)) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  return days.map(({ day }) => ({ day, count: counts.get(day) ?? 0 }));
}
