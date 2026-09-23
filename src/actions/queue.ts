"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import {
  getTasksCollection,
  getTopicCollectionsCollection,
  serializeTask,
} from "@/lib/db/collections";
import type { LightweightTaskQueueItem, TaskFilter } from "@/types";

export type AnyTaskItem = LightweightTaskQueueItem;

async function getCollectionTaskIds(userId: ObjectId): Promise<ObjectId[]> {
  const collections = await getTopicCollectionsCollection();
  const rows = await collections
    .find({ userId })
    .project<{ taskIds?: ObjectId[] }>({ taskIds: 1 })
    .toArray();
  return rows.flatMap((row) => row.taskIds ?? []);
}

function urgencyForDate(date: Date): "overdue" | "today" | "upcoming" {
  const todayMidnight = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
  if (date < todayMidnight) return "overdue";
  if (date <= todayEnd) return "today";
  return "upcoming";
}

export async function getTaskQueue(filter: TaskFilter = "today", options?: { includeCollectionItems?: boolean }): Promise<AnyTaskItem[]> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const collectionTaskIds = options?.includeCollectionItems === false ? await getCollectionTaskIds(userId) : [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const lightweightTasks = await getTasksCollection();

  const taskQuery: Record<string, unknown> = { userId, status: "pending" };
  if (filter === "today") {
    taskQuery.dueAt = { $gte: todayStart, $lte: todayEnd };
  } else if (filter === "pending") {
    taskQuery.dueAt = { $lt: todayStart };
  } else if (filter === "upcoming") {
    taskQuery.dueAt = { $gt: todayEnd };
  }
  if (collectionTaskIds.length > 0) {
    taskQuery._id = { $nin: collectionTaskIds };
  }
  const taskItems: LightweightTaskQueueItem[] = (await lightweightTasks.find(taskQuery).sort({ dueAt: 1 }).toArray())
    .map((task) => ({
      source: "task",
      task: serializeTask(task),
      dueAt: task.dueAt?.toISOString(),
      urgency: task.dueAt ? urgencyForDate(task.dueAt) : "upcoming",
    }));

  taskItems.sort((a, b) => {
    const aDate = a.dueAt ?? a.task.createdAt;
    const bDate = b.dueAt ?? b.task.createdAt;
    return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
  });

  return taskItems;
}

export async function getTaskQueueStats(options?: { includeCollectionItems?: boolean }): Promise<{
  todayCount: number;
  upcomingCount: number;
  overdueCount: number;
}> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const lightweightTasks = await getTasksCollection();
  const collectionTaskIds = options?.includeCollectionItems === false ? await getCollectionTaskIds(userId) : [];
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const lightweightTaskRows = await lightweightTasks
    .find({
      userId,
      status: "pending",
      dueAt: { $exists: true },
      ...(collectionTaskIds.length > 0 ? { _id: { $nin: collectionTaskIds } } : {}),
    })
    .project({ dueAt: 1 })
    .toArray();

  const taskDueDates = lightweightTaskRows.map((task) => task.dueAt as Date).filter(Boolean);
  const overdueCount = taskDueDates.filter((dueAt) => dueAt < todayStart).length;
  const todayCount = taskDueDates.filter((dueAt) => dueAt >= todayStart && dueAt <= todayEnd).length;
  const upcomingCount = taskDueDates.filter((dueAt) => dueAt > todayEnd).length;

  return { todayCount, upcomingCount, overdueCount };
}
