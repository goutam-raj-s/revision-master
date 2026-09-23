"use client";

import { getOfflineRows } from "@/lib/offline/indexed-db";
import type {
  CalorieDaySummary,
  CalorieEntry,
  CalorieLibraryItem,
  CalorieMonthSummary,
  CalorieWeekSummary,
  CaloriesOverview,
  LightweightTask,
  LightweightTaskQueueItem,
  PostDraft,
  SocialConnection,
  SocialProvider,
  TaskFilter,
  Term,
  TopicCollection,
} from "@/types";
import type { StreakData } from "@/lib/streak";

export interface OfflineActivityItem {
  title: string;
  source: "document" | "youtube";
  reviewedAt: string;
  confidence?: "easy" | "okay" | "struggled";
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAILY_REPORT_DAYS = 30;
const WEEKLY_REPORT_WEEKS = 8;
const MONTHLY_REPORT_MONTHS = 6;

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

function shiftDayKey(value: string, days: number): string {
  const d = new Date(`${value}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function mondayOf(value: string): string {
  const d = new Date(`${value}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return shiftDayKey(value, -dow);
}

function shiftMonthKey(monthKey: string, months: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

async function collectionTaskIdSet(): Promise<Set<string>> {
  const collections = await getOfflineRows<OfflineCollectionRow>("topicCollections");
  return new Set(collections.flatMap((collection) => collection.taskIds ?? []));
}

export async function getOfflineTaskRows(): Promise<LightweightTask[]> {
  const tasks = await getOfflineRows<LightweightTask>("tasks");
  return tasks.map((task) => ({ ...task, comments: task.comments ?? [], tags: task.tags ?? [] }));
}

export async function getOfflineTaskById(taskId: string): Promise<{
  task: LightweightTask | null;
  hasLocalData: boolean;
}> {
  const tasks = await getOfflineTaskRows();
  return {
    task: tasks.find((task) => task.id === taskId) ?? null,
    hasLocalData: tasks.length > 0,
  };
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
  const scopedTasks = filter.includeCollectionItems === false
    ? allTasks.filter((task) => !collectionTaskIds.has(task.id))
    : allTasks;
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

export async function getOfflineCollectionDetail(collectionId: string): Promise<{
  collection: { id: string; name: string; tasks: LightweightTask[]; publicToken?: string } | null;
  hasLocalData: boolean;
}> {
  const [collections, tasks] = await Promise.all([
    getOfflineRows<OfflineCollectionRow>("topicCollections"),
    getOfflineTaskRows(),
  ]);
  const collection = collections.find((row) => row.id === collectionId);
  if (!collection) return { collection: null, hasLocalData: collections.length > 0 };

  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  return {
    hasLocalData: true,
    collection: {
      id: collection.id,
      name: collection.name,
      publicToken: collection.publicToken,
      tasks: (collection.taskIds ?? [])
        .map((id) => tasksById.get(id))
        .filter((task): task is LightweightTask => Boolean(task)),
    },
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
    task.status === "pending" && (includeCollectionItems !== false || !collectionTaskIds.has(task.id))
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

export async function getOfflineStatsView(): Promise<{
  trend: { day: string; count: number }[];
  streak: StreakData;
  activity: OfflineActivityItem[];
  hasLocalData: boolean;
}> {
  const [reviewEvents, documents, youtubeSessions] = await Promise.all([
    getOfflineRows<{ id: string; dayKey: string; reviewedAt: string; docId?: string; source: "document" | "youtube"; confidence?: "easy" | "okay" | "struggled" }>("reviewEvents"),
    getOfflineRows<{ id: string; title: string }>("documents"),
    getOfflineRows<{ id: string; videoTitle: string }>("youtubeSessions"),
  ]);

  const days: { day: string; key: string }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({ day: DAY_LABELS[d.getDay()], key: dayKey(d) });
  }

  const counts = new Map(days.map((d) => [d.key, 0]));
  for (const event of reviewEvents) {
    const key = event.dayKey || dayKey(new Date(event.reviewedAt));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const docTitles = new Map(documents.map((doc) => [doc.id, doc.title]));
  const videoTitles = new Map(youtubeSessions.map((session) => [session.id, session.videoTitle]));
  const activity = [...reviewEvents]
    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())
    .slice(0, 8)
    .map((event) => ({
      title: event.source === "youtube"
        ? videoTitles.get(event.docId ?? "") ?? "A review"
        : docTitles.get(event.docId ?? "") ?? "A review",
      source: event.source,
      reviewedAt: event.reviewedAt,
      confidence: event.confidence,
    }));

  return {
    trend: days.map((d) => ({ day: d.day, count: counts.get(d.key) ?? 0 })),
    streak: buildOfflineStreak(reviewEvents),
    activity,
    hasLocalData: reviewEvents.length > 0 || documents.length > 0 || youtubeSessions.length > 0,
  };
}

export async function getOfflinePostsView(): Promise<{
  drafts: PostDraft[];
  connections: SocialConnection[];
  configured: SocialProvider[];
  hasLocalData: boolean;
}> {
  const [drafts, socialRows] = await Promise.all([
    getOfflineRows<PostDraft>("postDrafts"),
    getOfflineRows<(Partial<SocialConnection> & { id: string; provider: SocialProvider; configured?: boolean })>("socialConnections"),
  ]);
  return {
    drafts: drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    connections: socialRows
      .filter((row) => !row.configured)
      .map((row) => ({
        provider: row.provider,
        displayName: row.displayName,
        connectedAt: row.connectedAt ?? new Date(0).toISOString(),
        expiresAt: row.expiresAt,
        expired: Boolean(row.expired),
      })),
    configured: socialRows.filter((row) => row.configured).map((row) => row.provider),
    hasLocalData: drafts.length > 0 || socialRows.length > 0,
  };
}

export async function getOfflineCaloriesOverview(todayKey: string): Promise<{
  overview: CaloriesOverview;
  hasLocalData: boolean;
}> {
  const [entries, library, settings] = await Promise.all([
    getOfflineRows<CalorieEntry>("calorieEntries"),
    getOfflineRows<CalorieLibraryItem>("calorieLibrary"),
    getOfflineRows<{ id: string; dailyCalorieGoal?: number }>("calorieSettings"),
  ]);
  const rangeStart = `${shiftMonthKey(todayKey.slice(0, 7), -(MONTHLY_REPORT_MONTHS - 1))}-01`;
  const scopedEntries = entries.filter((entry) => entry.dayKey >= rangeStart && entry.dayKey <= todayKey);
  const byDay = new Map<string, { food: number; protein: number; carbs: number; fat: number; exercise: number; count: number }>();
  for (const entry of scopedEntries) {
    const current = byDay.get(entry.dayKey) ?? { food: 0, protein: 0, carbs: 0, fat: 0, exercise: 0, count: 0 };
    if (entry.kind === "food") {
      current.food += entry.totalCalories;
      current.protein += entry.proteinGrams ?? 0;
      current.carbs += entry.carbsGrams ?? 0;
      current.fat += entry.fatGrams ?? 0;
    } else {
      current.exercise += entry.totalCalories;
    }
    current.count += 1;
    byDay.set(entry.dayKey, current);
  }

  const summaryFor = (key: string): CalorieDaySummary => {
    const d = byDay.get(key);
    const food = d?.food ?? 0;
    const exercise = d?.exercise ?? 0;
    return {
      dayKey: key,
      foodCalories: food,
      proteinGrams: d?.protein ?? 0,
      carbsGrams: d?.carbs ?? 0,
      fatGrams: d?.fat ?? 0,
      exerciseCalories: exercise,
      netCalories: food - exercise,
      entryCount: d?.count ?? 0,
    };
  };

  const daily: CalorieDaySummary[] = [];
  for (let i = DAILY_REPORT_DAYS - 1; i >= 0; i--) daily.push(summaryFor(shiftDayKey(todayKey, -i)));

  const weekly: CalorieWeekSummary[] = [];
  const thisMonday = mondayOf(todayKey);
  for (let w = WEEKLY_REPORT_WEEKS - 1; w >= 0; w--) {
    const weekStartKey = shiftDayKey(thisMonday, -7 * w);
    const weekEndKey = shiftDayKey(weekStartKey, 6);
    let food = 0;
    let exercise = 0;
    let daysLogged = 0;
    for (let i = 0; i < 7; i++) {
      const key = shiftDayKey(weekStartKey, i);
      if (key > todayKey) break;
      const s = summaryFor(key);
      food += s.foodCalories;
      exercise += s.exerciseCalories;
      if (s.entryCount > 0) daysLogged += 1;
    }
    const net = food - exercise;
    weekly.push({ weekStartKey, weekEndKey, daysLogged, foodCalories: food, exerciseCalories: exercise, netCalories: net, avgNetPerLoggedDay: daysLogged ? Math.round(net / daysLogged) : 0 });
  }

  const monthTotals = new Map<string, { food: number; exercise: number; daysLogged: number }>();
  for (const [key, d] of byDay.entries()) {
    const monthKey = key.slice(0, 7);
    const current = monthTotals.get(monthKey) ?? { food: 0, exercise: 0, daysLogged: 0 };
    current.food += d.food;
    current.exercise += d.exercise;
    if (d.count > 0) current.daysLogged += 1;
    monthTotals.set(monthKey, current);
  }

  const monthly: CalorieMonthSummary[] = [];
  const thisMonth = todayKey.slice(0, 7);
  for (let i = MONTHLY_REPORT_MONTHS - 1; i >= 0; i--) {
    const monthKey = shiftMonthKey(thisMonth, -i);
    const m = monthTotals.get(monthKey) ?? { food: 0, exercise: 0, daysLogged: 0 };
    const net = m.food - m.exercise;
    monthly.push({ monthKey, daysLogged: m.daysLogged, foodCalories: m.food, exerciseCalories: m.exercise, netCalories: net, avgNetPerLoggedDay: m.daysLogged ? Math.round(net / m.daysLogged) : 0 });
  }

  return {
    hasLocalData: entries.length > 0 || library.length > 0 || settings.length > 0,
    overview: {
      dailyCalorieGoal: settings[0]?.dailyCalorieGoal ?? null,
      dayEntries: entries
        .filter((entry) => entry.dayKey === todayKey)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      library: library.sort((a, b) => b.timesLogged - a.timesLogged).slice(0, 300),
      daily,
      weekly,
      monthly,
    },
  };
}

export async function getOfflineCalorieEntriesForDay(day: string): Promise<{
  entries: CalorieEntry[];
  hasLocalData: boolean;
}> {
  const entries = await getOfflineRows<CalorieEntry>("calorieEntries");
  return {
    hasLocalData: entries.length > 0,
    entries: entries
      .filter((entry) => entry.dayKey === day)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
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
