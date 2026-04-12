"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import {
  getDocumentsCollection,
  getRepetitionsCollection,
} from "@/lib/db/collections";
import type { DashboardStats } from "@/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const docs = await getDocumentsCollection();
  const reps = await getRepetitionsCollection();

  const [totalDocs, totalCompleted] = await Promise.all([
    docs.countDocuments({ userId }),
    docs.countDocuments({ userId, status: "completed" }),
  ]);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const completedDocIds = await docs
    .find({ userId, status: "completed" })
    .project({ _id: 1 })
    .toArray()
    .then((ds) => ds.map((d) => d._id));

  const pendingRevisions = await reps.countDocuments({
    userId,
    nextReviewDate: { $lte: todayEnd },
    docId: { $nin: completedDocIds },
  });

  // Most repeated topics: tags ranked by total revision count
  const mostRepeatedTopics = await docs
    .aggregate<{ tag: string; count: number }>([
      { $match: { userId } },
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
      { $match: { userId } },
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
          lastReviewedAt: {
            $max: { $ifNull: ["$rep.lastReviewedAt", new Date(0)] },
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
