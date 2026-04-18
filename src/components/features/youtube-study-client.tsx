"use client";

import * as React from "react";
import { ResizablePanelGroup } from "@/components/ui/resizable-panel";
import YoutubePlayer, { type YoutubePlayerHandle } from "./youtube-player";
import { YoutubeNotesPanel } from "./youtube-notes-panel";
import type { YoutubeSession } from "@/types";

interface YoutubeStudyClientProps {
  session: YoutubeSession;
}

export function YoutubeStudyClient({ session }: YoutubeStudyClientProps) {
  const playerRef = React.useRef<YoutubePlayerHandle | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
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
        // Dispatch a custom event that the notes panel listens to, or call directly
        // We expose an imperative handle via a ref on the notes panel approach,
        // but it's simpler to dispatch a custom event
        window.dispatchEvent(new CustomEvent("yt-insert-timestamp"));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const playerEl = (
    <YoutubePlayer
      ref={playerRef}
      videoId={session.videoId}
      className="w-full aspect-video"
    />
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
      <div className="flex flex-col h-full w-full overflow-auto">
        <div className="shrink-0">{playerEl}</div>
        <div className="flex-1 min-h-0">{notesEl}</div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup defaultSplit={60} minSplit={30} maxSplit={80} className="h-full">
      <div className="h-full flex flex-col justify-start pt-6 px-4">
        {playerEl}
      </div>
      <div className="h-full overflow-hidden">
        {notesEl}
      </div>
    </ResizablePanelGroup>
  );
}
