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

function getFabMetrics() {
  if (typeof window === "undefined") return { size: 56, edge: 24 };
  return window.innerWidth < 640
    ? { size: 34, edge: 2 }
    : { size: 56, edge: 24 };
}

function clampFabPosition(position: { x: number; y: number }) {
  const { size, edge } = getFabMetrics();
  return {
    x: Math.max(edge, Math.min(window.innerWidth - size - edge, position.x)),
    y: Math.max(edge, Math.min(window.innerHeight - size - edge, position.y)),
  };
}

export function GlobalFAB() {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 24, y: 24 });
  const [dragging, setDragging] = React.useState(false);
  const dragStartRef = React.useRef({ pointerX: 0, pointerY: 0, x: 24, y: 24, moved: false });

  React.useEffect(() => {
    const stored = window.localStorage.getItem("lostbae_global_fab_position");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as { x?: number; y?: number };
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        setPosition(clampFabPosition({ x: parsed.x, y: parsed.y }));
      }
    } catch {
      // Ignore corrupt local preference.
    }
  }, []);

  React.useEffect(() => {
    const handleResize = () => setPosition((current) => clampFabPosition(current));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem("lostbae_global_fab_position", JSON.stringify(position));
  }, [position]);

  // Escape closes it
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  React.useEffect(() => {
    if (!dragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = event.clientX - dragStartRef.current.pointerX;
      const deltaY = event.clientY - dragStartRef.current.pointerY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) dragStartRef.current.moved = true;

      setPosition({
        ...clampFabPosition({
          x: dragStartRef.current.x - deltaX,
          y: dragStartRef.current.y - deltaY,
        }),
      });
    };

    const handlePointerUp = () => {
      setDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging]);

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
      <div
        className="fixed z-50 flex touch-none flex-col-reverse items-end gap-2 sm:gap-3"
        style={{ right: position.x, bottom: position.y }}
      >
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
                "max-sm:h-8 max-sm:w-8",
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
            onPointerDown={(event) => {
              dragStartRef.current = {
                pointerX: event.clientX,
                pointerY: event.clientY,
                x: position.x,
                y: position.y,
                moved: false,
              };
              setDragging(true);
            }}
            onClick={() => {
              if (dragStartRef.current.moved) return;
              setOpen((o) => !o);
            }}
            aria-label={open ? "Close quick actions" : "Quick add"}
            className={cn(
                "flex h-[34px] w-[34px] items-center justify-center rounded-full shadow-glass text-white transition-all duration-300 sm:h-14 sm:w-14",
              "bg-forest-slate hover:bg-forest-slate/90 active:scale-95",
              open && !dragging && "rotate-45",
              dragging && "scale-95 cursor-grabbing"
            )}
          >
            <Plus className="h-4 w-4 sm:h-6 sm:w-6" />
          </button>
        </SimpleTooltip>
      </div>
    </>
  );
}
