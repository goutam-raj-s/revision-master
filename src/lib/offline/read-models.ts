"use client";

import { getOfflineRows } from "@/lib/offline/indexed-db";
import type {
  LightweightTask,
  LightweightTaskQueueItem,
  TaskFilter,
  Term,
  TopicCollection,
} from "@/types";
import type { StreakData } from "@/lib/streak";

type OfflineCollectionRow = {
  id: string;
  name: string;
  taskIds?: string[];
  docIds?: string[];
  publicToken?: string;
  createdAt: string;
};

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function urgencyForDate(value?: string): "overdue" | "today" | "upcoming" {
  if (!value) return "upcoming";
  const date = new Date(value);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  if (date < todayStart) return "overdue";
  if (date <= todayEnd) return "today";
  return "upcoming";
}

async function collectionTaskIdSet(): Promise<Set<string>> {
  const collections = await getOfflineRows<OfflineCollectionRow>("topicCollections");
  return new Set(collections.flatMap((collection) => collection.taskIds ?? []));
}

export async function getOfflineTaskRows(): Promise<LightweightTask[]> {
  const tasks = await getOfflineRows<LightweightTask>("tasks");
  return tasks.map((task) => ({ ...task, comments: task.comments ?? [], tags: task.tags ?? [] }));
}

export async function getOfflineTasksView(filter: {
  search?: string;
  tag?: string;
  status?: string;
  includeCollectionItems?: boolean;
}): Promise<{
  tasks: LightweightTask[];
  allTags: { tag: string; count: number }[];
  hasLocalData: boolean;
}> {
  const [allTasks, collectionTaskIds] = await Promise.all([
    getOfflineTaskRows(),
    collectionTaskIdSet(),
  ]);
  const scopedTasks = filter.includeCollectionItems
    ? allTasks
    : allTasks.filter((task) => !collectionTaskIds.has(task.id));
  const tagCounts = new Map<string, number>();
  for (const task of scopedTasks) {
    for (const tag of task.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  const query = filter.search?.trim().toLowerCase();
  const tasks = scopedTasks
    .filter((task) => {
      if (filter.status === "completed" || filter.status === "pending") {
        if (task.status !== filter.status) return false;
      }
      if (filter.tag && !task.tags.includes(filter.tag)) return false;
      if (query) {
        const haystack = [
          task.title,
          ...task.tags,
          ...task.comments.map((comment) => comment.content),
        ].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return {
    tasks,
    allTags: Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
    hasLocalData: allTasks.length > 0,
  };
}

export async function getOfflineCollectionsView(): Promise<{
  collections: TopicCollection[];
  hasLocalData: boolean;
}> {
  const rows = await getOfflineRows<OfflineCollectionRow>("topicCollections");
  return {
    hasLocalData: rows.length > 0,
    collections: rows
      .map((collection) => ({
        id: collection.id,
        name: collection.name,
        docCount: collection.docIds?.length ?? 0,
        taskCount: collection.taskIds?.length ?? 0,
        publicToken: collection.publicToken,
        createdAt: collection.createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  };
}

export async function getOfflineTerminologyView(): Promise<{
  terms: Term[];
  hasLocalData: boolean;
}> {
  const terms = await getOfflineRows<Term>("terms");
  return {
    hasLocalData: terms.length > 0,
    terms: terms
      .map((term) => ({ ...term, definition: term.definition ?? "" }))
      .sort((a, b) => a.term.localeCompare(b.term)),
  };
}

export async function getOfflineDashboardView(filter: TaskFilter, includeCollectionItems: boolean): Promise<{
  tasks: LightweightTaskQueueItem[];
  queueStats: { todayCount: number; upcomingCount: number; overdueCount: number };
  streak: StreakData;
  hasLocalData: boolean;
}> {
  const [allTasks, collectionTaskIds, reviewEvents] = await Promise.all([
    getOfflineTaskRows(),
    collectionTaskIdSet(),
    getOfflineRows<{ id: string; dayKey: string; reviewedAt: string }>("reviewEvents"),
  ]);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const scopedPending = allTasks.filter((task) => (
    task.status === "pending" && (includeCollectionItems || !collectionTaskIds.has(task.id))
  ));

  const queueTasks = scopedPending
    .filter((task) => {
      const dueAt = task.dueAt ? new Date(task.dueAt) : null;
      if (filter === "today") return !!dueAt && dueAt >= todayStart && dueAt <= todayEnd;
      if (filter === "pending") return !!dueAt && dueAt < todayStart;
      if (filter === "upcoming") return !!dueAt && dueAt > todayEnd;
      return true;
    })
    .map((task): LightweightTaskQueueItem => ({
      source: "task",
      task,
      dueAt: task.dueAt,
      urgency: urgencyForDate(task.dueAt),
    }))
    .sort((a, b) => {
      const aDate = a.dueAt ?? a.task.createdAt;
      const bDate = b.dueAt ?? b.task.createdAt;
      return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
    });

  const dueTasks = scopedPending.filter((task) => task.dueAt);
  const queueStats = {
    todayCount: dueTasks.filter((task) => {
      const dueAt = new Date(task.dueAt!);
      return dueAt >= todayStart && dueAt <= todayEnd;
    }).length,
    upcomingCount: dueTasks.filter((task) => new Date(task.dueAt!) > todayEnd).length,
    overdueCount: dueTasks.filter((task) => new Date(task.dueAt!) < todayStart).length,
  };

  return {
    tasks: queueTasks,
    queueStats,
    streak: buildOfflineStreak(reviewEvents),
    hasLocalData: allTasks.length > 0 || reviewEvents.length > 0,
  };
}

function buildOfflineStreak(events: { dayKey: string; reviewedAt: string }[]): StreakData {
  const DAYS = 182;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - (DAYS - 1));

  const countByDay = new Map<string, number>();
  const activeDays = new Set<string>();
  for (const event of events) {
    const key = event.dayKey || dayKey(new Date(event.reviewedAt));
    activeDays.add(key);
    if (new Date(key) >= windowStart) countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  const heatmap: { date: string; count: number }[] = [];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(windowStart);
    d.setDate(d.getDate() + i);
    const key = dayKey(d);
    heatmap.push({ date: key, count: countByDay.get(key) ?? 0 });
  }

  const todayKey = dayKey(today);
  const reviewedToday = activeDays.has(todayKey);
  let current = 0;
  const cursor = new Date(today);
  if (!reviewedToday) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(dayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sorted = [...activeDays].sort();
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
    best = Math.max(best, run);
    prev = d;
  }

  return { current, best, reviewedToday, heatmap, totalReviews: events.length };
}
