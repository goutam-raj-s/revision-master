"use client";

import * as React from "react";
import { Calendar, CheckCircle2, CheckSquare, ChevronDown, ChevronRight } from "lucide-react";
import { cn, formatRelativeDate, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { Difficulty, LightweightTaskQueueItem } from "@/types";

const difficultyVariant: Record<Difficulty, "easy" | "medium" | "hard"> = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
};

const urgencyConfig = {
  overdue: { label: "Overdue", dotClass: "bg-destructive", badgeVariant: "stale" as const },
  today: { label: "Today", dotClass: "bg-state-today", badgeVariant: "today" as const },
  upcoming: { label: "Upcoming", dotClass: "bg-state-upcoming", badgeVariant: "upcoming" as const },
};

interface LightweightTaskRowProps {
  task: LightweightTaskQueueItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReschedule: (taskId: string, days: number) => Promise<void>;
  onComplete: (taskId: string) => Promise<void>;
}

export function LightweightTaskRow({ task, isExpanded, onToggleExpand, onReschedule, onComplete }: LightweightTaskRowProps) {
  const urgency = urgencyConfig[task.urgency];
  const [busy, setBusy] = React.useState(false);

  async function reschedule(days: number) {
    setBusy(true);
    await onReschedule(task.task.id, days);
    setBusy(false);
  }

  async function complete() {
    setBusy(true);
    await onComplete(task.task.id);
    setBusy(false);
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-card task-row-hover transition-all duration-300">
      <div className="flex items-center gap-3 px-4 py-3">
        <SimpleTooltip content={urgency.label}>
          <div className={cn("h-2 w-2 shrink-0 rounded-full cursor-default", urgency.dotClass)} />
        </SimpleTooltip>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-serif text-sm font-medium leading-snug text-forest-slate">
            <CheckSquare className="h-4 w-4 shrink-0 text-state-today" />
            <span className="line-clamp-1">{task.task.title}</span>
          </div>
          {task.task.comments[0] && !isExpanded && (
            <SimpleTooltip content={task.task.comments[0].content} side="bottom">
              <div className="mt-0.5 line-clamp-1 cursor-default text-xs text-mossy-gray">
                {truncate(task.task.comments[0].content, 80)}
              </div>
            </SimpleTooltip>
          )}
        </div>

        {!isExpanded && task.task.tags.length > 0 && (
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {task.task.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="tag" className="text-xs">#{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1 text-xs font-mono text-mossy-gray">
          <Calendar className="h-3 w-3" />
          <span>{task.dueAt ? formatRelativeDate(task.dueAt) : "Unscheduled"}</span>
        </div>

        <SimpleTooltip content="Mark complete">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={complete}
            disabled={busy}
            className="hover:bg-state-today/10 hover:text-state-today"
            aria-label="Mark task complete"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Button>
        </SimpleTooltip>

        <SimpleTooltip content={isExpanded ? "Collapse" : "Show details"}>
          <button
            onClick={onToggleExpand}
            className="shrink-0 rounded-lg p-1 text-mossy-gray transition-colors hover:bg-canvas"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </SimpleTooltip>
      </div>

      {isExpanded && (
        <div className="border-t border-border/50 bg-canvas/30 px-4 pb-4 pt-3 animate-fade-in">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={urgency.badgeVariant}>{urgency.label}</Badge>
            <Badge variant={difficultyVariant[task.task.difficulty]}>{task.task.difficulty}</Badge>
            {task.task.tags.map((tag) => (
              <Badge key={tag} variant="tag">#{tag}</Badge>
            ))}
          </div>

          {task.task.comments.length > 0 && (
            <div className="mb-3 space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-mossy-gray">Comments</div>
              {task.task.comments.slice(0, 3).map((comment) => (
                <div key={comment.id} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-forest-slate">
                  {comment.content}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-mossy-gray">Reschedule:</span>
            {[0, 1, 3, 7, 14].map((days) => (
              <button
                key={days}
                onClick={() => reschedule(days)}
                disabled={busy}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-mossy-gray transition-colors hover:border-state-today/40 hover:text-state-today disabled:opacity-50"
              >
                {days === 0 ? "Today" : `+${days}d`}
              </button>
            ))}
            <div className="flex-1" />
            <Button size="sm" onClick={complete} disabled={busy} className="gap-1.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Complete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
