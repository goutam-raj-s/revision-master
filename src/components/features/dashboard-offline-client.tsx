"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getTaskQueue, getTaskQueueStats } from "@/actions/queue";
import { getStreakAction } from "@/actions/analytics";
import { StreakCard } from "@/components/features/streak-card";
import { TaskQueue } from "@/components/features/task-queue";
import { QuickGuideButton } from "@/components/ui/quick-guide-button";
import { getOfflineDashboardView } from "@/lib/offline/read-models";
import type { TaskFilter } from "@/types";
import type { AnyTaskItem } from "@/actions/queue";
import type { StreakData } from "@/lib/streak";

const DASHBOARD_SHORTCUTS = [
  { keys: "Cmd+K", label: "Command palette — search terms, run actions" },
  { keys: "Cmd+/", label: "Also opens command palette" },
  { keys: "?", label: "Show full keyboard shortcuts sheet" },
  { keys: "Today / Pending", label: "Switch task queue filter" },
  { keys: "Theme toggle", label: "Light / Dark / System (sidebar)" },
];

function emptyStreak(): StreakData {
  const heatmap: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 181);
  for (let i = 0; i < 182; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    heatmap.push({ date: `${y}-${m}-${d}`, count: 0 });
  }
  return { current: 0, best: 0, reviewedToday: false, heatmap, totalReviews: 0 };
}

function FilterTabs({ active, pendingCount, showCollectionItems }: { active: TaskFilter; pendingCount: number; showCollectionItems: boolean }) {
  const tabs: { key: TaskFilter; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "pending", label: "Pending" },
    { key: "upcoming", label: "Upcoming" },
    { key: "all", label: "All Items" },
  ];

  return (
    <div className="flex w-full flex-col gap-2 overflow-x-auto custom-scrollbar sm:w-fit sm:flex-row">
      <div className="flex min-w-max items-center gap-1 rounded-xl border border-border bg-surface p-1">
        {tabs.map((tab) => {
          const isPendingTab = tab.key === "pending";
          const hasPending = pendingCount > 0;
          let className = "px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 sm:px-4 sm:py-1.5 sm:text-sm ";

          if (active === tab.key) {
            className += isPendingTab && hasPending
              ? "bg-red-500/10 text-red-600 shadow-soft"
              : "bg-state-today text-white shadow-soft";
          } else {
            className += isPendingTab && hasPending
              ? "text-red-500/80 hover:text-red-600 hover:bg-red-500/5"
              : "text-mossy-gray hover:text-forest-slate hover:bg-canvas";
          }

          const params = new URLSearchParams({ filter: tab.key });
          if (!showCollectionItems) params.set("showCollections", "0");

          return (
            <Link key={tab.key} href={`/dashboard?${params.toString()}`} className={className} aria-current={active === tab.key ? "page" : undefined}>
              {tab.label} {isPendingTab && hasPending ? `(${pendingCount})` : ""}
            </Link>
          );
        })}
      </div>
      <Link
        href={showCollectionItems ? `/dashboard?filter=${active}&showCollections=0` : `/dashboard?filter=${active}`}
        className={`inline-flex min-w-max items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm ${
          !showCollectionItems
            ? "border-state-today bg-state-today/10 text-state-today"
            : "border-border bg-surface text-mossy-gray hover:bg-canvas hover:text-forest-slate"
        }`}
      >
        Hide collection items
      </Link>
    </div>
  );
}

export function DashboardOfflineClient() {
  const searchParams = useSearchParams();
  const filter = ((searchParams.get("filter") as TaskFilter | null) || "today");
  const showCollectionItems = searchParams.get("showCollections") !== "0";
  const [tasks, setTasks] = React.useState<AnyTaskItem[]>([]);
  const [queueStats, setQueueStats] = React.useState({ todayCount: 0, upcomingCount: 0, overdueCount: 0 });
  const [streak, setStreak] = React.useState<StreakData>(() => emptyStreak());
  const [source, setSource] = React.useState<"loading" | "indexeddb" | "server">("loading");

  React.useEffect(() => {
    let cancelled = false;
    window.setTimeout(async () => {
      try {
        const local = await getOfflineDashboardView(filter, showCollectionItems);
        if (!cancelled && local.hasLocalData) {
          setTasks(local.tasks);
          setQueueStats(local.queueStats);
          setStreak(local.streak);
          setSource("indexeddb");
          return;
        }
      } catch {
        // Fall through to backend.
      }

      const [serverTasks, serverStats, serverStreak] = await Promise.all([
        getTaskQueue(filter, { includeCollectionItems: showCollectionItems }),
        getTaskQueueStats({ includeCollectionItems: showCollectionItems }),
        getStreakAction(),
      ]);
      if (!cancelled) {
        setTasks(serverTasks);
        setQueueStats(serverStats);
        setStreak(serverStreak);
        setSource("server");
      }
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [filter, showCollectionItems]);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Dashboard</h1>
          <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">
            Your lightweight task queue for today
            {source === "indexeddb" && <span className="ml-2 text-state-today">from IndexedDB</span>}
            {source === "loading" && <span className="ml-2">checking local data...</span>}
          </p>
        </div>
        <QuickGuideButton shortcuts={DASHBOARD_SHORTCUTS} title="Dashboard" />
      </div>

      <StreakCard data={streak} />

      <div>
        <div className="mb-3 flex flex-col items-start gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2 className="text-sm font-semibold text-forest-slate sm:text-base">Revision Queue</h2>
          <FilterTabs active={filter} pendingCount={queueStats.overdueCount} showCollectionItems={showCollectionItems} />
        </div>
        <TaskQueue initialTasks={tasks} filter={filter} streak={streak.current} />
      </div>
    </div>
  );
}
