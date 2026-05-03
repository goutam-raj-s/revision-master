"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, X, ChevronRight } from "lucide-react";
import { getUserDocuments } from "@/actions/documents";
import { cn } from "@/lib/utils";
import type { Document } from "@/types";

const MEDIA_ICON: Record<string, string> = {
  audio: "🎵",
  video: "🎬",
  pdf: "📄",
  image: "🖼️",
  document: "📎",
  "native-doc": "✍️",
  "google-doc": "📝",
};

interface StudyDocSwitcherProps {
  currentDocId: string;
}

export function StudyDocSwitcher({ currentDocId }: StudyDocSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [docs, setDocs] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open via Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setActiveIndex(0);
      fetchDocs("");
    }
  }, [open]);

  async function fetchDocs(search: string) {
    setLoading(true);
    try {
      const results = await getUserDocuments(search ? { search } : undefined);
      setDocs(results.filter((d) => d.id !== currentDocId));
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchDocs(val), 200);
  }

  function navigateTo(docId: string) {
    setOpen(false);
    router.push(`/study/${docId}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, docs.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && docs[activeIndex]) {
      navigateTo(docs[activeIndex].id);
    }
  }

  const filtered = docs; // server-filtered already

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-canvas hover:bg-surface text-xs text-mossy-gray hover:text-forest-slate transition-all group"
        aria-label="Switch document (⌘K)"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline max-w-[120px] truncate">Switch doc…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-border/70 font-mono text-[10px] text-mossy-gray group-hover:bg-border">
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-forest-slate/20 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Palette */}
          <div className="relative w-full max-w-lg bg-surface rounded-2xl shadow-hover border border-border overflow-hidden animate-slide-down">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 shrink-0 text-mossy-gray" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                placeholder="Search documents…"
                className="flex-1 text-sm text-forest-slate bg-transparent outline-none placeholder:text-mossy-gray/60"
              />
              {loading && (
                <div className="h-4 w-4 rounded-full border-2 border-state-today border-t-transparent animate-spin" />
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-canvas text-mossy-gray hover:text-forest-slate transition-colors"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Results list */}
            <div className="max-h-80 overflow-y-auto">
              {filtered.length === 0 && !loading && (
                <div className="py-8 text-center text-sm text-mossy-gray">
                  {query ? "No documents found" : "All your other documents will appear here"}
                </div>
              )}
              {filtered.map((doc, i) => {
                const icon = MEDIA_ICON[doc.mediaType ?? "google-doc"] ?? "📝";
                return (
                  <button
                    key={doc.id}
                    onClick={() => navigateTo(doc.id)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group",
                      i === activeIndex
                        ? "bg-state-today/8 text-forest-slate"
                        : "text-forest-slate hover:bg-canvas"
                    )}
                  >
                    <span className="text-base shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{doc.title}</div>
                      {doc.tags.length > 0 && (
                        <div className="text-xs text-mossy-gray truncate mt-0.5">
                          {doc.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
                        </div>
                      )}
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-mossy-gray transition-opacity",
                        i === activeIndex ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            {filtered.length > 0 && (
              <div className="px-4 py-2 border-t border-border/60 flex gap-4 text-[10px] text-mossy-gray">
                <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                <span><kbd className="font-mono">↵</kbd> open</span>
                <span><kbd className="font-mono">Esc</kbd> close</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
