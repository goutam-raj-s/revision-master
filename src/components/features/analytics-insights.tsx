import Link from "next/link";
import { TrendingUp, Clock, Tag, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

interface AnalyticsInsightsProps {
  stats: DashboardStats;
}

export function AnalyticsInsights({ stats }: AnalyticsInsightsProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {/* Most Repeated Topics */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-lg bg-state-today/10">
              <TrendingUp className="h-3.5 w-3.5 text-state-today" />
            </div>
            Most Repeated Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.mostRepeatedTopics.length === 0 ? (
            <p className="text-sm text-mossy-gray">Complete some reviews to see insights.</p>
          ) : (
            <ol className="space-y-2">
              {stats.mostRepeatedTopics.map((item, i) => (
                <li key={item.tag} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-mossy-gray w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/documents?tag=${item.tag}`}
                        className="text-sm font-medium text-forest-slate hover:text-state-today transition-colors truncate"
                      >
                        #{item.tag}
                      </Link>
                      <span className="text-xs font-mono text-mossy-gray shrink-0">
                        {item.count} reviews
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1 h-1 rounded-full bg-canvas overflow-hidden">
                      <div
                        className="h-full rounded-full bg-state-today/60 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (item.count / (stats.mostRepeatedTopics[0]?.count || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Least Revised Areas */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-lg bg-state-stale/10">
              <Clock className="h-3.5 w-3.5 text-state-stale" />
            </div>
            Least Revised Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.leastRevisedAreas.length === 0 ? (
            <p className="text-sm text-mossy-gray">Add tagged documents to track coverage.</p>
          ) : (
            <ol className="space-y-2">
              {stats.leastRevisedAreas.map((item, i) => (
                <li key={item.tag} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-mossy-gray w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/documents?tag=${item.tag}`}
                        className="text-sm font-medium text-forest-slate hover:text-state-stale transition-colors truncate"
                      >
                        #{item.tag}
                      </Link>
                      <span className="text-xs font-mono text-mossy-gray shrink-0">
                        {item.daysSinceLastRevision}d ago
                      </span>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-canvas overflow-hidden">
                      <div
                        className="h-full rounded-full bg-state-stale/60 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (item.daysSinceLastRevision / (stats.leastRevisedAreas[0]?.daysSinceLastRevision || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
