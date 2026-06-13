"use client";

import * as React from "react";
import { CalendarClock, Check, Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface ReviewScheduleData {
  nextReviewDate: string;
  intervalDays: number;
  reviewCount: number;
}

interface ReviewScheduleControlsProps {
  rep: ReviewScheduleData | null;
  /** Reschedule next review to +days from now. */
  onReschedule: (days: number) => Promise<{ success: boolean; error?: string }>;
  /** Mark this item permanently completed (removed from queue). */
  onMarkCompleted: () => Promise<{ success: boolean; error?: string }>;
  /** Optional: advance the SRS schedule (a completed review). */
  onCompleteReview?: () => Promise<{ success: boolean; error?: string }>;
  /** Layout variant — "card" (default) or "compact" for sidebars. */
  variant?: "card" | "compact";
  className?: string;
}

const DAY_PRESETS = [1, 2, 3, 5, 7, 14, 21, 30];

function formatNext(dateStr: string): { label: string; tone: "overdue" | "today" | "upcoming" } {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const tone = d < today ? "overdue" : d <= end ? "today" : "upcoming";
  return { label: d.toLocaleDateString(), tone };
}

/** Unified review-schedule UI (next review + reschedule + mark complete),
 *  shared by documents and YouTube/video across the app. */
export function ReviewScheduleControls({
  rep,
  onReschedule,
  onMarkCompleted,
  onCompleteReview,
  variant = "card",
  className,
}: ReviewScheduleControlsProps) {
  const [days, setDays] = React.useState(7);
  const [busy, setBusy] = React.useState<"reschedule" | "complete" | "review" | null>(null);

  if (!rep) {
    return (
      <div className={cn("rounded-2xl border border-border bg-surface p-4 text-sm text-mossy-gray shadow-card", className)}>
        Not scheduled for review.
      </div>
    );
  }

  const next = formatNext(rep.nextReviewDate);
  const toneClass =
    next.tone === "overdue"
      ? "text-state-stale"
      : next.tone === "today"
        ? "text-state-today"
        : "text-state-upcoming";

  async function run(
    kind: "reschedule" | "complete" | "review",
    fn: () => Promise<{ success: boolean; error?: string }>,
    okMsg: string
  ) {
    setBusy(kind);
    const res = await fn();
    setBusy(null);
    if (res.success) toast(okMsg, { variant: "success" });
    else toast(res.error ?? "Something went wrong", { variant: "error" });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 shadow-card space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide text-mossy-gray">Review schedule</Label>
        <span className={cn("font-mono text-xs font-medium", toneClass)}>{next.label}</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-mossy-gray">
        <span>Interval <span className="font-mono text-forest-slate">{rep.intervalDays}d</span></span>
        <span>Reviews <span className="font-mono text-forest-slate">{rep.reviewCount}</span></span>
      </div>

      {/* Reschedule */}
      <div className="flex items-center gap-2">
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="h-8 flex-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAY_PRESETS.map((d) => (
              <SelectItem key={d} value={String(d)}>+{d} days</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          disabled={busy !== null}
          onClick={() => run("reschedule", () => onReschedule(days), `Rescheduled +${days} days`)}
        >
          {busy === "reschedule" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />}
          Reschedule
        </Button>
      </div>

      {/* Complete actions */}
      <div className="flex items-center gap-2">
        {onCompleteReview && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-1 gap-1.5"
            disabled={busy !== null}
            onClick={() => run("review", onCompleteReview, "Review logged — next interval scheduled")}
          >
            {busy === "review" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Reviewed
          </Button>
        )}
        <Button
          size="sm"
          className="h-8 flex-1 gap-1.5"
          disabled={busy !== null}
          onClick={() => run("complete", onMarkCompleted, "Marked completed")}
        >
          {busy === "complete" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
          Mark complete
        </Button>
      </div>
    </div>
  );
}
