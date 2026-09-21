"use client";

import * as React from "react";
import { CalendarCheck, Flame, TrendingUp, Trophy } from "lucide-react";
import { getRecentActivityAction, getReviewTrendAction, getStreakAction } from "@/actions/analytics";
import { ActivityFeed } from "@/components/features/activity-feed";
import { ReviewTrendChartDynamic as ReviewTrendChart } from "@/components/features/review-trend-chart-dynamic";
import { ShareStatsButton } from "@/components/features/share-stats-button";
import { StreakCard } from "@/components/features/streak-card";
import { Card } from "@/components/ui/card";
import { getOfflineStatsView, type OfflineActivityItem } from "@/lib/offline/read-models";
import type { StreakData } from "@/lib/streak";

function emptyStreak(): StreakData {
  const heatmap: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 181);
  for (let i = 0; i < 182; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    heatmap.push({ date: date.toISOString().slice(0, 10), count: 0 });
  }
  return { current: 0, best: 0, reviewedToday: false, heatmap, totalReviews: 0 };
}

export function StatsOfflinePage() {
  const [trend, setTrend] = React.useState<{ day: string; count: number }[]>([]);
  const [streak, setStreak] = React.useState<StreakData>(() => emptyStreak());
  const [activity, setActivity] = React.useState<OfflineActivityItem[]>([]);
  const [source, setSource] = React.useState<"loading" | "indexeddb" | "server">("loading");

  React.useEffect(() => {
    let cancelled = false;
    window.setTimeout(async () => {
      try {
        const local = await getOfflineStatsView();
        if (!cancelled && local.hasLocalData) {
          setTrend(local.trend);
          setStreak(local.streak);
          setActivity(local.activity);
          setSource("indexeddb");
          return;
        }
      } catch {
        // Fall through to backend.
      }

      const [serverTrend, serverStreak, serverActivity] = await Promise.all([
        getReviewTrendAction(),
        getStreakAction(),
        getRecentActivityAction(),
      ]);
      if (!cancelled) {
        setTrend(serverTrend);
        setStreak(serverStreak);
        setActivity(serverActivity);
        setSource("server");
      }
    }, 0);

    return () => {
      cancelled = true;
    };
  }, []);

  const weekTotal = trend.reduce((sum, day) => sum + day.count, 0);
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
          <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">
            Your learning, measured over time.
            {source === "indexeddb" && <span className="ml-2 text-state-today">from IndexedDB</span>}
            {source === "loading" && <span className="ml-2">checking local data...</span>}
          </p>
        </div>
        <ShareStatsButton />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-4 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas">
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <div className="font-mono text-xl font-bold leading-none text-forest-slate tabular-nums">{item.value}</div>
              <div className="mt-1 text-[11px] text-mossy-gray">{item.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <StreakCard data={streak} />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-forest-slate">Last 7 days</h2>
        <ReviewTrendChart data={trend} />
      </div>

      <ActivityFeed items={activity} />
    </div>
  );
}
