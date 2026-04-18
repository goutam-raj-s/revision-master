import { create } from "zustand";

export type RepeatMode = "off" | "all" | "one";

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
  isFavourite: boolean;
  playCount: number;
}

interface AudioPlayerState {
  queue: AudioTrack[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  speed: number;
  repeatMode: RepeatMode;
  shuffleMode: boolean;
  sleepTimerEndsAt: number | null;
  isExpanded: boolean;

  // Derived
  currentTrack: AudioTrack | null;

  // Actions
  playNow: (tracksOrTrack: AudioTrack | AudioTrack[], startIndex?: number) => void;
  playNext: (track: AudioTrack) => void;
  addToQueue: (track: AudioTrack) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setSpeed: (s: number) => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  setSleepTimer: (minutes: number | null) => void;
  setExpanded: (v: boolean) => void;
  setTrackFavourite: (id: string, value: boolean) => void;
  handleError: () => void;
}

function getSavedVolume(): number {
  if (typeof window === "undefined") return 0.8;
  const v = localStorage.getItem("rm-audio-volume");
  if (v !== null) {
    const n = parseFloat(v);
    if (!isNaN(n)) return Math.min(1, Math.max(0, n));
  }
  return 0.8;
}

function getSavedSpeed(): number {
  if (typeof window === "undefined") return 1;
  const s = localStorage.getItem("rm-audio-speed");
  if (s !== null) {
    const n = parseFloat(s);
    if (!isNaN(n)) return n;
  }
  return 1;
}

export const useAudioPlayer = create<AudioPlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: getSavedVolume(),
  isMuted: false,
  speed: getSavedSpeed(),
  repeatMode: "off",
  shuffleMode: false,
  sleepTimerEndsAt: null,
  isExpanded: false,
  currentTrack: null,

  playNow: (tracksOrTrack, startIndex = 0) => {
    const tracks = Array.isArray(tracksOrTrack) ? tracksOrTrack : [tracksOrTrack];
    const idx = Math.min(startIndex, tracks.length - 1);
    set({
      queue: tracks,
      currentIndex: idx,
      currentTrack: tracks[idx] ?? null,
      isPlaying: true,
      currentTime: 0,
    });
  },

  playNext: (track) => {
    const { queue, currentIndex } = get();
    const insertAt = currentIndex + 1;
    const newQueue = [...queue.slice(0, insertAt), track, ...queue.slice(insertAt)];
    set({ queue: newQueue });
  },

  addToQueue: (track) => {
    set((s) => ({ queue: [...s.queue, track] }));
  },

  removeFromQueue: (index) => {
    const { queue, currentIndex } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    let newIndex = currentIndex;
    if (index < currentIndex) newIndex = currentIndex - 1;
    else if (index === currentIndex) newIndex = Math.min(currentIndex, newQueue.length - 1);
    set({
      queue: newQueue,
      currentIndex: newIndex,
      currentTrack: newQueue[newIndex] ?? null,
    });
  },

  reorderQueue: (from, to) => {
    const { queue, currentIndex } = get();
    const newQueue = [...queue];
    const [moved] = newQueue.splice(from, 1);
    newQueue.splice(to, 0, moved);
    let newIndex = currentIndex;
    if (currentIndex === from) newIndex = to;
    else if (from < currentIndex && to >= currentIndex) newIndex = currentIndex - 1;
    else if (from > currentIndex && to <= currentIndex) newIndex = currentIndex + 1;
    set({ queue: newQueue, currentIndex: newIndex, currentTrack: newQueue[newIndex] ?? null });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { queue, currentIndex, repeatMode, shuffleMode } = get();
    if (queue.length === 0) return;

    if (repeatMode === "one") {
      set({ currentTime: 0, isPlaying: true });
      return;
    }

    let nextIndex: number;
    if (shuffleMode && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === "all") {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
          return;
        }
      }
    }

    set({
      currentIndex: nextIndex,
      currentTrack: queue[nextIndex],
      currentTime: 0,
      isPlaying: true,
    });
  },

  prev: () => {
    const { queue, currentIndex, currentTime } = get();
    if (queue.length === 0) return;
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const prevIndex = Math.max(0, currentIndex - 1);
    set({
      currentIndex: prevIndex,
      currentTrack: queue[prevIndex],
      currentTime: 0,
      isPlaying: true,
    });
  },

  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),

  setVolume: (v) => {
    const clamped = Math.min(1, Math.max(0, v));
    if (typeof window !== "undefined") localStorage.setItem("rm-audio-volume", String(clamped));
    set({ volume: clamped, isMuted: false });
  },

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  setSpeed: (s) => {
    if (typeof window !== "undefined") localStorage.setItem("rm-audio-speed", String(s));
    set({ speed: s });
  },

  cycleRepeat: () => {
    const order: RepeatMode[] = ["off", "all", "one"];
    set((s) => {
      const idx = order.indexOf(s.repeatMode);
      return { repeatMode: order[(idx + 1) % order.length] };
    });
  },

  toggleShuffle: () => set((s) => ({ shuffleMode: !s.shuffleMode })),

  setSleepTimer: (minutes) => {
    set({ sleepTimerEndsAt: minutes === null ? null : Date.now() + minutes * 60000 });
  },

  setExpanded: (v) => set({ isExpanded: v }),

  setTrackFavourite: (id, value) => {
    set((s) => ({
      queue: s.queue.map((t) => (t.id === id ? { ...t, isFavourite: value } : t)),
      currentTrack:
        s.currentTrack?.id === id ? { ...s.currentTrack, isFavourite: value } : s.currentTrack,
    }));
  },

  handleError: () => {
    const { queue, currentIndex } = get();
    // auto-advance to next track; if none, stop
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      set({
        currentIndex: nextIndex,
        currentTrack: queue[nextIndex],
        currentTime: 0,
        isPlaying: true,
      });
    } else {
      set({ isPlaying: false });
    }
  },
}));
