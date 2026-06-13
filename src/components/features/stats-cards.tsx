"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Clock, CheckCircle2, TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

/** Animates a number from 0 → value with an ease-out curve. */
function useCountUp(value: number, duration = 800): number {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

function StatCard({
  label,
  value,
  description,
  href,
  icon: Icon,
  color,
  bg,
  pulse,
  delay,
}: {
  label: string;
  value: number;
  description: string;
  href: string;
  icon: typeof BookOpen;
  color: string;
  bg: string;
  pulse?: boolean;
  delay: number;
}) {
  const display = useCountUp(value);

  return (
    <Link href={href} className="group block focus-visible:outline-none">
      <Card
        className="relative overflow-hidden shadow-card transition-all duration-300 animate-slide-up hover:-translate-y-1 hover:shadow-hover group-focus-visible:ring-2 group-focus-visible:ring-state-today/50"
        style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
      >
        <CardContent className="p-3 sm:p-5">
          <div className="mb-2 flex items-start justify-between sm:mb-3">
            <div className={cn("relative rounded-lg p-1.5 transition-transform duration-300 group-hover:scale-110 sm:rounded-xl sm:p-2", bg)}>
              <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", color)} />
              {pulse && (
                <span className={cn("absolute inset-0 rounded-lg sm:rounded-xl", bg, "animate-ping opacity-60")} />
              )}
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-mossy-gray/0 transition-colors duration-200 group-hover:text-mossy-gray" />
          </div>
          <div className="font-mono text-2xl font-bold leading-none text-forest-slate tabular-nums sm:text-3xl">
            {display}
          </div>
          <div className="mt-1">
            <div className="text-[11px] font-medium leading-tight text-forest-slate sm:text-xs">{label}</div>
            <div className="text-[11px] leading-tight text-mossy-gray sm:text-xs">{description}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  const active = stats.totalDocs - stats.totalCompleted;
  const cards = [
    {
      label: "Total Documents",
      value: stats.totalDocs,
      icon: BookOpen,
      color: "text-state-upcoming",
      bg: "bg-state-upcoming/10",
      description: "in your library",
      href: "/documents",
    },
    {
      label: "Due Today",
      value: stats.pendingRevisions,
      icon: Clock,
      color: "text-state-today",
      bg: "bg-state-today/10",
      description: stats.pendingRevisions === 1 ? "revision pending" : "revisions pending",
      href: "/dashboard?filter=pending",
      pulse: stats.pendingRevisions > 0,
    },
    {
      label: "Completed",
      value: stats.totalCompleted,
      icon: CheckCircle2,
      color: "text-state-completed",
      bg: "bg-state-completed/10",
      description: "mastered",
      href: "/documents?status=completed",
    },
    {
      label: "Active",
      value: active,
      icon: TrendingUp,
      color: "text-state-stale",
      bg: "bg-state-stale/10",
      description: "in rotation",
      href: "/documents",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} delay={i * 80} />
      ))}
    </div>
  );
}
