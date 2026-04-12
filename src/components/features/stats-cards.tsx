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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="shadow-card hover:shadow-soft transition-shadow duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="font-mono text-3xl font-bold text-forest-slate tabular-nums">
              {card.value}
            </div>
            <div className="mt-1">
              <div className="text-xs font-medium text-forest-slate">{card.label}</div>
              <div className="text-xs text-mossy-gray">{card.description}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
