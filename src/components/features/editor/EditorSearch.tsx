"use client";

import * as React from "react";
import { Editor } from "@tiptap/react";
import { ChevronUp, ChevronDown, X, Replace } from "lucide-react";
import { searchKey } from "./extensions/SearchReplace";
import { cn } from "@/lib/utils";

/** Find & replace panel. Opens with Cmd/Ctrl+F when the editor has focus. */
export function EditorSearch({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = React.useState(false);
  const [showReplace, setShowReplace] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const [replaceTerm, setReplaceTerm] = React.useState("");
  const [stats, setStats] = React.useState({ index: 0, total: 0 });
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+F opens the panel (only when the editor is focused / hovered).
  React.useEffect(() => {
    if (!editor) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        if (editor.isFocused || document.activeElement?.closest(".tiptap-content")) {
          e.preventDefault();
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editor]);

  // Reflect plugin state (current/total) on every transaction.
  React.useEffect(() => {
    if (!editor) return;
    const update = () => {
      const s = searchKey.getState(editor.state);
      setStats({ index: s?.results.length ? s.index + 1 : 0, total: s?.results.length ?? 0 });
    };
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);

  function close() {
    setOpen(false);
    editor?.commands.clearSearch();
    editor?.commands.focus();
  }

  function runSearch(value: string) {
    setTerm(value);
    editor?.commands.setSearchTerm(value);
  }

  if (!editor || !open) return null;

  return (
    <div className="absolute right-4 top-3 z-30 w-[330px] rounded-xl border border-border bg-surface p-2 shadow-glass">
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={term}
          onChange={(e) => runSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.shiftKey ? editor.commands.searchPrev() : editor.commands.searchNext();
            }
            if (e.key === "Escape") close();
          }}
          placeholder="Find in document"
          className="h-8 flex-1 rounded-lg border border-border bg-canvas px-2.5 text-sm text-forest-slate outline-none placeholder:text-mossy-gray/60 focus:border-state-today"
        />
        <span className="w-14 shrink-0 text-center text-xs tabular-nums text-mossy-gray">
          {stats.total ? `${stats.index}/${stats.total}` : "0/0"}
        </span>
        <button
          onClick={() => editor.commands.searchPrev()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-mossy-gray hover:bg-canvas hover:text-forest-slate"
          title="Previous (Shift+Enter)"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.commands.searchNext()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-mossy-gray hover:bg-canvas hover:text-forest-slate"
          title="Next (Enter)"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          onClick={() => setShowReplace((s) => !s)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-mossy-gray hover:bg-canvas hover:text-forest-slate",
            showReplace && "bg-state-today/10 text-state-today"
          )}
          title="Toggle replace"
        >
          <Replace className="h-4 w-4" />
        </button>
        <button
          onClick={close}
          className="flex h-7 w-7 items-center justify-center rounded-md text-mossy-gray hover:bg-canvas hover:text-forest-slate"
          title="Close (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {showReplace && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <input
            value={replaceTerm}
            onChange={(e) => {
              setReplaceTerm(e.target.value);
              editor.commands.setReplaceTerm(e.target.value);
            }}
            placeholder="Replace with"
            className="h-8 flex-1 rounded-lg border border-border bg-canvas px-2.5 text-sm text-forest-slate outline-none placeholder:text-mossy-gray/60 focus:border-state-today"
          />
          <button
            onClick={() => editor.commands.replaceCurrent()}
            disabled={stats.total === 0}
            className="h-8 rounded-lg border border-border px-2.5 text-xs text-forest-slate hover:bg-canvas disabled:opacity-40"
          >
            Replace
          </button>
          <button
            onClick={() => editor.commands.replaceAll()}
            disabled={stats.total === 0}
            className="h-8 rounded-lg bg-state-today px-2.5 text-xs font-medium text-white hover:bg-state-today/90 disabled:opacity-40"
          >
            All
          </button>
        </div>
      )}
    </div>
  );
}
