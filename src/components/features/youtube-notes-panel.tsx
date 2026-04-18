"use client";

import * as React from "react";
import { MapPin, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateYoutubeSessionNotes } from "@/actions/youtube";
import type { YoutubePlayerHandle } from "./youtube-player";

interface YoutubeNotesPanelProps {
  sessionId: string;
  initialNotes: string;
  videoTitle: string;
  thumbnailUrl: string;
  playerRef: React.RefObject<YoutubePlayerHandle | null>;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function formatTimestamp(seconds: number): string {
  const totalSec = Math.floor(seconds);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `[${m}:${s.toString().padStart(2, "0")}]`;
}

function parseTimestamp(ts: string): number {
  // ts is like "1:30" or "12:05"
  const parts = ts.split(":");
  if (parts.length !== 2) return 0;
  const m = parseInt(parts[0], 10);
  const s = parseInt(parts[1], 10);
  return m * 60 + s;
}

export function YoutubeNotesPanel({
  sessionId,
  initialNotes,
  videoTitle,
  thumbnailUrl,
  playerRef,
}: YoutubeNotesPanelProps) {
  const [notes, setNotes] = React.useState(initialNotes);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Listen for global timestamp event (triggered by T key from parent)
  React.useEffect(() => {
    const handler = () => insertTimestamp();
    window.addEventListener("yt-insert-timestamp", handler);
    return () => window.removeEventListener("yt-insert-timestamp", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  // Debounced auto-save
  React.useEffect(() => {
    if (notes === initialNotes) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    debounceRef.current = setTimeout(async () => {
      const result = await updateYoutubeSessionNotes(sessionId, notes);
      if (result.success) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    }, 2000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, sessionId]);

  function insertTimestamp() {
    const currentTime = playerRef.current?.getCurrentTime() ?? 0;
    const ts = formatTimestamp(currentTime);
    const textarea = textareaRef.current;
    if (!textarea) {
      setNotes((prev) => prev + ts);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = notes.slice(0, start);
    const after = notes.slice(end);
    const newNotes = before + ts + after;
    setNotes(newNotes);
    // Restore cursor after inserted timestamp
    requestAnimationFrame(() => {
      textarea.selectionStart = start + ts.length;
      textarea.selectionEnd = start + ts.length;
      textarea.focus();
    });
  }

  // Render notes with clickable timestamps
  function renderNotesWithTimestamps(text: string) {
    const parts = text.split(/(\[\d{1,2}:\d{2}\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d{1,2}:\d{2})\]$/);
      if (match) {
        const seconds = parseTimestamp(match[1]);
        return (
          <button
            key={i}
            onClick={() => playerRef.current?.seekTo(seconds)}
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-state-today/10 text-state-today text-xs font-mono hover:bg-state-today/20 transition-colors"
            title={`Seek to ${match[1]}`}
          >
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header: thumbnail + title */}
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
          <h2 className="text-sm font-semibold text-forest-slate line-clamp-2 leading-snug">
            {videoTitle}
          </h2>
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
      </div>

      {/* Timestamp button */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border/50">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertTimestamp}
          className="gap-1.5 text-xs"
        >
          <MapPin className="h-3.5 w-3.5" />
          Timestamp
        </Button>
        <span className="text-xs text-mossy-gray">or press T</span>
      </div>

      {/* Textarea */}
      <div className="flex-1 min-h-0 flex flex-col px-4 pt-3 pb-2 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Take notes here… use the Timestamp button (or press T) to insert [M:SS] markers."
          className="flex-1 resize-none w-full text-sm text-forest-slate bg-transparent focus:outline-none placeholder:text-mossy-gray/50 font-mono leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Rendered notes preview */}
      {notes.trim() && (
        <div className="shrink-0 border-t border-border/50 px-4 py-3 max-h-48 overflow-y-auto">
          <div className="text-xs font-semibold text-mossy-gray uppercase tracking-wide mb-2">
            Preview
          </div>
          <div className="text-sm text-forest-slate leading-relaxed whitespace-pre-wrap break-words">
            {renderNotesWithTimestamps(notes)}
          </div>
        </div>
      )}
    </div>
  );
}
