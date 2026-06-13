"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ResizablePanelGroup } from "@/components/ui/resizable-panel";
import YoutubePlayer, { type YoutubePlayerHandle } from "./youtube-player";
import { ExternalVideoPlayer } from "./external-video-player";
import { YoutubeNotesPanel } from "./youtube-notes-panel";
import { YoutubeFullscreenOverlay, FullscreenButton } from "./youtube-fullscreen-overlay";
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from "lucide-react";
import type { YoutubeSession } from "@/types";

interface YoutubeStudyClientProps {
  session: YoutubeSession;
}

const LS_NOTES_OPEN = "lostbae_yt_notes_open";

function SkipButton({
  seconds,
  playerRef,
}: {
  seconds: number;
  playerRef: React.RefObject<YoutubePlayerHandle | null>;
}) {
  const isForward = seconds > 0;
  const label = isForward ? `+${seconds}s` : `${seconds}s`;
  return (
    <button
      onClick={() =>
        isForward
          ? playerRef.current?.skipForward(Math.abs(seconds))
          : playerRef.current?.skipBack(Math.abs(seconds))
      }
      title={isForward ? `Skip forward ${Math.abs(seconds)}s` : `Skip back ${Math.abs(seconds)}s`}
      aria-label={isForward ? `Skip forward ${Math.abs(seconds)} seconds` : `Skip back ${Math.abs(seconds)} seconds`}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-forest-slate/10 hover:bg-forest-slate/20 text-forest-slate border border-forest-slate/20 transition-colors"
    >
      {isForward ? <SkipForward className="h-3.5 w-3.5" /> : <SkipBack className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </button>
  );
}

export function YoutubeStudyClient({ session }: YoutubeStudyClientProps) {
  const playerRef = React.useRef<YoutubePlayerHandle | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isNotesOpen, setIsNotesOpen] = React.useState(true);

  const isPreview = session.id.startsWith("external-preview-");
  const localNotesKey = isPreview ? `rm:${session.id}:notes` : undefined;

  // Watch progress + resume (per video, localStorage).
  const posKey = `lostbae-yt-pos:${session.videoId}`;
  const [resumeAt, setResumeAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (isPreview) return;
    const saved = Number(window.localStorage.getItem(posKey));
    if (saved > 15) setResumeAt(saved);
    const id = window.setInterval(() => {
      const t = playerRef.current?.getCurrentTime?.() ?? 0;
      if (t > 5) window.localStorage.setItem(posKey, String(Math.floor(t)));
    }, 5000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resume() {
    if (resumeAt != null) {
      playerRef.current?.seekTo(resumeAt);
      setResumeAt(null);
    }
  }

  function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  // Load persisted notes-open state
  React.useEffect(() => {
    const stored = window.localStorage.getItem(LS_NOTES_OPEN);
    if (stored === "0") setIsNotesOpen(false);
  }, []);

  // Persist notes-open state
  React.useEffect(() => {
    window.localStorage.setItem(LS_NOTES_OPEN, isNotesOpen ? "1" : "0");
  }, [isNotesOpen]);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Track fullscreen state — only our custom fullscreen (when containerRef is the FS element)
  React.useEffect(() => {
    const onChange = () =>
      setIsFullscreen(
        !!document.fullscreenElement &&
        document.fullscreenElement === containerRef.current
      );
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Global T key listener — insert timestamp (skip if focused in input/textarea/contenteditable)
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
    <div className={cn("relative w-full bg-black flex items-center justify-center", isFullscreen ? "h-full" : "aspect-video")}>
      {resumeAt != null && (
        <button
          onClick={resume}
          className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-forest-slate/85 px-3 py-1.5 text-xs font-medium text-white shadow-soft backdrop-blur transition-transform hover:scale-105"
        >
          <SkipForward className="h-3.5 w-3.5" />
          Resume from {fmtTime(resumeAt)}
        </button>
      )}
      {session.sourceType === "external" ? (
        <ExternalVideoPlayer
          ref={playerRef}
          url={session.videoUrl}
          title={session.videoTitle}
          playerType={session.playerType === "direct" ? "direct" : "iframe"}
          className="relative w-full h-full object-contain"
        />
      ) : (
        <YoutubePlayer
          ref={playerRef}
          videoId={session.videoId}
          className="w-full h-full"
        />
      )}
    </div>
  );

  const notesEl = (
    <YoutubeNotesPanel
      sessionId={session.id}
      initialNotes={session.notes}
      videoTitle={session.videoTitle}
      thumbnailUrl={session.thumbnailUrl}
      playerRef={playerRef}
      localStorageKey={localNotesKey}
      isCollapsed={!isNotesOpen}
      onToggleCollapse={() => setIsNotesOpen((o) => !o)}
    />
  );

  if (isMobile) {
    return (
      <div ref={containerRef} className="flex flex-col h-full w-full overflow-auto relative">
        <div className="shrink-0">{playerEl}</div>
        {/* Skip controls */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-canvas/50">
          <SkipButton seconds={-10} playerRef={playerRef} />
          <SkipButton seconds={10} playerRef={playerRef} />
        </div>
        {/* Hide default notes panel in fullscreen — overlay FAB handles it */}
        <div className={`flex-1 min-h-0 ${isFullscreen ? "hidden" : ""}`}>{notesEl}</div>
        <YoutubeFullscreenOverlay
          sessionId={session.id}
          initialNotes={session.notes}
          videoTitle={session.videoTitle}
          thumbnailUrl={session.thumbnailUrl}
          playerRef={playerRef}
          localStorageKey={localNotesKey}
          isFullscreenOverride={isFullscreen}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("h-full relative", isFullscreen && "bg-black")}>
      {/*
        ResizablePanelGroup always gets two children (required by its type).
        In fullscreen we pass split=100 to push the right pane to 0%.
        When notes are collapsed we also pass split=100 to hide the right pane.
      */}
      <ResizablePanelGroup
        defaultSplit={60}
        minSplit={30}
        maxSplit={100}
        split={isFullscreen || !isNotesOpen ? 100 : undefined}
        className={cn(
          "h-full",
          (isFullscreen || !isNotesOpen) && "[&>div[role='separator']]:hidden"
        )}
      >
        {/* Player column */}
        <div className={cn("h-full flex flex-col justify-center gap-2", isFullscreen ? "p-0" : "pt-6 px-4")}>
          {playerEl}
          {/* Controls row: skip buttons + fullscreen toggle */}
          {!isFullscreen && (
            <div className="flex items-center justify-between pr-1">
              <div className="flex items-center gap-1.5">
                <SkipButton seconds={-10} playerRef={playerRef} />
                <SkipButton seconds={10} playerRef={playerRef} />
              </div>
              <FullscreenButton targetRef={containerRef} />
            </div>
          )}
        </div>

        {/* Notes column — visually hidden in fullscreen or when collapsed */}
        <div className={cn(
          "h-full overflow-hidden",
          (isFullscreen || !isNotesOpen) && "invisible pointer-events-none"
        )}>
          {notesEl}
        </div>
      </ResizablePanelGroup>

      {/* Re-open chevron — only visible when notes are collapsed and not in fullscreen */}
      {!isNotesOpen && !isFullscreen && (
        <button
          onClick={() => setIsNotesOpen(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-12 w-6 bg-surface border border-border border-r-0 rounded-l-lg shadow-soft text-mossy-gray hover:text-forest-slate hover:bg-canvas transition-colors"
          title="Expand notes panel"
          aria-label="Expand notes panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Fullscreen notes overlay — FAB + sliding panel, only active in fullscreen */}
      <YoutubeFullscreenOverlay
        sessionId={session.id}
        initialNotes={session.notes}
        videoTitle={session.videoTitle}
        thumbnailUrl={session.thumbnailUrl}
        playerRef={playerRef}
        localStorageKey={localNotesKey}
      />
    </div>
  );
}
