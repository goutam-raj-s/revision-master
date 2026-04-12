"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import {
  getDocumentsCollection,
  getRepetitionsCollection,
  getNotesCollection,
  serializeDoc,
  serializeRepetition,
  serializeNote,
} from "@/lib/db/collections";
import type { TaskItem, TaskFilter } from "@/types";

export async function getTaskQueue(filter: TaskFilter = "today"): Promise<TaskItem[]> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const reps = await getRepetitionsCollection();
  const docs = await getDocumentsCollection();
  const notes = await getNotesCollection();

  // Build repetition query based on filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repQuery: Record<string, any> = { userId };

  if (filter === "today") {
    repQuery.nextReviewDate = { $gte: todayStart, $lte: todayEnd };
  } else if (filter === "pending") {
    repQuery.nextReviewDate = { $lt: todayStart };
  } else if (filter === "upcoming") {
    repQuery.nextReviewDate = { $gt: todayEnd };
  }
  // "all" has no date filter

  const repList = await reps.find(repQuery).sort({ nextReviewDate: 1 }).toArray();

  const tasks: TaskItem[] = [];
  for (const rep of repList) {
    const doc = await docs.findOne({
      _id: rep.docId,
      userId,
      status: { $ne: "completed" },
    });
    if (!doc) continue;

    const docNotes = await notes
      .find({ docId: rep.docId, isDone: false })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const isToday = rep.nextReviewDate <= today;
    const isOverdue = rep.nextReviewDate < new Date(new Date().setHours(0, 0, 0, 0));

    tasks.push({
      doc: serializeDoc(doc),
      repetition: serializeRepetition(rep),
      notes: docNotes.map(serializeNote),
      urgency: isOverdue ? "overdue" : isToday ? "today" : "upcoming",
    });
  }

  return tasks;
}

export async function getTaskQueueStats(): Promise<{
  todayCount: number;
  upcomingCount: number;
  overdueCount: number;
}> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const reps = await getRepetitionsCollection();
  const docs = await getDocumentsCollection();
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const completedDocIds = await docs
    .find({ userId, status: "completed" })
    .project({ _id: 1 })
    .toArray()
    .then((ds) => ds.map((d) => d._id));

  const allReps = await reps
    .find({ userId, docId: { $nin: completedDocIds } })
    .toArray();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const overdueCount = allReps.filter((r) => r.nextReviewDate < todayStart).length;
  const todayCount = allReps.filter(
    (r) => r.nextReviewDate >= todayStart && r.nextReviewDate <= todayEnd
  ).length;
  const upcomingCount = allReps.filter((r) => r.nextReviewDate > todayEnd).length;

  return { todayCount, upcomingCount, overdueCount };
}
