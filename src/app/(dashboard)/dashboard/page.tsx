import { Plus } from "lucide-react";
import Link from "next/link";
import { getTaskQueue } from "@/actions/queue";
import { getDashboardStats, getReviewTrendAction, getStreakAction } from "@/actions/analytics";
import { StreakCard } from "@/components/features/streak-card";
import { TaskQueue } from "@/components/features/task-queue";
import { StatsCards } from "@/components/features/stats-cards";
import { AnalyticsInsights } from "@/components/features/analytics-insights";
import { OnboardingBanner } from "@/components/features/onboarding-banner";
import { GoogleAutoSync } from "@/components/features/google-auto-sync";
import { ReviewTrendChartDynamic as ReviewTrendChart } from "@/components/features/review-trend-chart-dynamic";
import { Button } from "@/components/ui/button";
import { QuickGuideButton } from "@/components/ui/quick-guide-button";
import type { TaskFilter } from "@/types";

const DASHBOARD_SHORTCUTS = [
  { keys: "Cmd+K", label: "Command palette — search docs/terms, run actions" },
  { keys: "Cmd+/", label: "Also opens command palette" },
  { keys: "?", label: "Show full keyboard shortcuts sheet" },
  { keys: "Cmd+Shift+K", label: "Quick clipper widget" },
  { keys: "E", label: "Complete focused task (row expanded)" },
  { keys: "Escape", label: "Close review modal / clear focus" },
  { keys: "Today / Pending", label: "Switch revision queue filter" },
  { keys: "Theme toggle", label: "Light / Dark / System (sidebar)" },
  { keys: "Cmd+Shift+V", label: "Clipboard history (last 10 copies)" },
];

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
    <div className="w-full overflow-x-auto custom-scrollbar sm:w-fit">
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

          return (
            <Link
              key={tab.key}
              href={`/dashboard?filter=${tab.key}`}
              className={className}
              aria-current={active === tab.key ? "page" : undefined}
            >
              {tab.label} {isPendingTab && hasPending ? `(${pendingCount})` : ""}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const filter = (params.filter as TaskFilter) || "today";

  const [tasks, stats, trend, streak] = await Promise.all([
    getTaskQueue(filter),
    getDashboardStats(),
    getReviewTrendAction(),
    getStreakAction(),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Dashboard</h1>
          <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">
            Your learning queue for today
            <kbd className="ml-2 hidden rounded bg-border px-1.5 py-0.5 font-mono text-xs text-mossy-gray sm:inline">⌘K</kbd>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuickGuideButton shortcuts={DASHBOARD_SHORTCUTS} title="Dashboard" />
          <Link href="/documents/new" prefetch={true}>
            <Button className="h-8 gap-1.5 px-3 text-xs bouncy-hover sm:h-9 sm:gap-2 sm:px-4 sm:text-sm" aria-label="Add document">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Document</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Hourly background re-sync of imported Google Docs */}
      <GoogleAutoSync />

      {/* Onboarding — only for new users with 0 docs */}
      <OnboardingBanner totalDocs={stats.totalDocs} />

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Streak + activity heatmap */}
      <StreakCard data={streak} />

      {/* Task Queue */}
      <div>
        <div className="mb-3 flex flex-col items-start gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2 className="text-sm font-semibold text-forest-slate sm:text-base">Revision Queue</h2>
          <FilterTabs active={filter} pendingCount={stats.pendingRevisions} />
        </div>
        <TaskQueue initialTasks={tasks} filter={filter} streak={streak.current} />
      </div>

      {/* Analytics */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-forest-slate sm:mb-4 sm:text-base">Learning Insights</h2>
        <AnalyticsInsights stats={stats} />
        <div className="mt-3 rounded-xl border border-border bg-surface p-3 sm:mt-4 sm:p-4">
          <p className="text-xs font-medium text-mossy-gray mb-2">Reviews this week</p>
          <ReviewTrendChart data={trend} />
        </div>
      </div>
    </div>
  );
}
