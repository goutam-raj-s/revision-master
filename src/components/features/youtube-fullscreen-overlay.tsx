"use client";

import * as React from "react";
import { StickyNote, X, Maximize2, Minimize2, GripVertical } from "lucide-react";
import { YoutubeNotesPanel } from "./youtube-notes-panel";
import type { YoutubePlayerHandle } from "./youtube-player";

interface YoutubeFullscreenOverlayProps {
  sessionId: string;
  initialNotes: string;
  videoTitle: string;
  thumbnailUrl: string;
  playerRef: React.RefObject<YoutubePlayerHandle | null>;
}

/**
 * A draggable floating button + notes drawer that stays visible
 * even when the parent container is in browser fullscreen mode.
 * Must be rendered INSIDE the element that calls requestFullscreen().
 */
export function YoutubeFullscreenOverlay({
  sessionId,
  initialNotes,
  videoTitle,
  thumbnailUrl,
  playerRef,
}: YoutubeFullscreenOverlayProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [notesOpen, setNotesOpen] = React.useState(false);

  // FAB position (bottom-right default)
  const [pos, setPos] = React.useState({ x: 24, y: 24 }); // offset from bottom-right
  const [dragging, setDragging] = React.useState(false);
  const dragStartRef = React.useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const fabRef = React.useRef<HTMLButtonElement>(null);

  // Track browser fullscreen state
  React.useEffect(() => {
    const onChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs) setNotesOpen(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Drag logic for the FAB
  const handleFabMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      // Only start drag if not on the notes panel area
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
      dragStartRef.current = {
        mx: e.clientX,
        my: e.clientY,
        px: pos.x,
        py: pos.y,
      };
    },
    [pos]
  );

  React.useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.mx;
      const dy = e.clientY - dragStartRef.current.my;
      // pos is offset from bottom-right; moving right → decrease x, moving down → decrease y
      setPos({
        x: Math.max(8, dragStartRef.current.px - dx),
        y: Math.max(8, dragStartRef.current.py - dy),
      });
    };

    const handleMouseUp = () => setDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  // Only render when in fullscreen
  if (!isFullscreen) return null;

  return (
    <>
      {/* Draggable FAB */}
      <button
        ref={fabRef}
        onMouseDown={handleFabMouseDown}
        onClick={(e) => {
          if (dragging) return;
          e.stopPropagation();
          setNotesOpen((o) => !o);
        }}
        style={{
          position: "absolute",
          bottom: pos.y,
          right: pos.x,
          cursor: dragging ? "grabbing" : "grab",
          zIndex: 9999,
          userSelect: "none",
        }}
        aria-label={notesOpen ? "Close notes" : "Open notes"}
        title={notesOpen ? "Close notes (draggable)" : "Open notes (draggable)"}
        className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-state-today text-white shadow-hover hover:bg-state-today/90 transition-colors text-sm font-medium"
      >
        <GripVertical className="h-3.5 w-3.5 opacity-60" />
        {notesOpen ? <X className="h-4 w-4" /> : <StickyNote className="h-4 w-4" />}
        <span className="text-xs">{notesOpen ? "Close" : "Notes"}</span>
      </button>

      {/* Notes drawer — slides in from right */}
      {notesOpen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(380px, 40vw)",
            zIndex: 9998,
          }}
          className="bg-surface border-l border-border shadow-hover flex flex-col animate-slide-down"
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
            <span className="text-xs font-semibold text-mossy-gray uppercase tracking-wide">Notes</span>
            <button
              onClick={() => setNotesOpen(false)}
              className="p-1 rounded-lg hover:bg-canvas text-mossy-gray hover:text-forest-slate transition-colors"
              aria-label="Close notes"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <YoutubeNotesPanel
              sessionId={sessionId}
              initialNotes={initialNotes}
              videoTitle={videoTitle}
              thumbnailUrl={thumbnailUrl}
              playerRef={playerRef}
            />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Button that triggers fullscreen on a target element ref.
 */
interface FullscreenButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
}

export function FullscreenButton({ targetRef }: FullscreenButtonProps) {
  const [isFs, setIsFs] = React.useState(false);

  React.useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggle() {
    if (!isFs) {
      targetRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  return (
    <button
      onClick={toggle}
      title={isFs ? "Exit fullscreen" : "Enter fullscreen — notes stay accessible via the floating button"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-forest-slate/10 hover:bg-forest-slate/20 text-forest-slate border border-forest-slate/20 transition-colors"
      aria-label={isFs ? "Exit fullscreen" : "Fullscreen with notes"}
    >
      {isFs ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      <span>{isFs ? "Exit Fullscreen" : "⛶ Fullscreen + Notes"}</span>
    </button>
  );
}
