"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ResizablePanelGroup } from "@/components/ui/resizable-panel";
import YoutubePlayer, { type YoutubePlayerHandle } from "./youtube-player";
import { YoutubeNotesPanel } from "./youtube-notes-panel";
import { YoutubeFullscreenOverlay, FullscreenButton } from "./youtube-fullscreen-overlay";
import type { YoutubeSession } from "@/types";

interface YoutubeStudyClientProps {
  session: YoutubeSession;
}

export function YoutubeStudyClient({ session }: YoutubeStudyClientProps) {
  const playerRef = React.useRef<YoutubePlayerHandle | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Track fullscreen state — hide default notes column in fullscreen
  React.useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Global T key listener — insert timestamp (skip if focused in input/textarea)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("yt-insert-timestamp"));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const playerEl = (
    <div className={cn("w-full bg-black flex items-center justify-center", isFullscreen ? "h-full" : "aspect-video")}>
      <YoutubePlayer
        ref={playerRef}
        videoId={session.videoId}
        className="w-full h-full"
      />
    </div>
  );

  const notesEl = (
    <YoutubeNotesPanel
      sessionId={session.id}
      initialNotes={session.notes}
      videoTitle={session.videoTitle}
      thumbnailUrl={session.thumbnailUrl}
      playerRef={playerRef}
    />
  );

  if (isMobile) {
    return (
      <div ref={containerRef} className="flex flex-col h-full w-full overflow-auto relative">
        <div className="shrink-0">{playerEl}</div>
        {/* Hide default notes panel in fullscreen — overlay FAB handles it */}
        <div className={`flex-1 min-h-0 ${isFullscreen ? "hidden" : ""}`}>{notesEl}</div>
        <YoutubeFullscreenOverlay
          sessionId={session.id}
          initialNotes={session.notes}
          videoTitle={session.videoTitle}
          thumbnailUrl={session.thumbnailUrl}
          playerRef={playerRef}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("h-full relative", isFullscreen && "bg-black")}>
      {/*
        ResizablePanelGroup always gets two children (required by its type).
        In fullscreen we pass split=100 (controlled) to push the right pane to 0%
        and hide it visually — the overlay FAB handles notes instead.
      */}
      <ResizablePanelGroup
        defaultSplit={60}
        minSplit={30}
        maxSplit={100}
        // In fullscreen: force left pane to 100% via controlled split
        split={isFullscreen ? 100 : undefined}
        className={cn("h-full", isFullscreen && "[&>div[role='separator']]:hidden")}
      >
        {/* Player column */}
        <div className={cn("h-full flex flex-col justify-center gap-2", isFullscreen ? "p-0" : "pt-6 px-4")}>
          {playerEl}
          {/* Fullscreen button sits below the video in normal view */}
          {!isFullscreen && (
            <div className="flex items-center justify-end pr-1">
              <FullscreenButton targetRef={containerRef} />
            </div>
          )}
        </div>

        {/* Notes column — visually hidden in fullscreen (split=100 collapses it to 0px) */}
        <div className={`h-full overflow-hidden ${isFullscreen ? "invisible pointer-events-none" : ""}`}>
          {notesEl}
        </div>
      </ResizablePanelGroup>

      {/* Fullscreen notes overlay — FAB + sliding panel, only active in fullscreen */}
      <YoutubeFullscreenOverlay
        sessionId={session.id}
        initialNotes={session.notes}
        videoTitle={session.videoTitle}
        thumbnailUrl={session.thumbnailUrl}
        playerRef={playerRef}
      />
    </div>
  );
}
