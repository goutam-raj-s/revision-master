"use client";

import * as React from "react";
import { StudySidebarPanel } from "@/components/features/study-sidebar-panel";
import { PanelRightClose, PanelRightOpen, RotateCcw } from "lucide-react";
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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
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
    const storedWidth = window.localStorage.getItem("lostbae_study_sidebar_width");
    const storedOpen = window.localStorage.getItem("lostbae_study_sidebar_open");
    if (storedWidth) {
      const parsed = Number(storedWidth);
      if (!Number.isNaN(parsed)) {
        setSidebarWidth(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, parsed)));
      }
    }
    if (storedOpen === "0") setIsSidebarOpen(false);
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem("lostbae_study_sidebar_width", String(sidebarWidth));
  }, [sidebarWidth]);

  React.useEffect(() => {
    window.localStorage.setItem("lostbae_study_sidebar_open", isSidebarOpen ? "1" : "0");
  }, [isSidebarOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "]") {
        event.preventDefault();
        setIsSidebarOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      <div className="hidden lg:flex shrink-0 items-center">
        <div
          onMouseDown={isSidebarOpen ? handleMouseDown : undefined}
          onDoubleClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
          className="flex items-center justify-center w-2 h-full shrink-0 relative cursor-col-resize group z-10"
          aria-label="Resize sidebar"
          role="separator"
          aria-orientation="vertical"
          title="Drag to resize. Double-click to reset."
        >
          <div className="absolute inset-y-0 -left-2 -right-2" />
          <div
            className={`w-px h-full transition-colors ${
              isDragging
                ? "bg-state-today/60"
                : "bg-border group-hover:bg-state-today/40"
            }`}
          />
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
        <div className="absolute right-2 top-3 z-20 hidden items-center gap-1 rounded-full border border-border bg-surface/90 p-1 shadow-soft backdrop-blur lg:flex">
          <button
            onClick={() => setIsSidebarOpen((open) => !open)}
            className="rounded-full p-1.5 text-mossy-gray transition-colors hover:bg-canvas hover:text-forest-slate"
            title={isSidebarOpen ? "Hide study panel (Cmd+])" : "Show study panel (Cmd+])"}
            aria-label={isSidebarOpen ? "Hide study panel" : "Show study panel"}
          >
            {isSidebarOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </button>
          {isSidebarOpen && (
            <button
              onClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
              className="rounded-full p-1.5 text-mossy-gray transition-colors hover:bg-canvas hover:text-forest-slate"
              title="Reset panel width"
              aria-label="Reset panel width"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right pane — Sidebar (visible on lg+) */}
      {isSidebarOpen && (
        <div
          className="hidden lg:flex h-full shrink-0 transition-[width] duration-200"
          style={{ width: sidebarWidth }}
        >
          <StudySidebarPanel
            doc={doc}
            rep={rep}
            initialNotes={initialNotes}
            initialTerms={initialTerms}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
