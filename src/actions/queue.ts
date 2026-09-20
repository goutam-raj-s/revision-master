"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import { hiddenRevealed } from "@/lib/hidden";
import {
  getDocumentsCollection,
  getRepetitionsCollection,
  getNotesCollection,
  getTasksCollection,
  getTopicCollectionsCollection,
  getYoutubeSessionsCollection,
  getYoutubeRepetitionsCollection,
  serializeDoc,
  serializeRepetition,
  serializeNote,
  serializeTask,
  serializeYoutubeSession,
  LIST_DOC_PROJECTION,
} from "@/lib/db/collections";
import type { LightweightTaskQueueItem, TaskItem, YoutubeTaskItem, TaskFilter } from "@/types";

export type AnyTaskItem = TaskItem | YoutubeTaskItem | LightweightTaskQueueItem;

async function getCollectionItemIds(userId: ObjectId): Promise<{ docIds: ObjectId[]; taskIds: ObjectId[] }> {
  const collections = await getTopicCollectionsCollection();
  const rows = await collections
    .find({ userId })
    .project<{ docIds?: ObjectId[]; taskIds?: ObjectId[] }>({ docIds: 1, taskIds: 1 })
    .toArray();
  return {
    docIds: rows.flatMap((row) => row.docIds ?? []),
    taskIds: rows.flatMap((row) => row.taskIds ?? []),
  };
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
  const revealHidden = await hiddenRevealed();
  const collectionIds = options?.includeCollectionItems ? { docIds: [], taskIds: [] } : await getCollectionItemIds(userId);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const reps = await getRepetitionsCollection();
  const docs = await getDocumentsCollection();
  const notes = await getNotesCollection();
  const lightweightTasks = await getTasksCollection();
  const ytReps = await getYoutubeRepetitionsCollection();
  const ytSessions = await getYoutubeSessionsCollection();

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

  // Batch the doc + notes lookups instead of querying per repetition. With many
  // due reviews the old per-item loop was 2 round-trips × N items, which on
  // Vercel could exceed the serverless function time limit for heavy accounts.
  const docIds = repList.map((r) => r.docId);
  const docIdFilter: Record<string, ObjectId[]> = { $in: docIds };
  if (collectionIds.docIds.length > 0) docIdFilter.$nin = collectionIds.docIds;
  const docList = await docs
    .find({
      _id: docIdFilter,
      userId,
      status: { $ne: "completed" },
      ...(revealHidden ? {} : { isHidden: { $ne: true } }),
    })
    .project(LIST_DOC_PROJECTION)
    .toArray();
  const docById = new Map(docList.map((d) => [d._id.toString(), d]));

  const noteList = await notes
    .find({ docId: { $in: docIds }, isDone: false })
    .sort({ createdAt: -1 })
    .toArray();
  const notesByDoc = new Map<string, typeof noteList>();
  for (const n of noteList) {
    const key = n.docId.toString();
    const arr = notesByDoc.get(key) ?? [];
    if (arr.length < 3) arr.push(n); // keep the 3 most recent per doc
    notesByDoc.set(key, arr);
  }

  const tasks: TaskItem[] = [];
  for (const rep of repList) {
    const doc = docById.get(rep.docId.toString());
    if (!doc) continue;
    if (doc.parentDocId) continue;
    tasks.push({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      doc: serializeDoc(doc as any),
      repetition: serializeRepetition(rep),
      notes: (notesByDoc.get(rep.docId.toString()) ?? []).map(serializeNote),
      urgency: urgencyForDate(rep.nextReviewDate),
    });
  }

  // Fetch YouTube repetitions (batched the same way).
  const ytRepList = await ytReps.find(repQuery).sort({ nextReviewDate: 1 }).toArray();
  const ytIds = ytRepList.map((r) => r.docId);
  const ytList = await ytSessions
    .find({ _id: { $in: ytIds }, userId, status: { $ne: "completed" } })
    .toArray();
  const ytById = new Map(ytList.map((s) => [s._id.toString(), s]));

  const youtubeTasks: YoutubeTaskItem[] = [];
  for (const rep of ytRepList) {
    const session = ytById.get(rep.docId.toString());
    if (!session) continue;
    youtubeTasks.push({
      source: "youtube",
      session: serializeYoutubeSession(session),
      repetition: serializeRepetition(rep),
      urgency: urgencyForDate(rep.nextReviewDate),
    });
  }

  const taskQuery: Record<string, unknown> = { userId, status: "pending" };
  if (filter === "today") {
    taskQuery.dueAt = { $gte: todayStart, $lte: todayEnd };
  } else if (filter === "pending") {
    taskQuery.dueAt = { $lt: todayStart };
  } else if (filter === "upcoming") {
    taskQuery.dueAt = { $gt: todayEnd };
  }
  if (collectionIds.taskIds.length > 0) {
    taskQuery._id = { $nin: collectionIds.taskIds };
  }
  const lightweightTaskItems: LightweightTaskQueueItem[] = (await lightweightTasks.find(taskQuery).sort({ dueAt: 1 }).toArray())
    .map((task) => ({
      source: "task",
      task: serializeTask(task),
      dueAt: task.dueAt?.toISOString(),
      urgency: task.dueAt ? urgencyForDate(task.dueAt) : "upcoming",
    }));

  // Merge and sort by nextReviewDate
  const allTasks: AnyTaskItem[] = [...tasks, ...youtubeTasks, ...lightweightTaskItems];
  allTasks.sort((a, b) => {
    const aDate = "source" in a && a.source === "task" ? a.dueAt ?? a.task.createdAt : a.repetition.nextReviewDate;
    const bDate = "source" in b && b.source === "task" ? b.dueAt ?? b.task.createdAt : b.repetition.nextReviewDate;
    return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
  });

  return allTasks;
}

export async function getTaskQueueStats(options?: { includeCollectionItems?: boolean }): Promise<{
  todayCount: number;
  upcomingCount: number;
  overdueCount: number;
}> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const reps = await getRepetitionsCollection();
  const ytReps = await getYoutubeRepetitionsCollection();
  const docs = await getDocumentsCollection();
  const lightweightTasks = await getTasksCollection();
  const collectionIds = options?.includeCollectionItems ? { docIds: [], taskIds: [] } : await getCollectionItemIds(userId);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const activeTopLevelDocIds = await docs
    .find({
      userId,
      status: { $ne: "completed" },
      parentDocId: { $exists: false },
      ...(collectionIds.docIds.length > 0 ? { _id: { $nin: collectionIds.docIds } } : {}),
    })
    .project({ _id: 1 })
    .toArray()
    .then((ds) => ds.map((d) => d._id));

  const allDocReps = await reps
    .find({ userId, docId: { $in: activeTopLevelDocIds } })
    .toArray();

  const ytSessions = await getYoutubeSessionsCollection();
  const activeYtSessionIds = await ytSessions
    .find({ userId, status: { $ne: "completed" } })
    .project({ _id: 1 })
    .toArray()
    .then((ss) => ss.map((s) => s._id));
  const allYtReps = await ytReps.find({ userId, docId: { $in: activeYtSessionIds } }).toArray();
  const allReps = [...allDocReps, ...allYtReps];

  const lightweightTaskRows = await lightweightTasks
    .find({
      userId,
      status: "pending",
      dueAt: { $exists: true },
      ...(collectionIds.taskIds.length > 0 ? { _id: { $nin: collectionIds.taskIds } } : {}),
    })
    .project({ dueAt: 1 })
    .toArray();

  const taskDueDates = lightweightTaskRows.map((task) => task.dueAt as Date).filter(Boolean);
  const overdueCount = allReps.filter((r) => r.nextReviewDate < todayStart).length + taskDueDates.filter((dueAt) => dueAt < todayStart).length;
  const todayCount = allReps.filter(
    (r) => r.nextReviewDate >= todayStart && r.nextReviewDate <= todayEnd
  ).length + taskDueDates.filter((dueAt) => dueAt >= todayStart && dueAt <= todayEnd).length;
  const upcomingCount = allReps.filter((r) => r.nextReviewDate > todayEnd).length + taskDueDates.filter((dueAt) => dueAt > todayEnd).length;

  return { todayCount, upcomingCount, overdueCount };
}
