"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResizablePanelGroupProps {
  /** Initial left pane width as percentage (0–100) */
  defaultSplit?: number;
  /** Minimum left pane percentage */
  minSplit?: number;
  /** Maximum left pane percentage */
  maxSplit?: number;
  /** Called once on drag-end with the committed percent */
  onResizeEnd?: (leftPercent: number) => void;
  /** Controlled split — if provided, the group uses this instead of internal state */
  split?: number;
  className?: string;
  children: [React.ReactNode, React.ReactNode];
}

interface ResizableVerticalGroupProps {
  /** Initial top pane height in px */
  defaultHeight?: number;
  /** Min top height px */
  minHeight?: number;
  /** Max top height px */
  maxHeight?: number;
  /** Called once on drag-end with committed px */
  onResizeEnd?: (topPx: number) => void;
  /** Controlled height */
  topHeight?: number;
  className?: string;
  children: [React.ReactNode, React.ReactNode];
}

// ─── Horizontal split (left / right panes) ───────────────────────────────────

export function ResizablePanelGroup({
  defaultSplit = 70,
  minSplit = 20,
  maxSplit = 85,
  onResizeEnd,
  split: controlledSplit,
  className,
  children,
}: ResizablePanelGroupProps) {
  const [split, setSplit] = React.useState(controlledSplit ?? defaultSplit);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const leftRef = React.useRef<HTMLDivElement>(null);
  const rightRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const [isDraggingState, setIsDraggingState] = React.useState(false);
  const pendingPercent = React.useRef(split);

  // We do not sync controlled prop into internal state anymore.
  // This allows the component to revert to its previous uncontrolled state
  // when a controlled prop (like `split=100` during fullscreen) is removed.

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current || !leftRef.current || !rightRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const raw = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(maxSplit, Math.max(minSplit, raw));
      // Direct DOM update — no React re-render per frame
      leftRef.current.style.width = `${clamped}%`;
      rightRef.current.style.width = `${100 - clamped}%`;
      pendingPercent.current = clamped;
    },
    [minSplit, maxSplit]
  );

  const handleMouseUp = React.useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsDraggingState(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    const committed = Math.round(pendingPercent.current * 10) / 10;
    setSplit(committed);
    onResizeEnd?.(committed);
  }, [handleMouseMove, onResizeEnd]);

  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    isDragging.current = true;
    setIsDraggingState(true);
    pendingPercent.current = effectiveSplit;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleDoubleClick() {
    const reset = defaultSplit;
    if (leftRef.current) leftRef.current.style.width = `${reset}%`;
    if (rightRef.current) rightRef.current.style.width = `${100 - reset}%`;
    setSplit(reset);
    onResizeEnd?.(reset);
  }

  const effectiveSplit = controlledSplit ?? split;

  return (
    <div ref={containerRef} className={cn("flex h-full w-full overflow-hidden", className)}>
      <div
        ref={leftRef}
        style={{ width: `${effectiveSplit}%` }}
        className="shrink-0 overflow-hidden"
      >
        {children[0]}
      </div>
      {/* Drag handle */}
      <div
        onMouseDown={startDrag}
        onDoubleClick={handleDoubleClick}
        className={cn(
          "group shrink-0 w-1.5 relative flex items-center justify-center cursor-col-resize",
          "bg-border/30 hover:bg-state-today/60 transition-colors duration-150 z-10",
          "select-none"
        )}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels — drag or double-click to reset"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            const next = Math.max(minSplit, effectiveSplit - 2);
            setSplit(next);
            onResizeEnd?.(next);
          } else if (e.key === "ArrowRight") {
            const next = Math.min(maxSplit, effectiveSplit + 2);
            setSplit(next);
            onResizeEnd?.(next);
          } else if (e.key === "Enter") {
            handleDoubleClick();
          }
        }}
      >
        {/* Grip dots */}
        <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-80 transition-opacity">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-mossy-gray" />
          ))}
        </div>
      </div>
      <div
        ref={rightRef}
        style={{ width: `${100 - effectiveSplit}%` }}
        className="flex-1 overflow-hidden"
      >
        {children[1]}
      </div>
      {isDraggingState && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}
    </div>
  );
}

// ─── Vertical split (top / bottom panes) ─────────────────────────────────────

export function ResizableVerticalGroup({
  defaultHeight = 400,
  minHeight = 160,
  maxHeight = 700,
  onResizeEnd,
  topHeight: controlledHeight,
  className,
  children,
}: ResizableVerticalGroupProps) {
  const [topPx, setTopPx] = React.useState(controlledHeight ?? defaultHeight);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const topRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const [isDraggingState, setIsDraggingState] = React.useState(false);
  const pending = React.useRef(topPx);

  // We do not sync controlled prop into internal state anymore.
  // This allows the component to revert to its previous uncontrolled state
  // when a controlled prop is removed.

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current || !topRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const raw = e.clientY - rect.top;
      const clamped = Math.min(maxHeight, Math.max(minHeight, raw));
      topRef.current.style.height = `${clamped}px`;
      pending.current = clamped;
    },
    [minHeight, maxHeight]
  );

  const handleMouseUp = React.useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsDraggingState(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    const committed = Math.round(pending.current);
    setTopPx(committed);
    onResizeEnd?.(committed);
  }, [handleMouseMove, onResizeEnd]);

  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    isDragging.current = true;
    setIsDraggingState(true);
    pending.current = effectiveHeight;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleDoubleClick() {
    if (topRef.current) topRef.current.style.height = `${defaultHeight}px`;
    setTopPx(defaultHeight);
    onResizeEnd?.(defaultHeight);
  }

  const effectiveHeight = controlledHeight ?? topPx;

  return (
    <div ref={containerRef} className={cn("flex flex-col w-full", className)}>
      <div
        ref={topRef}
        style={{ height: effectiveHeight }}
        className="shrink-0 overflow-auto"
      >
        {children[0]}
      </div>
      {/* Horizontal drag handle */}
      <div
        onMouseDown={startDrag}
        onDoubleClick={handleDoubleClick}
        className={cn(
          "group shrink-0 h-1.5 relative flex items-center justify-center cursor-row-resize",
          "bg-border/30 hover:bg-state-today/60 transition-colors duration-150 z-10",
          "select-none"
        )}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize sections — drag or double-click to reset"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            const next = Math.max(minHeight, effectiveHeight - 20);
            setTopPx(next);
            onResizeEnd?.(next);
          } else if (e.key === "ArrowDown") {
            const next = Math.min(maxHeight, effectiveHeight + 20);
            setTopPx(next);
            onResizeEnd?.(next);
          } else if (e.key === "Enter") {
            handleDoubleClick();
          }
        }}
      >
        {/* Grip dots */}
        <div className="flex flex-row gap-0.5 opacity-40 group-hover:opacity-80 transition-opacity">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-mossy-gray" />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {children[1]}
      </div>
      {isDraggingState && <div className="fixed inset-0 z-[9999] cursor-row-resize" />}
    </div>
  );
}
