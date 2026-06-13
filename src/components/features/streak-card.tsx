import { Flame, Trophy, CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { StreakData } from "@/lib/streak";

function intensityClass(count: number, max: number): string {
  if (count === 0) return "bg-border/60";
  const ratio = count / Math.max(max, 1);
  if (ratio > 0.66) return "bg-state-today";
  if (ratio > 0.33) return "bg-state-today/70";
  return "bg-state-today/40";
}

/**
 * Dashboard streak + ~6-month activity heatmap. Server component — receives
 * pre-computed StreakData so it adds no client JS.
 */
export function StreakCard({ data }: { data: StreakData }) {
  const max = data.heatmap.reduce((m, d) => Math.max(m, d.count), 0);

  // Group heatmap into weeks (columns) for a GitHub-style grid.
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < data.heatmap.length; i += 7) {
    weeks.push(data.heatmap.slice(i, i + 7));
  }

  return (
    <Card className="shadow-card p-5">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-state-stale/10">
            <Flame className="h-5 w-5 text-state-stale" />
          </div>
          <div>
            <div className="text-xl font-bold leading-none text-forest-slate">{data.current}</div>
            <div className="text-xs text-mossy-gray mt-1">day streak</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-state-completed/10">
            <Trophy className="h-5 w-5 text-state-completed" />
          </div>
          <div>
            <div className="text-xl font-bold leading-none text-forest-slate">{data.best}</div>
            <div className="text-xs text-mossy-gray mt-1">best streak</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-state-today/10">
            <CalendarCheck className="h-5 w-5 text-state-today" />
          </div>
          <div>
            <div className="text-xl font-bold leading-none text-forest-slate">{data.totalReviews}</div>
            <div className="text-xs text-mossy-gray mt-1">total reviews</div>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto custom-scrollbar">
        <div className="flex gap-[3px] min-w-max" aria-hidden="true">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} review${day.count !== 1 ? "s" : ""}`}
                  className={`h-[11px] w-[11px] rounded-[2px] ${intensityClass(day.count, max)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-mossy-gray">
        <span>{data.reviewedToday ? "✓ Reviewed today" : "No reviews yet today"}</span>
        <span>Last 6 months</span>
      </div>
    </Card>
  );
}
