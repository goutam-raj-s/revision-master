import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getTaskQueue, getTaskQueueStats } from "@/actions/queue";
import { getStreakAction } from "@/actions/analytics";
import { StreakCard } from "@/components/features/streak-card";
import { TaskQueue } from "@/components/features/task-queue";
import { QuickGuideButton } from "@/components/ui/quick-guide-button";
import type { TaskFilter } from "@/types";

const DASHBOARD_SHORTCUTS = [
  { keys: "Cmd+K", label: "Command palette — search terms, run actions" },
  { keys: "Cmd+/", label: "Also opens command palette" },
  { keys: "?", label: "Show full keyboard shortcuts sheet" },
  { keys: "Today / Pending", label: "Switch task queue filter" },
  { keys: "Theme toggle", label: "Light / Dark / System (sidebar)" },
];

interface DashboardPageProps {
  searchParams: Promise<{ filter?: string; showCollections?: string }>;
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
            if (isPendingTab && hasPending) {
              className += "bg-red-500/10 text-red-600 shadow-soft";
            } else {
              className += "bg-state-today text-white shadow-soft";
            }
          } else {
            if (isPendingTab && hasPending) {
              className += "text-red-500/80 hover:text-red-600 hover:bg-red-500/5";
            } else {
              className += "text-mossy-gray hover:text-forest-slate hover:bg-canvas";
            }
          }

          const params = new URLSearchParams({ filter: tab.key });
          if (showCollectionItems) params.set("showCollections", "1");

          return (
            <Link
              key={tab.key}
              href={`/dashboard?${params.toString()}`}
              className={className}
              aria-current={active === tab.key ? "page" : undefined}
            >
              {tab.label} {isPendingTab && hasPending ? `(${pendingCount})` : ""}
            </Link>
          );
        })}
      </div>
      <Link
        href={showCollectionItems ? `/dashboard?filter=${active}` : `/dashboard?filter=${active}&showCollections=1`}
        className={`inline-flex min-w-max items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm ${
          showCollectionItems
            ? "border-state-today bg-state-today/10 text-state-today"
            : "border-border bg-surface text-mossy-gray hover:bg-canvas hover:text-forest-slate"
        }`}
      >
        Collection items
      </Link>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Verify the session ONCE, up front. If it's missing/invalid, redirect to
  // login immediately — before running any data queries. (Avoids firing the
  // queue/stats reads, and the noisy UNAUTHORIZED throws, for unauthed requests.)
  const user = await getSession();
  if (!user) redirect("/login");

  const params = await searchParams;
  const filter = (params.filter as TaskFilter) || "today";
  const showCollectionItems = params.showCollections === "1";

  const [tasks, queueStats, streak] = await Promise.all([
    getTaskQueue(filter, { includeCollectionItems: showCollectionItems }),
    getTaskQueueStats({ includeCollectionItems: showCollectionItems }),
    getStreakAction(),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Dashboard</h1>
          <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">
            Your lightweight task queue for today
            <kbd className="ml-2 hidden rounded bg-border px-1.5 py-0.5 font-mono text-xs text-mossy-gray sm:inline">⌘K</kbd>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuickGuideButton shortcuts={DASHBOARD_SHORTCUTS} title="Dashboard" />
        </div>
      </div>

      {/* Streak + activity heatmap */}
      <StreakCard data={streak} />

      {/* Task Queue */}
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
