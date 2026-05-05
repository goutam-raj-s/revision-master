"use client";

import * as React from "react";
import {
  X,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  Shuffle,
  Repeat,
  Repeat1,
  Clock,
  GripVertical,
  Trash2,
  Search,
} from "lucide-react";
import { useAudioPlayer } from "@/store/audio-player";
import { toggleAudioFavourite } from "@/actions/audio";
import { TrackAvatar } from "./mini-player";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { YoutubeSearch } from "./youtube-search";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SLEEP_PRESETS = [15, 30, 45, 60, 90];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ExpandedPlayer() {
  const isExpanded = useAudioPlayer((s) => s.isExpanded);
  const currentTrack = useAudioPlayer((s) => s.currentTrack);
  const queue = useAudioPlayer((s) => s.queue);
  const currentIndex = useAudioPlayer((s) => s.currentIndex);
  const isPlaying = useAudioPlayer((s) => s.isPlaying);
  const currentTime = useAudioPlayer((s) => s.currentTime);
  const duration = useAudioPlayer((s) => s.duration);
  const volume = useAudioPlayer((s) => s.volume);
  const isMuted = useAudioPlayer((s) => s.isMuted);
  const speed = useAudioPlayer((s) => s.speed);
  const repeatMode = useAudioPlayer((s) => s.repeatMode);
  const shuffleMode = useAudioPlayer((s) => s.shuffleMode);
  const sleepTimerEndsAt = useAudioPlayer((s) => s.sleepTimerEndsAt);

  const [showSleepPicker, setShowSleepPicker] = React.useState(false);
  const [countdown, setCountdown] = React.useState<string | null>(null);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const store = useAudioPlayer.getState();

  // Sleep timer countdown
  React.useEffect(() => {
    if (!sleepTimerEndsAt) {
      setCountdown(null);
      return;
    }
    const update = () => {
      const remaining = sleepTimerEndsAt - Date.now();
      if (remaining <= 0) {
        setCountdown("00:00");
        return;
      }
      setCountdown(formatCountdown(remaining));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [sleepTimerEndsAt]);

  if (!isExpanded || !currentTrack) return null;

  async function handleHeartClick() {
    if (!currentTrack) return;
    const newVal = !currentTrack.isFavourite;
    store.setTrackFavourite(currentTrack.id, newVal);
    try {
      await toggleAudioFavourite(currentTrack.id);
    } catch {
      store.setTrackFavourite(currentTrack.id, !newVal);
    }
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === toIndex) return;
    if (toIndex < 0 || toIndex >= store.queue.length) return;
    store.reorderQueue(dragIndex, toIndex);
    setDragIndex(null);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        {/* Close button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => store.setExpanded(false)}
            className="p-2 rounded-xl hover:bg-canvas text-mossy-gray hover:text-forest-slate transition-colors"
            aria-label="Close expanded player"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left column */}
          <div className="flex flex-col items-center gap-4 md:w-64 shrink-0">
            <TrackAvatar title={currentTrack.title} thumbnailUrl={currentTrack.thumbnailUrl} size={120} />
            <div className="text-center">
              <h2 className="font-semibold text-forest-slate text-lg leading-tight">{currentTrack.title}</h2>
            </div>
            {/* Tags would go here if available */}
            <button
              onClick={handleHeartClick}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-sm",
                currentTrack.isFavourite
                  ? "border-destructive/30 text-destructive bg-destructive/5"
                  : "border-border text-mossy-gray hover:border-destructive/30 hover:text-destructive"
              )}
              aria-label={currentTrack.isFavourite ? "Remove from favourites" : "Add to favourites"}
            >
              <Heart className={cn("h-4 w-4", currentTrack.isFavourite && "fill-current")} />
              {currentTrack.isFavourite ? "Favourited" : "Favourite"}
            </button>
          </div>

          {/* Right column */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Progress */}
            <div>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={currentTime}
                onChange={(e) => store.setCurrentTime(parseFloat(e.target.value))}
                className="w-full accent-state-today cursor-pointer"
                aria-label="Seek"
              />
              <div className="flex justify-between text-xs text-mossy-gray mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Play controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => store.prev()}
                className="p-2 rounded-xl hover:bg-canvas text-mossy-gray hover:text-forest-slate transition-colors"
                aria-label="Previous"
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                onClick={() => store.togglePlay()}
                className="p-3 rounded-2xl bg-state-today text-white hover:bg-state-today/90 transition-colors shadow-md"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              <button
                onClick={() => store.next()}
                className="p-2 rounded-xl hover:bg-canvas text-mossy-gray hover:text-forest-slate transition-colors"
                aria-label="Next"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>

            {/* Secondary controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Shuffle */}
              <button
                onClick={() => store.toggleShuffle()}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  shuffleMode ? "text-state-today bg-state-today/10" : "text-mossy-gray hover:text-forest-slate hover:bg-canvas"
                )}
                aria-label="Toggle shuffle"
              >
                <Shuffle className="h-4 w-4" />
              </button>

              {/* Repeat */}
              <button
                onClick={() => store.cycleRepeat()}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  repeatMode !== "off" ? "text-state-today bg-state-today/10" : "text-mossy-gray hover:text-forest-slate hover:bg-canvas"
                )}
                aria-label="Cycle repeat mode"
              >
                {repeatMode === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
              </button>

              {/* Speed */}
              <select
                value={speed}
                onChange={(e) => store.setSpeed(parseFloat(e.target.value))}
                className="text-xs border border-border rounded-lg px-2 py-1.5 bg-surface text-forest-slate focus:outline-none focus:ring-2 focus:ring-state-today/40"
                aria-label="Playback speed"
              >
                {SPEED_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}×</option>
                ))}
              </select>

              {/* Sleep timer */}
              <div className="relative">
                <button
                  onClick={() => setShowSleepPicker((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 p-2 rounded-lg transition-colors text-xs",
                    sleepTimerEndsAt ? "text-state-today bg-state-today/10" : "text-mossy-gray hover:text-forest-slate hover:bg-canvas"
                  )}
                  aria-label="Sleep timer"
                >
                  <Clock className="h-4 w-4" />
                  {countdown && <span className="font-mono">{countdown}</span>}
                </button>
                {showSleepPicker && (
                  <div className="absolute bottom-full left-0 mb-2 bg-surface border border-border rounded-2xl shadow-hover p-3 z-10 min-w-[140px]">
                    <p className="text-xs font-medium text-mossy-gray mb-2">Sleep timer</p>
                    <div className="flex flex-col gap-1">
                      {SLEEP_PRESETS.map((min) => (
                        <button
                          key={min}
                          onClick={() => { store.setSleepTimer(min); setShowSleepPicker(false); }}
                          className="text-left text-sm px-2 py-1 rounded-lg hover:bg-canvas text-forest-slate transition-colors"
                        >
                          {min} min
                        </button>
                      ))}
                      {sleepTimerEndsAt && (
                        <button
                          onClick={() => { store.setSleepTimer(null); setShowSleepPicker(false); }}
                          className="text-left text-sm px-2 py-1 rounded-lg hover:bg-canvas text-destructive transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* YouTube Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-mossy-gray hover:text-forest-slate hover:bg-canvas transition-colors"
                aria-label="Search YouTube"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => store.toggleMute()}
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
                onChange={(e) => store.setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-state-today cursor-pointer"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>

        {/* Up Next */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-forest-slate mb-3">Up Next</h3>
          {queue.length === 0 ? (
            <p className="text-sm text-mossy-gray">Queue is empty.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {queue.map((track, idx) => (
                <li
                  key={`${track.id}-${idx}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer group",
                    idx === currentIndex
                      ? "bg-state-today/10 text-state-today"
                      : "hover:bg-canvas text-forest-slate"
                  )}
                  onClick={() => store.playNow([...queue], idx)}
                >
                  <GripVertical className="h-4 w-4 text-mossy-gray shrink-0 cursor-grab" />
                  <span className="text-xs text-mossy-gray w-5 shrink-0">{idx + 1}</span>
                  <TrackAvatar title={track.title} thumbnailUrl={track.thumbnailUrl} size={28} />
                  <span className="flex-1 text-sm truncate">{track.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.removeFromQueue(idx);
                    }}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 text-mossy-gray hover:text-destructive transition-all"
                    aria-label="Remove from queue"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>YouTube Search</DialogTitle>
            <DialogDescription>
              Search for music on YouTube and add it to your library.
            </DialogDescription>
          </DialogHeader>
          <YoutubeSearch onSuccess={() => {
            setIsSearchOpen(false);
            window.location.reload();
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
