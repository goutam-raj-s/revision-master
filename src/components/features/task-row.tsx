"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Calendar, CheckCircle2, BookOpen, StickyNote, FileAudio, FileVideo, FileText, ImageIcon, Link as LinkIcon, CirclePlay as Youtube } from "lucide-react";
import { cn, formatRelativeDate, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { TaskItem, YoutubeTaskItem, Difficulty, MediaType } from "@/types";

interface TaskRowProps {
  task: TaskItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReview: (task: TaskItem) => void;
  onReschedule: (docId: string, days: number) => Promise<void>;
  onComplete: (docId: string) => Promise<void>;
}

const difficultyVariant: Record<Difficulty, "easy" | "medium" | "hard"> = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
};

const urgencyConfig = {
  overdue: { label: "Overdue", dotClass: "bg-destructive", badgeVariant: "stale" as const },
  today:   { label: "Today",   dotClass: "bg-state-today", badgeVariant: "today" as const },
  upcoming:{ label: "Upcoming",dotClass: "bg-state-upcoming", badgeVariant: "upcoming" as const },
};

interface YoutubeTaskRowProps {
  task: YoutubeTaskItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function YoutubeTaskRow({ task, isExpanded, onToggleExpand }: YoutubeTaskRowProps) {
  const urgency = urgencyConfig[task.urgency];
  return (
    <div
      className={cn(
        "group rounded-2xl border border-border bg-surface shadow-card task-row-hover overflow-hidden",
        "transition-all duration-300"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <SimpleTooltip content={urgency.label}>
            <div className={cn("h-2 w-2 rounded-full shrink-0 cursor-default", urgency.dotClass)} />
          </SimpleTooltip>
        </div>

        <Link
          href={`/study/youtube?v=${task.session.videoId}`}
          className="flex-1 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/50 rounded-lg p-1 -m-1"
          aria-label={`Study ${task.session.videoTitle}`}
        >
          <div className="flex items-center gap-1.5 font-serif font-medium text-forest-slate text-sm leading-snug hover:text-state-today transition-colors">
            <Youtube className="h-4 w-4 text-destructive shrink-0" />
            <span className="line-clamp-1">{task.session.videoTitle}</span>
          </div>
        </Link>

        {!isExpanded && task.session.tags.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {task.session.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="tag" className="text-xs">#{tag}</Badge>
            ))}
          </div>
        )}

        <div className="shrink-0 flex items-center gap-1 text-xs font-mono text-mossy-gray">
          <Calendar className="h-3 w-3" />
          <span>{formatRelativeDate(task.repetition.nextReviewDate)}</span>
        </div>

        <SimpleTooltip content={isExpanded ? "Collapse" : "Show details"}>
          <button
            onClick={onToggleExpand}
            className="shrink-0 p-1 rounded-lg hover:bg-canvas text-mossy-gray transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </SimpleTooltip>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border/50 bg-canvas/30 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant={urgency.badgeVariant}>{urgency.label}</Badge>
            <Badge variant={difficultyVariant[task.session.difficulty]}>
              {task.session.difficulty}
            </Badge>
            <Badge variant="outline">#{task.repetition.reviewCount} reviews</Badge>
            {task.session.tags.map((tag) => (
              <Badge key={tag} variant="tag">#{tag}</Badge>
            ))}
          </div>
          <div className="flex justify-end">
            <Link href={`/study/youtube?v=${task.session.videoId}`} tabIndex={-1}>
              <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                <Youtube className="h-3.5 w-3.5 text-destructive" />
                Open Session
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaIcon({ mediaType }: { mediaType?: MediaType }) {
  switch (mediaType) {
    case "audio":
      return <FileAudio className="h-4 w-4 text-mossy-gray shrink-0" />;
    case "video":
      return <FileVideo className="h-4 w-4 text-mossy-gray shrink-0" />;
    case "pdf":
    case "document":
      return <FileText className="h-4 w-4 text-mossy-gray shrink-0" />;
    case "image":
      return <ImageIcon className="h-4 w-4 text-mossy-gray shrink-0" />;
    default:
      return <LinkIcon className="h-4 w-4 text-mossy-gray shrink-0" />;
  }
}

export function TaskRow({
  task,
  isExpanded,
  onToggleExpand,
  onReview,
  onReschedule,
  onComplete,
}: TaskRowProps) {
  const [rescheduling, setRescheduling] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const [sweeping, setSweeping] = React.useState(false);
  const urgency = urgencyConfig[task.urgency];

  async function handleReschedule(days: number) {
    setRescheduling(true);
    await onReschedule(task.doc.id, days);
    setRescheduling(false);
  }

  async function handleComplete() {
    setCompleting(true);
    setSweeping(true);
    await onComplete(task.doc.id);
  }

  return (
    <div
      className={cn(
        "group rounded-2xl border border-border bg-surface shadow-card task-row-hover overflow-hidden",
        "transition-all duration-300",
        sweeping && "animate-sweep-out"
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Urgency indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <SimpleTooltip content={urgency.label}>
            <div className={cn("h-2 w-2 rounded-full shrink-0 cursor-default", urgency.dotClass)} />
          </SimpleTooltip>
        </div>

        {/* Title + meta */}
        <Link
          href={`/documents/${task.doc.id}`}
          className="flex-1 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/50 rounded-lg p-1 -m-1"
          aria-label={`Open ${task.doc.title}`}
        >
          <div className="flex items-center gap-1.5 font-serif font-medium text-forest-slate text-sm leading-snug hover:text-state-today transition-colors">
            <MediaIcon mediaType={task.doc.mediaType} />
            <span className="line-clamp-1">{task.doc.title}</span>
          </div>
          {task.notes[0] && !isExpanded && (
            <SimpleTooltip content={task.notes[0].content} side="bottom">
              <div className="text-xs text-mossy-gray mt-0.5 line-clamp-1 cursor-default">
                {truncate(task.notes[0].content, 80)}
              </div>
            </SimpleTooltip>
          )}
        </Link>

        {/* Tags (collapsed view) */}
        {!isExpanded && task.doc.tags.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {task.doc.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="tag" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {task.doc.tags.length > 2 && (
              <SimpleTooltip content={task.doc.tags.slice(2).map(t => `#${t}`).join(", ")}>
                <span className="text-xs text-mossy-gray cursor-default">+{task.doc.tags.length - 2}</span>
              </SimpleTooltip>
            )}
          </div>
        )}

        {/* Next review date */}
        <div className="shrink-0 flex items-center gap-1 text-xs font-mono text-mossy-gray">
          <Calendar className="h-3 w-3" />
          <span>{formatRelativeDate(task.repetition.nextReviewDate)}</span>
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <SimpleTooltip content="Quick notes">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => { e.preventDefault(); onReview(task); }}
              aria-label="Quick notes"
            >
              <StickyNote className="h-3.5 w-3.5 text-mossy-gray hover:text-forest-slate" />
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="Mark complete [E]">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => { e.preventDefault(); handleComplete(); }}
              disabled={completing}
              className="hover:text-state-today hover:bg-state-today/10"
              aria-label="Mark as complete"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          </SimpleTooltip>
        </div>

        {/* Expand toggle */}
        <SimpleTooltip content={isExpanded ? "Collapse" : "Show details"}>
          <button
            onClick={onToggleExpand}
            className="shrink-0 p-1 rounded-lg hover:bg-canvas text-mossy-gray transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </SimpleTooltip>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border/50 bg-canvas/30 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant={urgency.badgeVariant}>{urgency.label}</Badge>
            <Badge variant={difficultyVariant[task.doc.difficulty]}>
              {task.doc.difficulty}
            </Badge>
            <Badge variant="outline">
              #{task.repetition.reviewCount} reviews
            </Badge>
            {task.doc.tags.map((tag) => (
              <Badge key={tag} variant="tag">#{tag}</Badge>
            ))}
          </div>

          {/* Notes preview */}
          {task.notes.length > 0 && (
            <div className="mb-3 space-y-1.5">
              <div className="text-xs font-semibold text-mossy-gray uppercase tracking-wide">Notes</div>
              {task.notes.map((note) => (
                <div key={note.id} className="text-sm text-forest-slate bg-surface rounded-xl px-3 py-2 border border-border">
                  {note.content}
                </div>
              ))}
            </div>
          )}

          {/* Quick reschedule buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-mossy-gray font-medium">Reschedule:</span>
            {[1, 3, 7, 14].map((days) => (
              <button
                key={days}
                onClick={() => handleReschedule(days)}
                disabled={rescheduling}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-surface text-mossy-gray hover:border-state-today/40 hover:text-state-today transition-colors disabled:opacity-50"
              >
                +{days}d
              </button>
            ))}
            <div className="flex-1" />
            <Link href={`/documents/${task.doc.id}`} tabIndex={-1}>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Open Page
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => handleComplete()}
              disabled={completing}
              className="text-xs gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Complete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
