"use client";

import * as React from "react";
import { SkipBack, SkipForward, Play, Pause, Volume2, VolumeX, Heart, ChevronUp } from "lucide-react";
import { useAudioPlayer } from "@/store/audio-player";
import { toggleAudioFavourite } from "@/actions/audio";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function TrackAvatar({ title, thumbnailUrl, size = 40 }: { title: string; thumbnailUrl?: string; size?: number }) {
  if (thumbnailUrl) {
    return (
      <div 
        className="rounded-full overflow-hidden shrink-0 bg-canvas border border-border"
        style={{ width: size, height: size }}
      >
        <img 
          src={thumbnailUrl} 
          alt={title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  const hue = title.charCodeAt(0) % 360;
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-white select-none"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue}, 60%, 45%)`,
        fontSize: size * 0.4,
      }}
    >
      {title.charAt(0).toUpperCase()}
    </div>
  );
}

export { TrackAvatar };

export function MiniPlayer() {
  const currentTrack = useAudioPlayer((s) => s.currentTrack);
  const queue = useAudioPlayer((s) => s.queue);
  const currentIndex = useAudioPlayer((s) => s.currentIndex);
  const isPlaying = useAudioPlayer((s) => s.isPlaying);
  const currentTime = useAudioPlayer((s) => s.currentTime);
  const duration = useAudioPlayer((s) => s.duration);
  const volume = useAudioPlayer((s) => s.volume);
  const isMuted = useAudioPlayer((s) => s.isMuted);

  const { play, pause, togglePlay, next, prev, setCurrentTime, setVolume, toggleMute, setExpanded, setTrackFavourite } =
    useAudioPlayer.getState();

  // Keyboard shortcuts
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }
      if (!useAudioPlayer.getState().currentTrack) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          useAudioPlayer.getState().togglePlay();
          break;
        case "n":
        case "N":
          useAudioPlayer.getState().next();
          break;
        case "p":
        case "P":
          useAudioPlayer.getState().prev();
          break;
        case "m":
        case "M":
          useAudioPlayer.getState().toggleMute();
          break;
        case "f":
        case "F": {
          const track = useAudioPlayer.getState().currentTrack;
          if (track) {
            const newVal = !track.isFavourite;
            useAudioPlayer.getState().setTrackFavourite(track.id, newVal);
            toggleAudioFavourite(track.id).catch(() => {
              useAudioPlayer.getState().setTrackFavourite(track.id, !newVal);
            });
          }
          break;
        }
        case "ArrowLeft":
          e.preventDefault();
          useAudioPlayer.getState().setCurrentTime(
            Math.max(0, useAudioPlayer.getState().currentTime - 10)
          );
          break;
        case "ArrowRight":
          e.preventDefault();
          useAudioPlayer.getState().setCurrentTime(
            Math.min(
              useAudioPlayer.getState().duration,
              useAudioPlayer.getState().currentTime + 10
            )
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          useAudioPlayer.getState().setVolume(
            Math.min(1, useAudioPlayer.getState().volume + 0.1)
          );
          break;
        case "ArrowDown":
          e.preventDefault();
          useAudioPlayer.getState().setVolume(
            Math.max(0, useAudioPlayer.getState().volume - 0.1)
          );
          break;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!currentTrack || queue.length === 0) return null;

  async function handleHeartClick() {
    if (!currentTrack) return;
    const newVal = !currentTrack.isFavourite;
    setTrackFavourite(currentTrack.id, newVal);
    try {
      await toggleAudioFavourite(currentTrack.id);
    } catch {
      setTrackFavourite(currentTrack.id, !newVal);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    setCurrentTime(parseFloat(e.target.value));
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setVolume(parseFloat(e.target.value));
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border shadow-hover">
      {/* Progress bar (full width, thin) */}
      <div className="px-0">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 accent-state-today cursor-pointer"
          aria-label="Seek"
        />
      </div>

      {/* Main row */}
      <div className="flex items-center gap-3 px-4 pb-2 pt-1 h-14">
        {/* Avatar + info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <TrackAvatar title={currentTrack.title} thumbnailUrl={currentTrack.thumbnailUrl} size={36} />
          <div className="min-w-0 overflow-hidden">
            <div className="text-sm font-medium text-forest-slate truncate line-clamp-1">
              {currentTrack.title}
            </div>
            <div className="text-xs text-mossy-gray">
              Track {currentIndex + 1} of {queue.length} · {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => prev()}
            className="p-1.5 rounded-lg hover:bg-canvas text-mossy-gray hover:text-forest-slate transition-colors"
            aria-label="Previous"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={() => togglePlay()}
            className="p-2 rounded-xl bg-state-today text-white hover:bg-state-today/90 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={() => next()}
            className="p-1.5 rounded-lg hover:bg-canvas text-mossy-gray hover:text-forest-slate transition-colors"
            aria-label="Next"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => toggleMute()}
            className="p-1 text-mossy-gray hover:text-forest-slate transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 accent-state-today cursor-pointer"
            aria-label="Volume"
          />
        </div>

        {/* Heart */}
        <button
          onClick={handleHeartClick}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            currentTrack.isFavourite
              ? "text-destructive"
              : "text-mossy-gray hover:text-destructive"
          )}
          aria-label={currentTrack.isFavourite ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart className={cn("h-4 w-4", currentTrack.isFavourite && "fill-current")} />
        </button>

        {/* Expand */}
        <button
          onClick={() => setExpanded(true)}
          className="p-1.5 rounded-lg text-mossy-gray hover:text-forest-slate hover:bg-canvas transition-colors"
          aria-label="Expand player"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
