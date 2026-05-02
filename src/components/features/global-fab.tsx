"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, BookOpen, FileText, CirclePlay, Music, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SimpleTooltip } from "@/components/ui/tooltip";

const ACTIONS = [
  { label: "Add Document", icon: BookOpen, href: "/documents/new", color: "bg-state-today hover:bg-state-today/90" },
  { label: "Create Note Doc", icon: FileText, href: "/documents/create", color: "bg-state-upcoming hover:bg-state-upcoming/90" },
  { label: "YouTube Study", icon: CirclePlay, href: "/study/youtube", color: "bg-destructive hover:bg-destructive/90" },
  { label: "Music Library", icon: Music, href: "/music", color: "bg-state-stale hover:bg-state-stale/90" },
];

export function GlobalFAB() {
  const [open, setOpen] = React.useState(false);

  // Escape closes it
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Backdrop — closes FAB when clicked outside */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB group */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
        {/* Action items — revealed when open */}
        {ACTIONS.map((action, i) => (
          <div
            key={action.href}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              open
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
            )}
            style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
          >
            {/* Label */}
            <span className="text-xs font-medium text-forest-slate bg-surface/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-border shadow-card whitespace-nowrap">
              {action.label}
            </span>
            {/* Icon button */}
            <Link
              href={action.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full shadow-soft text-white transition-transform hover:scale-105 active:scale-95",
                action.color
              )}
              aria-label={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Link>
          </div>
        ))}

        {/* Main FAB toggle */}
        <SimpleTooltip content={open ? "Close" : "Quick Add"} side="left">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close quick actions" : "Quick add"}
            className={cn(
              "flex items-center justify-center h-14 w-14 rounded-full shadow-glass text-white transition-all duration-300",
              "bg-forest-slate hover:bg-forest-slate/90 active:scale-95",
              open && "rotate-45"
            )}
          >
            <Plus className="h-6 w-6" />
          </button>
        </SimpleTooltip>
      </div>
    </>
  );
}
