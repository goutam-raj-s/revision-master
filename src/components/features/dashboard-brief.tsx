import Link from "next/link";
import { Target, ArrowRight, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DashboardBriefProps {
  next?: { title: string; href: string } | null;
  dueCount: number;
  weakestTags: { tag: string; daysSinceLastRevision: number }[];
}

/** "Today's focus" + weakest-tags brief, derived from existing queue/analytics data. */
export function DashboardBrief({ next, dueCount, weakestTags }: DashboardBriefProps) {
  if (!next && weakestTags.length === 0) return null;

  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
      {/* Today's focus */}
      <Card className="flex flex-col justify-between p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-state-today">
            <Target className="h-3.5 w-3.5" /> Today&apos;s focus
          </div>
          {next ? (
            <>
              <p className="mt-2 text-sm text-mossy-gray">
                {dueCount > 0
                  ? `You have ${dueCount} review${dueCount !== 1 ? "s" : ""} waiting. Start with:`
                  : "Next up in your queue:"}
              </p>
              <p className="mt-1 line-clamp-2 text-base font-semibold text-forest-slate">{next.title}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-mossy-gray">Nothing due right now — you&apos;re all caught up.</p>
          )}
        </div>
        {next && (
          <Link
            href={next.href}
            className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-state-today px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            Start reviewing <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </Card>

      {/* Weakest tags */}
      <Card className="p-5 shadow-card">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-state-stale">
          <AlertTriangle className="h-3.5 w-3.5" /> Needs attention
        </div>
        {weakestTags.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {weakestTags.slice(0, 4).map((t) => (
              <li key={t.tag}>
                <Link
                  href={`/documents?tag=${encodeURIComponent(t.tag)}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-canvas"
                >
                  <span className="truncate font-medium text-forest-slate">#{t.tag}</span>
                  <span className="shrink-0 text-xs text-mossy-gray">
                    {Math.round(t.daysSinceLastRevision)}d since review
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-mossy-gray">Tag your documents to see your weakest areas here.</p>
        )}
      </Card>
    </div>
  );
}
