"use client";

import * as React from "react";
import { X, Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  label: string;
}

const GROUPS: { title: string; items: Shortcut[] }[] = [
  {
    title: "Global",
    items: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["⌘", "/"], label: "Open command palette" },
      { keys: ["?"], label: "Show this shortcuts sheet" },
      { keys: ["⌘", "⇧", "K"], label: "Quick clipper widget" },
      { keys: ["⌘", "⇧", "V"], label: "Clipboard history (last 10 copies)" },
      { keys: ["⌘", "⇧", "⌥", "R"], label: "Reveal / hide private documents" },
    ],
  },
  {
    title: "Review queue",
    items: [
      { keys: ["E"], label: "Complete focused task" },
      { keys: ["Esc"], label: "Close modal / clear focus" },
      { keys: ["↑", "↓"], label: "Move between palette results" },
      { keys: ["↵"], label: "Open / select" },
    ],
  },
  {
    title: "Editor",
    items: [
      { keys: ["⌘", "⇧", "H"], label: "Sticky highlighter" },
      { keys: ["⌘", "/"], label: "Editor command menu" },
    ],
  },
];

export function ShortcutsHelp() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/editors.
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);

      if (e.key === "?" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-forest-slate/30 backdrop-blur-sm animate-fade-in" />

      <div
        className="relative w-full max-w-lg animate-slide-up rounded-2xl border border-border bg-surface shadow-glass"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-forest-slate">
            <Keyboard className="h-4 w-4 text-state-today" />
            Keyboard shortcuts
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-mossy-gray transition-colors hover:bg-canvas"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-mossy-gray">
                {group.title}
              </div>
              <ul className="space-y-2">
                {group.items.map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-forest-slate">{s.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {s.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="rounded bg-canvas border border-border px-1.5 py-0.5 font-mono text-xs text-mossy-gray"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border px-5 py-2.5 text-center text-xs text-mossy-gray">
          Press <kbd className="rounded bg-canvas border border-border px-1 font-mono">?</kbd> anytime
          to toggle this sheet
        </div>
      </div>
    </div>
  );
}
