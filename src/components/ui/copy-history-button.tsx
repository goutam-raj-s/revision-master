"use client";

import * as React from "react";
import { ClipboardList, Copy, Check, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const LS_KEY = "lostbae_copy_history";
const MAX_ITEMS = 10;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: string[]) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function CopyHistoryButton({ className }: { className?: string }) {
  const [history, setHistory] = React.useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);
  const [open, setOpen] = React.useState(false);

  // Load on mount
  React.useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Listen for copy events within the page
  React.useEffect(() => {
    const handler = () => {
      // Small delay so clipboard is populated
      setTimeout(() => {
        navigator.clipboard.readText().then((text) => {
          if (!text.trim()) return;
          setHistory((prev) => {
            const next = [text, ...prev.filter((t) => t !== text)].slice(0, MAX_ITEMS);
            saveHistory(next);
            return next;
          });
        }).catch(() => {/* clipboard read permission not granted */});
      }, 50);
    };
    document.addEventListener("copy", handler);
    return () => document.removeEventListener("copy", handler);
  }, []);

  // Keyboard shortcut: Cmd+Shift+V to open
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  async function handlePaste(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      /* fallback: user can manually paste */
    }
  }

  function handleClear() {
    setHistory([]);
    saveHistory([]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex items-center justify-center h-7 w-7 rounded-full text-mossy-gray hover:text-forest-slate hover:bg-canvas border border-transparent hover:border-border transition-all",
            className
          )}
          aria-label="Clipboard history (Cmd+Shift+V)"
          title="Clipboard history (Cmd+Shift+V)"
        >
          <ClipboardList className="h-4 w-4" />
          {history.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-state-today text-[8px] font-bold text-white leading-none">
              {Math.min(history.length, 9)}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 p-0 overflow-hidden shadow-hover">
        <div className="flex items-center justify-between border-b border-border bg-canvas/60 px-3 py-2">
          <p className="text-xs font-semibold text-forest-slate uppercase tracking-wide">
            Copy History
          </p>
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-canvas px-1.5 py-0.5 font-mono text-[9px] text-mossy-gray">⌘⇧V</kbd>
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="ml-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-mossy-gray hover:bg-canvas hover:text-destructive transition-colors"
                title="Clear history"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <ClipboardList className="mx-auto mb-2 h-6 w-6 text-mossy-gray/40" />
            <p className="text-xs text-mossy-gray">Nothing copied yet in this session.</p>
            <p className="mt-1 text-[10px] text-mossy-gray/60">Copy any text to start building history.</p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
            {history.map((item, i) => (
              <button
                key={i}
                onClick={() => handlePaste(item, i)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-canvas transition-colors group"
                title="Click to copy to clipboard"
              >
                <div className="mt-0.5 shrink-0 text-mossy-gray/50 group-hover:text-mossy-gray transition-colors">
                  {copiedIdx === i ? (
                    <Check className="h-3.5 w-3.5 text-state-today" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </div>
                <p className="min-w-0 flex-1 truncate text-xs text-forest-slate leading-relaxed" style={{ maxHeight: "2.8rem", WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {item}
                </p>
                <span className="shrink-0 text-[9px] text-mossy-gray/40 font-mono mt-0.5">#{i + 1}</span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
