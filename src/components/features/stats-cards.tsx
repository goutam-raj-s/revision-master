import { BookOpen, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Documents",
      value: stats.totalDocs,
      icon: BookOpen,
      color: "text-state-upcoming",
      bg: "bg-state-upcoming/10",
      description: "in your library",
    },
    {
      label: "Due Today",
      value: stats.pendingRevisions,
      icon: Clock,
      color: "text-state-today",
      bg: "bg-state-today/10",
      description: stats.pendingRevisions === 1 ? "revision pending" : "revisions pending",
    },
    {
      label: "Completed",
      value: stats.totalCompleted,
      icon: CheckCircle2,
      color: "text-state-completed",
      bg: "bg-state-completed/10",
      description: "mastered",
    },
    {
      label: "Active",
      value: stats.totalDocs - stats.totalCompleted,
      icon: TrendingUp,
      color: "text-state-stale",
      bg: "bg-state-stale/10",
      description: "in rotation",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="shadow-card hover:shadow-soft transition-shadow duration-200">
          <CardContent className="p-3 sm:p-5">
            <div className="mb-2 flex items-start justify-between sm:mb-3">
              <div className={`rounded-lg p-1.5 sm:rounded-xl sm:p-2 ${card.bg}`}>
                <card.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${card.color}`} />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold leading-none text-forest-slate tabular-nums sm:text-3xl">
              {card.value}
            </div>
            <div className="mt-1">
              <div className="text-[11px] font-medium leading-tight text-forest-slate sm:text-xs">{card.label}</div>
              <div className="text-[11px] leading-tight text-mossy-gray sm:text-xs">{card.description}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
