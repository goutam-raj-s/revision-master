import { TrendingUp, Flame, Trophy, CalendarCheck } from "lucide-react";
import { getDashboardStats, getReviewTrendAction, getStreakAction } from "@/actions/analytics";
import { StreakCard } from "@/components/features/streak-card";
import { StatsCards } from "@/components/features/stats-cards";
import { AnalyticsInsights } from "@/components/features/analytics-insights";
import { ReviewTrendChartDynamic as ReviewTrendChart } from "@/components/features/review-trend-chart-dynamic";
import { Card } from "@/components/ui/card";
import { Achievements } from "@/components/features/achievements";
import { ShareStatsButton } from "@/components/features/share-stats-button";

export const metadata = { title: "Your Stats" };

export default async function StatsPage() {
  const [stats, trend, streak] = await Promise.all([
    getDashboardStats(),
    getReviewTrendAction(),
    getStreakAction(),
  ]);

  const weekTotal = trend.reduce((s, d) => s + d.count, 0);
  const summary = [
    { label: "Current streak", value: `${streak.current}d`, icon: Flame, color: "text-state-stale" },
    { label: "Best streak", value: `${streak.best}d`, icon: Trophy, color: "text-state-completed" },
    { label: "Reviews this week", value: weekTotal, icon: CalendarCheck, color: "text-state-today" },
    { label: "Total reviews", value: streak.totalReviews, icon: TrendingUp, color: "text-state-upcoming" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Your Stats</h1>
          <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">Your learning, measured over time.</p>
        </div>
        <ShareStatsButton />
      </div>

      {/* Summary numbers */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <div className="font-mono text-xl font-bold leading-none text-forest-slate tabular-nums">{s.value}</div>
              <div className="mt-1 text-[11px] text-mossy-gray">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <StreakCard data={streak} />

      <Achievements
        totalReviews={streak.totalReviews}
        bestStreak={streak.best}
        totalDocs={stats.totalDocs}
        totalCompleted={stats.totalCompleted}
      />

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-forest-slate">Last 7 days</h2>
          <ReviewTrendChart data={trend} />
        </div>
        <AnalyticsInsights stats={stats} />
      </div>
    </div>
  );
}
