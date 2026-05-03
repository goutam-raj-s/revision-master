"use client";

import * as React from "react";
import { StudySidebarPanel } from "@/components/features/study-sidebar-panel";
import type { Document, Repetition, Note, Term } from "@/types";

interface StudySplitPaneProps {
  leftContent: React.ReactNode;
  doc: Document;
  rep: Repetition | null;
  initialNotes: Note[];
  initialTerms: Term[];
}

const MIN_SIDEBAR_WIDTH = 260;
const MAX_SIDEBAR_WIDTH = 560;
const DEFAULT_SIDEBAR_WIDTH = 320;

export function StudySplitPane({
  leftContent,
  doc,
  rep,
  initialNotes,
  initialTerms,
}: StudySplitPaneProps) {
  const [sidebarWidth, setSidebarWidth] = React.useState(DEFAULT_SIDEBAR_WIDTH);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const startXRef = React.useRef<number>(0);
  const startWidthRef = React.useRef<number>(DEFAULT_SIDEBAR_WIDTH);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, startWidthRef.current + delta)
      );
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex min-h-0 relative"
      style={{ userSelect: isDragging ? "none" : undefined }}
    >
      {/* Left pane — content */}
      <div className="flex-1 relative min-w-0 h-full bg-white">
        {leftContent}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="hidden lg:flex items-center justify-center w-1 shrink-0 relative cursor-col-resize group z-10"
        aria-label="Resize sidebar"
        role="separator"
        aria-orientation="vertical"
      >
        {/* Invisible wider hit area */}
        <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
        {/* Visual line */}
        <div
          className={`w-px h-full transition-colors ${
            isDragging
              ? "bg-state-today/60"
              : "bg-border group-hover:bg-state-today/40"
          }`}
        />
        {/* Drag dots indicator */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 flex flex-col gap-0.5 transition-opacity ${
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-state-today/70" />
          ))}
        </div>
      </div>

      {/* Right pane — Sidebar (visible on lg+) */}
      <div
        className="hidden lg:flex h-full shrink-0"
        style={{ width: sidebarWidth }}
      >
        <StudySidebarPanel
          doc={doc}
          rep={rep}
          initialNotes={initialNotes}
          initialTerms={initialTerms}
        />
      </div>
    </div>
  );
}
