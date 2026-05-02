"use client";

import * as React from "react";
import { Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { updateDocumentTitleAction } from "@/actions/documents";

interface InlineTitleEditorProps {
  docId: string;
  title: string;
  className?: string;
}

export function InlineTitleEditor({ docId, title: initialTitle, className }: InlineTitleEditorProps) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialTitle);
  const [displayTitle, setDisplayTitle] = React.useState(initialTitle);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startEditing() {
    setValue(displayTitle);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setValue(displayTitle);
    setError(null);
    setEditing(false);
  }

  async function commitSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Title can't be empty");
      inputRef.current?.focus();
      return;
    }
    if (trimmed === displayTitle) {
      setEditing(false);
      return;
    }

    setSaving(true);
    const result = await updateDocumentTitleAction(docId, trimmed);
    setSaving(false);

    if (result.success) {
      setDisplayTitle(trimmed);
      setEditing(false);
      setError(null);
      toast("Title updated", { variant: "success" });
    } else {
      setError(result.error || "Failed to save title");
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  }

  if (!editing) {
    return (
      <div className="group/title flex items-start gap-2">
        <h1
          onDoubleClick={startEditing}
          title="Double-click to edit title"
          className={cn(
            "text-2xl font-serif font-semibold text-forest-slate leading-snug cursor-text select-none",
            "group-hover/title:text-forest-slate/80 transition-colors",
            className
          )}
        >
          {displayTitle}
        </h1>
        <button
          onClick={startEditing}
          title="Edit title"
          className="mt-1.5 opacity-0 group-hover/title:opacity-100 transition-opacity p-1 rounded text-mossy-gray hover:text-forest-slate"
          aria-label="Edit document title"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(null); }}
        onKeyDown={handleKeyDown}
        onBlur={commitSave}
        disabled={saving}
        className={cn(
          "w-full text-2xl font-serif font-semibold text-forest-slate leading-snug",
          "bg-transparent border-b-2 border-state-today/50 outline-none",
          "focus:border-state-today transition-colors",
          "disabled:opacity-60",
          error && "border-destructive focus:border-destructive"
        )}
        aria-label="Document title"
      />
      {saving && (
        <div className="flex items-center gap-1.5 mt-1 text-xs text-mossy-gray">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </div>
      )}
      {error && !saving && (
        <p className="mt-1 text-xs text-destructive font-medium">{error}</p>
      )}
      {!saving && !error && (
        <p className="mt-1 text-xs text-mossy-gray">
          Press <kbd className="px-1 py-0.5 rounded bg-border font-mono text-[10px]">Enter</kbd> to save ·{" "}
          <kbd className="px-1 py-0.5 rounded bg-border font-mono text-[10px]">Esc</kbd> to cancel
        </p>
      )}
    </div>
  );
}
