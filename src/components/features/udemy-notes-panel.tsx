"use client";

import * as React from "react";
import { Clock, Check, AlertTriangle, ExternalLink, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUdemySessionNotes, updateUdemySessionTitle } from "@/actions/udemy";

interface UdemyNotesPanelProps {
  sessionId: string;
  initialNotes: string;
  courseTitle: string;
  courseUrl: string;
  lectureId?: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Parse a typed timestamp like "1:30" or "01:30:00" to a human-readable string. */
function normaliseTimestamp(raw: string): string | null {
  // Accept H:MM:SS or M:SS
  const parts = raw.replace(/\s/g, "").split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (isNaN(m) || isNaN(s)) return null;
    return `[${m}:${s.toString().padStart(2, "0")}]`;
  }
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parseInt(parts[2], 10);
    if (isNaN(h) || isNaN(m) || isNaN(s)) return null;
    return `[${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}]`;
  }
  return null;
}

export function UdemyNotesPanel({
  sessionId,
  initialNotes,
  courseTitle: initialTitle,
  courseUrl,
  lectureId,
}: UdemyNotesPanelProps) {
  const [notes, setNotes] = React.useState(initialNotes);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Manual timestamp input state
  const [tsInput, setTsInput] = React.useState("");
  const [tsError, setTsError] = React.useState("");

  // Inline title editing
  const [courseTitle, setCourseTitle] = React.useState(initialTitle);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(initialTitle);
  const titleDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-save for notes
  React.useEffect(() => {
    if (notes === initialNotes) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    debounceRef.current = setTimeout(async () => {
      const result = await updateUdemySessionNotes(sessionId, notes);
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
    const ts = normaliseTimestamp(tsInput);
    if (!ts) {
      setTsError("Format: 1:30 or 1:30:45");
      return;
    }
    setTsError("");
    setTsInput("");

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
    requestAnimationFrame(() => {
      textarea.selectionStart = start + ts.length;
      textarea.selectionEnd = start + ts.length;
      textarea.focus();
    });
  }

  function handleTsKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      insertTimestamp();
    }
  }

  function commitTitleEdit() {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === courseTitle) {
      setEditingTitle(false);
      setTitleDraft(courseTitle);
      return;
    }
    setCourseTitle(trimmed);
    setEditingTitle(false);
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      updateUdemySessionTitle(sessionId, trimmed);
    }, 500);
  }

  const lectureUrl = lectureId
    ? `${courseUrl}learn/lecture/${lectureId}/`
    : courseUrl;

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Centred content wrapper for readability at full-width */}
      <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="shrink-0 flex items-start gap-3 px-4 py-3 border-b border-border">
        <div className="h-10 w-10 rounded-xl bg-state-today/10 flex items-center justify-center shrink-0">
          <span className="text-lg">🎓</span>
        </div>
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex items-center gap-1.5">
              <Input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitleEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitleEdit();
                  if (e.key === "Escape") {
                    setEditingTitle(false);
                    setTitleDraft(courseTitle);
                  }
                }}
                className="h-6 text-sm px-1.5 py-0 font-semibold"
              />
              <button
                onClick={commitTitleEdit}
                className="text-state-today hover:opacity-80"
                aria-label="Save title"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setEditingTitle(false);
                  setTitleDraft(courseTitle);
                }}
                className="text-mossy-gray hover:opacity-80"
                aria-label="Cancel edit"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <h2 className="text-sm font-semibold text-forest-slate line-clamp-2 leading-snug">
                {courseTitle}
              </h2>
              <button
                onClick={() => {
                  setEditingTitle(true);
                  setTitleDraft(courseTitle);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-mossy-gray hover:text-forest-slate"
                aria-label="Edit title"
              >
                <Pencil className="h-3 w-3" />
              </button>
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

        {/* Open in Udemy link */}
        <a
          href={lectureUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-xs text-mossy-gray hover:text-state-today transition-colors mt-0.5"
          title="Open in Udemy"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Timestamp input */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border/50">
        <Clock className="h-3.5 w-3.5 text-mossy-gray shrink-0" />
        <Input
          value={tsInput}
          onChange={(e) => {
            setTsInput(e.target.value);
            setTsError("");
          }}
          onKeyDown={handleTsKeyDown}
          placeholder="e.g. 1:30"
          className="h-7 text-xs w-24 px-2 py-0 font-mono"
          aria-label="Timestamp"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertTimestamp}
          className="gap-1.5 text-xs h-7 px-2"
        >
          Insert
        </Button>
        {tsError ? (
          <span className="text-xs text-destructive">{tsError}</span>
        ) : (
          <span className="text-xs text-mossy-gray">Type a time then press Enter</span>
        )}
      </div>

      {/* Textarea */}
      <div className="flex-1 min-h-0 flex flex-col px-4 pt-3 pb-2 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Take notes here… type a timestamp like 1:30 and click Insert to mark moments in the video."
          className="flex-1 resize-none w-full text-sm text-forest-slate bg-transparent focus:outline-none placeholder:text-mossy-gray/50 font-mono leading-relaxed"
          spellCheck={false}
        />
        </div>
      </div>
    </div>
  );
}
