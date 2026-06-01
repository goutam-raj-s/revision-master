"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, BookOpen, FileText, CirclePlay, EyeOff, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { SimpleTooltip } from "@/components/ui/tooltip";

const ACTIONS = [
  { label: "Add Document", icon: BookOpen, href: "/documents/new", color: "bg-state-today hover:bg-state-today/90" },
  { label: "Create Note Doc", icon: FileText, href: "/documents/create", color: "bg-state-upcoming hover:bg-state-upcoming/90" },
  { label: "YouTube Study", icon: CirclePlay, href: "/study/youtube", color: "bg-destructive hover:bg-destructive/90" },
];

const LS_POS = "lostbae_global_fab_position";
const LS_HIDDEN = "lostbae_global_fab_hidden";
// Smaller desktop size: 40 px (was 56 px)
const FAB_SIZE = 40;

function clampPos(pos: { x: number; y: number }) {
  if (typeof window === "undefined") return pos;
  const edge = 16;
  return {
    x: Math.max(edge, Math.min(window.innerWidth - FAB_SIZE - edge, pos.x)),
    y: Math.max(edge, Math.min(window.innerHeight - FAB_SIZE - edge, pos.y)),
  };
}

export function GlobalFAB() {
  const [open, setOpen] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 24, y: 24 });
  const [dragging, setDragging] = React.useState(false);
  const dragStartRef = React.useRef({ pointerX: 0, pointerY: 0, x: 24, y: 24, moved: false });

  // Restore persisted state
  React.useEffect(() => {
    const storedPos = window.localStorage.getItem(LS_POS);
    if (storedPos) {
      try {
        const parsed = JSON.parse(storedPos) as { x?: number; y?: number };
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(clampPos({ x: parsed.x, y: parsed.y }));
        }
      } catch { /* ignore */ }
    }
    setHidden(window.localStorage.getItem(LS_HIDDEN) === "1");
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(LS_POS, JSON.stringify(position));
  }, [position]);

  React.useEffect(() => {
    window.localStorage.setItem(LS_HIDDEN, hidden ? "1" : "0");
  }, [hidden]);

  React.useEffect(() => {
    const handleResize = () => setPosition((p) => clampPos(p));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - dragStartRef.current.pointerX;
      const dy = e.clientY - dragStartRef.current.pointerY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragStartRef.current.moved = true;
      setPosition(clampPos({ x: dragStartRef.current.x - dx, y: dragStartRef.current.y - dy }));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [dragging]);

  // When hidden: show a tiny ghost button to restore
  if (hidden) {
    return (
      <SimpleTooltip content="Show quick-add" side="left">
        <button
          onClick={() => setHidden(false)}
          style={{ right: position.x, bottom: position.y }}
          className="fixed z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface/80 text-mossy-gray shadow-sm backdrop-blur hover:bg-canvas hover:text-forest-slate transition-all"
          aria-label="Show quick-add FAB"
        >
          <Eye className="h-3 w-3" />
        </button>
      </SimpleTooltip>
    );
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <div
        className="fixed z-50 flex touch-none flex-col-reverse items-end gap-2"
        style={{ right: position.x, bottom: position.y }}
      >
        {/* Action items */}
        {ACTIONS.map((action, i) => (
          <div
            key={action.href}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}
            style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
          >
            <span className="text-xs font-medium text-forest-slate bg-surface/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-border shadow-card whitespace-nowrap">
              {action.label}
            </span>
            <Link
              href={action.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full shadow-soft text-white transition-transform hover:scale-105 active:scale-95",
                action.color
              )}
              aria-label={action.label}
            >
              <action.icon className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}

        {/* Hide button — visible when menu is open */}
        {open && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-mossy-gray bg-surface/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-border shadow-card whitespace-nowrap">
              Hide button
            </span>
            <button
              onClick={() => { setOpen(false); setHidden(true); }}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-surface border border-border text-mossy-gray shadow-soft transition-transform hover:scale-105 hover:text-forest-slate active:scale-95"
              aria-label="Hide quick-add button"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Main FAB */}
        <SimpleTooltip content={open ? "Close" : "Quick Add"} side="left">
          <button
            onPointerDown={(e) => {
              dragStartRef.current = { pointerX: e.clientX, pointerY: e.clientY, x: position.x, y: position.y, moved: false };
              setDragging(true);
            }}
            onClick={() => { if (dragStartRef.current.moved) return; setOpen((o) => !o); }}
            aria-label={open ? "Close quick actions" : "Quick add"}
            style={{ width: FAB_SIZE, height: FAB_SIZE }}
            className={cn(
              "flex items-center justify-center rounded-full shadow-glass text-white transition-all duration-300",
              "bg-forest-slate hover:bg-forest-slate/90 active:scale-95",
              open && !dragging && "rotate-45",
              dragging && "scale-95 cursor-grabbing"
            )}
          >
            <Plus className="h-4 w-4" />
          </button>
        </SimpleTooltip>
      </div>
    </>
  );
}
