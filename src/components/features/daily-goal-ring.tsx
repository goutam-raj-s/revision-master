"use client";

import * as React from "react";
import { Minus, Plus, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

const TARGET_KEY = "lostbae-daily-goal";
const DEFAULT_TARGET = 5;

/** Daily review goal with a progress ring. Target is user-configurable (local). */
export function DailyGoalRing({ done }: { done: number }) {
  const [target, setTarget] = React.useState(DEFAULT_TARGET);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const stored = Number(localStorage.getItem(TARGET_KEY));
    if (stored >= 1) setTarget(stored);
    setMounted(true);
  }, []);

  function update(next: number) {
    const clamped = Math.max(1, Math.min(100, next));
    setTarget(clamped);
    localStorage.setItem(TARGET_KEY, String(clamped));
  }

  const pct = Math.min(1, done / target);
  const reached = done >= target;
  const r = 30;
  const circumference = 2 * Math.PI * r;

  return (
    <Card className="flex items-center gap-4 p-4 shadow-card">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-border)" strokeWidth="7" />
          <circle
            cx="40" cy="40" r={r} fill="none"
            stroke={reached ? "var(--color-state-today)" : "var(--color-state-upcoming)"}
            strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? circumference * (1 - pct) : circumference}
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-bold leading-none text-forest-slate">{done}</span>
          <span className="text-[10px] text-mossy-gray">/ {target}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-state-today">
          <Target className="h-3.5 w-3.5" /> Daily goal
        </div>
        <p className="mt-1 text-sm text-forest-slate">
          {reached
            ? "🎉 Goal reached — nice work!"
            : `${target - done} more review${target - done !== 1 ? "s" : ""} to hit today's goal`}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-mossy-gray">Target</span>
          <div className="flex items-center gap-1 rounded-lg border border-border">
            <button onClick={() => update(target - 1)} className="px-1.5 py-0.5 text-mossy-gray hover:text-forest-slate" aria-label="Lower target">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-5 text-center font-mono text-sm text-forest-slate">{target}</span>
            <button onClick={() => update(target + 1)} className="px-1.5 py-0.5 text-mossy-gray hover:text-forest-slate" aria-label="Raise target">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
