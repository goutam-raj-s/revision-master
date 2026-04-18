"use client";

import * as React from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Upload,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SKIP_SECONDS = 10;
const ACCEPTED_TYPES =
  "video/mp4,video/webm,video/ogg,video/x-matroska,video/avi,video/x-msvideo,video/quicktime,video/x-ms-wmv,.mkv,.mp4,.webm,.avi,.mov,.wmv,.ogv,.3gp";

function formatTime(secs: number): string {
  if (!isFinite(secs)) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoPlayerClient() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const controlsTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [src, setSrc] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string>("");
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const [buffered, setBuffered] = React.useState(0);

  React.useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src);
    };
  }, [src]);

  React.useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!src) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(SKIP_SECONDS);
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-SKIP_SECONDS);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, volume, playing]);

  const resetControlsTimer = React.useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const openFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (src) URL.revokeObjectURL(src);
    const url = URL.createObjectURL(file);
    setSrc(url);
    setFileName(file.name);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    // auto-play after a tick so the video element picks up the new src
    setTimeout(() => videoRef.current?.play(), 100);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const skip = (secs: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + secs));
  };

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    if (val > 0) {
      v.muted = false;
      setMuted(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.currentTime = val;
    setCurrentTime(val);
  };

  const setPlaybackSpeed = (s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
  };

  const onProgress = () => {
    const v = videoRef.current;
    if (!v || !v.buffered.length) return;
    setBuffered(v.buffered.end(v.buffered.length - 1));
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* File picker */}
      {!src && (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/30 py-20 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">Open a video file</p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports MP4, MKV, WebM, AVI, MOV and more
            </p>
          </div>
          <Button variant="outline" size="sm" type="button">
            Browse files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={openFile}
          />
        </div>
      )}

      {/* Player */}
      {src && (
        <div
          ref={containerRef}
          className={cn(
            "relative bg-black overflow-hidden select-none",
            fullscreen ? "fixed inset-0 z-50" : "w-full rounded-2xl"
          )}
          style={{ aspectRatio: fullscreen ? undefined : "16/9" }}
          onMouseMove={resetControlsTimer}
          onMouseLeave={() => playing && setShowControls(false)}
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-contain"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={() =>
              setCurrentTime(videoRef.current?.currentTime ?? 0)
            }
            onDurationChange={() =>
              setDuration(videoRef.current?.duration ?? 0)
            }
            onProgress={onProgress}
            onVolumeChange={() => {
              const v = videoRef.current;
              if (!v) return;
              setVolume(v.volume);
              setMuted(v.muted);
            }}
            onEnded={() => setPlaying(false)}
          />

          {/* Controls overlay */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-end transition-opacity duration-300",
              showControls || !playing
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Bottom controls */}
            <div className="relative z-10 flex flex-col gap-3 px-4 pb-4">
              {/* File name */}
              <p className="text-white/60 text-xs truncate px-0.5">{fileName}</p>

              {/* Seek bar */}
              <div className="relative h-1 w-full rounded-full bg-white/20 group/seek">
                {/* Buffered */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/25 pointer-events-none"
                  style={{ width: `${bufferedPct}%` }}
                />
                {/* Played */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white pointer-events-none"
                  style={{ width: `${progressPct}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={currentTime}
                  onChange={seek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ height: "100%" }}
                />
              </div>

              {/* Buttons row */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/20 h-8 w-8 shrink-0"
                  onClick={() => skip(-SKIP_SECONDS)}
                  title="Back 10s (←)"
                  type="button"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/20 h-9 w-9 shrink-0"
                  onClick={togglePlay}
                  title={playing ? "Pause (Space)" : "Play (Space)"}
                  type="button"
                >
                  {playing ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/20 h-8 w-8 shrink-0"
                  onClick={() => skip(SKIP_SECONDS)}
                  title="Forward 10s (→)"
                  type="button"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/20 h-8 w-8 shrink-0"
                  onClick={toggleMute}
                  title="Mute (M)"
                  type="button"
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                {/* Volume slider */}
                <div className="w-20 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={muted ? 0 : volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>

                {/* Time */}
                <span className="text-white text-xs tabular-nums ml-1 shrink-0">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <div className="flex-1" />

                {/* Speed */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:text-white hover:bg-white/20 h-8 px-2 text-xs gap-1 shrink-0"
                      type="button"
                    >
                      <Settings2 className="h-3 w-3" />
                      {speed}x
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[6rem]">
                    {SPEEDS.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        className={cn("justify-center", s === speed && "font-bold")}
                        onClick={() => setPlaybackSpeed(s)}
                      >
                        {s}x
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Open another file */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/20 h-8 px-2 text-xs shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Open file"
                  type="button"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Open
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={openFile}
                />

                {/* Fullscreen */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/20 h-8 w-8 shrink-0"
                  onClick={toggleFullscreen}
                  title="Fullscreen (F)"
                  type="button"
                >
                  {fullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {src && (
        <p className="text-xs text-muted-foreground text-center">
          Space / K — play/pause · ← → — skip 10s · ↑ ↓ — volume · M — mute · F — fullscreen
        </p>
      )}
    </div>
  );
}
