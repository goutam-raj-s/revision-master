import { Suspense } from "react";
import { Plus, Command } from "lucide-react";
import Link from "next/link";
import { getTaskQueue } from "@/actions/queue";
import { getDashboardStats } from "@/actions/analytics";
import { TaskQueue } from "@/components/features/task-queue";
import { StatsCards } from "@/components/features/stats-cards";
import { AnalyticsInsights } from "@/components/features/analytics-insights";
import { Button } from "@/components/ui/button";
import type { TaskFilter } from "@/types";

interface DashboardPageProps {
  searchParams: Promise<{ filter?: string }>;
}

function FilterTabs({ active, pendingCount }: { active: TaskFilter; pendingCount: number }) {
  const tabs: { key: TaskFilter; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "pending", label: "Pending" },
    { key: "upcoming", label: "Upcoming" },
    { key: "all", label: "All Docs" },
  ];

  return (
    <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
      {tabs.map((tab) => {
        const isPendingTab = tab.key === "pending";
        const hasPending = pendingCount > 0;
        let className = "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ";
        
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

        return (
          <Link
            key={tab.key}
            href={`/dashboard?filter=${tab.key}`}
            className={className}
            aria-current={active === tab.key ? "page" : undefined}
          >
            {tab.label} {isPendingTab && hasPending ? `(${pendingCount})` : ""}
          </Link>
        )
      })}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const filter = (params.filter as TaskFilter) || "today";

  const [tasks, stats] = await Promise.all([
    getTaskQueue(filter),
    getDashboardStats(),
  ]);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forest-slate">Dashboard</h1>
          <p className="text-sm text-mossy-gray mt-0.5">
            Your learning queue for today
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-border text-xs font-mono text-mossy-gray">⌘K</kbd>
          </p>
        </div>
        <Link href="/documents/new">
          <Button className="gap-2 bouncy-hover">
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Task Queue */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-base font-semibold text-forest-slate">Revision Queue</h2>
          <FilterTabs active={filter} pendingCount={stats.pendingRevisions} />
        </div>
        <TaskQueue initialTasks={tasks} filter={filter} />
      </div>

      {/* Analytics */}
      <div>
        <h2 className="text-base font-semibold text-forest-slate mb-4">Learning Insights</h2>
        <AnalyticsInsights stats={stats} />
      </div>
    </div>
  );
}
