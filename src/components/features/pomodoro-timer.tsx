"use client";

import * as React from "react";
import { Timer, Play, Pause, RotateCcw, X, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUS_MIN = 25;
const BREAK_MIN = 5;

type Phase = "focus" | "break";

/** Floating Pomodoro focus timer. Persists across navigation in this tab. */
export function PomodoroTimer() {
  const [open, setOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("focus");
  const [secondsLeft, setSecondsLeft] = React.useState(FOCUS_MIN * 60);
  const [running, setRunning] = React.useState(false);
  const [cycles, setCycles] = React.useState(0);

  const total = (phase === "focus" ? FOCUS_MIN : BREAK_MIN) * 60;

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // phase complete
          const nextPhase: Phase = phase === "focus" ? "break" : "focus";
          if (phase === "focus") setCycles((c) => c + 1);
          setPhase(nextPhase);
          // Nudge the user.
          try {
            new Audio(
              "data:audio/wav;base64,UklGRhwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
            ).play().catch(() => {});
          } catch {}
          return (nextPhase === "focus" ? FOCUS_MIN : BREAK_MIN) * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase]);

  function reset() {
    setRunning(false);
    setPhase("focus");
    setSecondsLeft(FOCUS_MIN * 60);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const progress = 1 - secondsLeft / total;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Focus timer"
        className="fixed bottom-6 left-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-mossy-gray shadow-soft transition-all hover:scale-105 hover:text-forest-slate"
        aria-label="Open focus timer"
      >
        <Timer className="h-5 w-5" />
        {running && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-state-today animate-pulse" />}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 w-56 rounded-2xl border border-border bg-surface p-4 shadow-glass">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-forest-slate">
          {phase === "focus" ? <Timer className="h-4 w-4 text-state-today" /> : <Coffee className="h-4 w-4 text-state-upcoming" />}
          {phase === "focus" ? "Focus" : "Break"}
        </div>
        <button onClick={() => setOpen(false)} className="text-mossy-gray hover:text-forest-slate" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Ring */}
      <div className="relative mx-auto my-2 h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-border)" strokeWidth="7" />
          <circle
            cx="50" cy="50" r="44" fill="none"
            stroke={phase === "focus" ? "var(--color-state-today)" : "var(--color-state-upcoming)"}
            strokeWidth="7" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - progress)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold tabular-nums text-forest-slate">{mm}:{ss}</span>
          <span className="text-[10px] text-mossy-gray">{cycles} done</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className={cn(
            "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-white transition-colors",
            phase === "focus" ? "bg-state-today hover:bg-state-today/90" : "bg-state-upcoming hover:bg-state-upcoming/90"
          )}
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-mossy-gray hover:text-forest-slate"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
