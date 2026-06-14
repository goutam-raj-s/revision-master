"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import { hiddenRevealed } from "@/lib/hidden";
import {
  getDocumentsCollection,
  getRepetitionsCollection,
  getNotesCollection,
  getYoutubeSessionsCollection,
  getYoutubeRepetitionsCollection,
  serializeDoc,
  serializeRepetition,
  serializeNote,
  serializeYoutubeSession,
} from "@/lib/db/collections";
import type { TaskItem, YoutubeTaskItem, TaskFilter } from "@/types";

export type AnyTaskItem = TaskItem | YoutubeTaskItem;

export async function getTaskQueue(filter: TaskFilter = "today"): Promise<AnyTaskItem[]> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const revealHidden = await hiddenRevealed();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const reps = await getRepetitionsCollection();
  const docs = await getDocumentsCollection();
  const notes = await getNotesCollection();
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

  function urgencyFor(nextReviewDate: Date): "overdue" | "today" | "upcoming" {
    const todayMidnight = new Date(new Date().setHours(0, 0, 0, 0));
    const todayEnd2 = new Date(new Date().setHours(23, 59, 59, 999));
    if (nextReviewDate < todayMidnight) return "overdue";
    if (nextReviewDate <= todayEnd2) return "today";
    return "upcoming";
  }

  const tasks: TaskItem[] = [];
  for (const rep of repList) {
    // Queue rows only show titles/metadata — omit the heavy `content` body.
    // Hidden docs stay out of the queue unless "reveal" is on.
    const doc = await docs.findOne(
      { _id: rep.docId, userId, status: { $ne: "completed" }, ...(revealHidden ? {} : { isHidden: { $ne: true } }) },
      { projection: { content: 0 } }
    );
    if (!doc) continue;
    if (doc.parentDocId) continue;

    const docNotes = await notes
      .find({ docId: rep.docId, isDone: false })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    tasks.push({
      doc: serializeDoc(doc),
      repetition: serializeRepetition(rep),
      notes: docNotes.map(serializeNote),
      urgency: urgencyFor(rep.nextReviewDate),
    });
  }

  // Fetch YouTube repetitions
  const ytRepList = await ytReps.find(repQuery).sort({ nextReviewDate: 1 }).toArray();
  const youtubeTasks: YoutubeTaskItem[] = [];
  for (const rep of ytRepList) {
    const session = await ytSessions.findOne({ _id: rep.docId, userId, status: { $ne: "completed" } });
    if (!session) continue;
    youtubeTasks.push({
      source: "youtube",
      session: serializeYoutubeSession(session),
      repetition: serializeRepetition(rep),
      urgency: urgencyFor(rep.nextReviewDate),
    });
  }

  // Merge and sort by nextReviewDate
  const allTasks: AnyTaskItem[] = [...tasks, ...youtubeTasks];
  allTasks.sort((a, b) => {
    const aDate = "source" in a ? a.repetition.nextReviewDate : a.repetition.nextReviewDate;
    const bDate = "source" in b ? b.repetition.nextReviewDate : b.repetition.nextReviewDate;
    return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
  });

  return allTasks;
}

export async function getTaskQueueStats(): Promise<{
  todayCount: number;
  upcomingCount: number;
  overdueCount: number;
}> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const reps = await getRepetitionsCollection();
  const ytReps = await getYoutubeRepetitionsCollection();
  const docs = await getDocumentsCollection();
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

  const overdueCount = allReps.filter((r) => r.nextReviewDate < todayStart).length;
  const todayCount = allReps.filter(
    (r) => r.nextReviewDate >= todayStart && r.nextReviewDate <= todayEnd
  ).length;
  const upcomingCount = allReps.filter((r) => r.nextReviewDate > todayEnd).length;

  return { todayCount, upcomingCount, overdueCount };
}
