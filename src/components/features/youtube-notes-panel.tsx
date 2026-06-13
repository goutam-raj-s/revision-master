"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Check, AlertTriangle, ChevronLeft, ChevronRight, CalendarClock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  updateYoutubeSessionNotes,
  getYoutubeSessionRepetition,
  rescheduleYoutubeAction,
  completeYoutubeReviewAction,
  markYoutubeCompletedAction,
  renameYoutubeSession,
} from "@/actions/youtube";
import { toast } from "@/components/ui/toast";
import { RichTextEditorDynamic } from "@/components/features/editor/RichTextEditorDynamic";
import { ReviewScheduleControls } from "@/components/features/review-schedule-controls";
import type { Repetition } from "@/types";
import type { YoutubePlayerHandle } from "./youtube-player";

interface YoutubeNotesPanelProps {
  sessionId: string;
  initialNotes: string;
  videoTitle: string;
  thumbnailUrl: string;
  playerRef: React.RefObject<YoutubePlayerHandle | null>;
  localStorageKey?: string;
  /** Whether the panel is collapsed (controlled from parent) */
  isCollapsed?: boolean;
  /** Called when the user clicks the collapse/expand chevron */
  onToggleCollapse?: () => void;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function formatTimestamp(seconds: number): string {
  const totalSec = Math.floor(seconds);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `[${m}:${s.toString().padStart(2, "0")}]`;
}

export function YoutubeNotesPanel({
  sessionId,
  initialNotes,
  videoTitle,
  thumbnailUrl,
  playerRef,
  localStorageKey,
  isCollapsed,
  onToggleCollapse,
}: YoutubeNotesPanelProps) {
  const router = useRouter();
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const insertContentRef = React.useRef<((text: string) => void) | null>(null);

  // Review schedule for this video session (skipped for unsaved preview sessions).
  const isPreview = sessionId.startsWith("external-preview-");
  const [rep, setRep] = React.useState<Repetition | null>(null);
  const [showSchedule, setShowSchedule] = React.useState(false);

  React.useEffect(() => {
    if (isPreview) return;
    getYoutubeSessionRepetition(sessionId).then(setRep).catch(() => {});
  }, [sessionId, isPreview]);

  // Inline-editable title (like documents).
  const [displayTitle, setDisplayTitle] = React.useState(videoTitle);
  const [titleEditing, setTitleEditing] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(videoTitle);
  const [savingTitle, setSavingTitle] = React.useState(false);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (titleEditing) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [titleEditing]);

  async function commitTitle() {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === displayTitle) {
      setTitleEditing(false);
      setTitleDraft(displayTitle);
      return;
    }
    setSavingTitle(true);
    const res = await renameYoutubeSession(sessionId, trimmed);
    setSavingTitle(false);
    if (res.success) {
      setDisplayTitle(trimmed);
      setTitleEditing(false);
      toast("Title updated", { variant: "success" });
      router.refresh();
    } else {
      toast(res.error ?? "Failed to rename", { variant: "error" });
    }
  }

  // Listen for global timestamp event (triggered by T key from parent)
  React.useEffect(() => {
    const handler = () => {
      const currentTime = playerRef.current?.getCurrentTime() ?? 0;
      const ts = formatTimestamp(currentTime);
      if (insertContentRef.current) {
        insertContentRef.current(ts);
      }
    };
    window.addEventListener("yt-insert-timestamp", handler);
    return () => window.removeEventListener("yt-insert-timestamp", handler);
  }, [playerRef]);

  const handleInsertTimestamp = () => {
    const currentTime = playerRef.current?.getCurrentTime() ?? 0;
    const ts = formatTimestamp(currentTime);
    insertContentRef.current?.(ts);
  };

  const handleSave = React.useCallback(async (content: string) => {
    setSaveStatus("saving");
    if (localStorageKey) {
      window.localStorage.setItem(localStorageKey, content);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return;
    }
    const result = await updateYoutubeSessionNotes(sessionId, content);
    if (result.success) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("error");
    }
  }, [localStorageKey, sessionId]);

  // Load from localStorage on mount if applicable
  const resolvedInitialNotes = React.useMemo(() => {
    if (typeof window !== "undefined" && localStorageKey) {
      return window.localStorage.getItem(localStorageKey) ?? initialNotes;
    }
    return initialNotes;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showCollapseToggle = onToggleCollapse !== undefined;

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header: thumbnail + title + collapse toggle */}
      <div className="shrink-0 flex items-start gap-3 px-4 py-3 border-b border-border">
        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={videoTitle}
            className="h-12 w-20 object-cover rounded-lg shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          {titleEditing ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitTitle(); }
                if (e.key === "Escape") { setTitleEditing(false); setTitleDraft(displayTitle); }
              }}
              disabled={savingTitle}
              className="w-full bg-transparent border-b-2 border-state-today/50 text-sm font-semibold text-forest-slate leading-snug outline-none focus:border-state-today disabled:opacity-60"
              aria-label="Video title"
            />
          ) : (
            <div className="group/yt-title flex items-start gap-1.5">
              <h2
                onDoubleClick={() => { if (!isPreview) { setTitleDraft(displayTitle); setTitleEditing(true); } }}
                title={isPreview ? undefined : "Double-click to rename"}
                className="text-sm font-semibold text-forest-slate line-clamp-2 leading-snug cursor-text"
              >
                {displayTitle}
              </h2>
              {!isPreview && (
                <button
                  onClick={() => { setTitleDraft(displayTitle); setTitleEditing(true); }}
                  className="mt-0.5 shrink-0 opacity-0 group-hover/yt-title:opacity-100 transition-opacity p-0.5 rounded text-mossy-gray hover:text-forest-slate"
                  aria-label="Rename video"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
          {/* Save indicator */}
          <div className="mt-1 text-xs">
            {saveStatus === "saving" && (
              <span className="text-mossy-gray">Saving…</span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-state-today">
                <Check className="h-3 w-3" />
                Saved ✓
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Save failed — retrying…
              </span>
            )}
          </div>
        </div>
        {showCollapseToggle && (
          <button
            onClick={onToggleCollapse}
            className="shrink-0 p-1.5 rounded-lg text-mossy-gray hover:bg-canvas hover:text-forest-slate transition-colors"
            title={isCollapsed ? "Expand notes" : "Collapse notes"}
            aria-label={isCollapsed ? "Expand notes" : "Collapse notes"}
          >
            {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Timestamp button */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border/50">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleInsertTimestamp}
          className="gap-1.5 text-xs"
        >
          <MapPin className="h-3.5 w-3.5" />
          Timestamp
        </Button>
        <span className="text-xs text-mossy-gray">or press T</span>
        {rep && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowSchedule((s) => !s)}
            className="ml-auto gap-1.5 text-xs"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Review
          </Button>
        )}
      </div>

      {rep && showSchedule && (
        <div className="shrink-0 px-3 py-2 border-b border-border/50">
          <ReviewScheduleControls
            rep={rep}
            onReschedule={async (days) => {
              const res = await rescheduleYoutubeAction(sessionId, days);
              if (res.success) setRep(await getYoutubeSessionRepetition(sessionId));
              return res;
            }}
            onCompleteReview={async () => {
              const res = await completeYoutubeReviewAction(sessionId);
              if (res.success) setRep(await getYoutubeSessionRepetition(sessionId));
              return res;
            }}
            onMarkCompleted={async () => {
              const res = await markYoutubeCompletedAction(sessionId);
              if (res.success) setShowSchedule(false);
              return res;
            }}
          />
        </div>
      )}

      {/* Rich text editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <RichTextEditorDynamic
          initialContent={resolvedInitialNotes}
          onSave={handleSave}
          compact={true}
          insertContentRef={insertContentRef}
        />
      </div>
    </div>
  );
}
