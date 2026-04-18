"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const LS_KEY_AUDIO = "rm-audio-speed";
const LS_KEY_VIDEO = "rm-video-speed";

interface SpeedSelectorProps {
  mediaRef: React.RefObject<HTMLAudioElement | HTMLVideoElement | null>;
  storageKey: string;
}

function SpeedSelector({ mediaRef, storageKey }: SpeedSelectorProps) {
  const [speed, setSpeed] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) return parseFloat(saved);
    }
    return 1;
  });

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = parseFloat(e.target.value);
    setSpeed(val);
    localStorage.setItem(storageKey, String(val));
    if (mediaRef.current) {
      mediaRef.current.playbackRate = val;
    }
  }

  // Apply saved speed when media loads
  function handleCanPlay() {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = speed;
    }
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-xs text-mossy-gray font-medium">Speed:</span>
      <select
        value={speed}
        onChange={handleChange}
        className="text-xs border border-border rounded-lg px-2 py-1 bg-surface text-forest-slate focus:outline-none focus:ring-2 focus:ring-state-today/40"
        aria-label="Playback speed"
      >
        {SPEED_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>
    </div>
  );
}

export function AudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [speed, setSpeed] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LS_KEY_AUDIO);
      if (saved) return parseFloat(saved);
    }
    return 1;
  });

  function handleSpeedChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = parseFloat(e.target.value);
    setSpeed(val);
    localStorage.setItem(LS_KEY_AUDIO, String(val));
    if (audioRef.current) audioRef.current.playbackRate = val;
  }

  function handleCanPlay() {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
      <div className="text-center">
        <p className="text-xs text-mossy-gray uppercase tracking-wide mb-1">Audio</p>
        <h2 className="font-serif font-medium text-forest-slate text-lg">{title}</h2>
      </div>
      <audio
        ref={audioRef}
        controls
        className="w-full max-w-xl"
        onCanPlay={handleCanPlay}
        aria-label={title}
      >
        <source src={src} />
        Your browser does not support the audio element.
      </audio>
      <div className="flex items-center gap-2">
        <span className="text-xs text-mossy-gray font-medium">Speed:</span>
        <select
          value={speed}
          onChange={handleSpeedChange}
          className="text-xs border border-border rounded-lg px-2 py-1 bg-surface text-forest-slate focus:outline-none focus:ring-2 focus:ring-state-today/40"
          aria-label="Playback speed"
        >
          {SPEED_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function VideoPlayer({ src, title }: { src: string; title: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LS_KEY_VIDEO);
      if (saved) return parseFloat(saved);
    }
    return 1;
  });

  function handleSpeedChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = parseFloat(e.target.value);
    setSpeed(val);
    localStorage.setItem(LS_KEY_VIDEO, String(val));
    if (videoRef.current) videoRef.current.playbackRate = val;
  }

  function handleCanPlay() {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }

  return (
    <div className="flex flex-col items-start justify-start h-full p-4 gap-3">
      <video
        ref={videoRef}
        controls
        className="w-full max-h-[60vh] rounded-xl bg-black"
        onCanPlay={handleCanPlay}
        aria-label={title}
      >
        <source src={src} />
        Your browser does not support the video element.
      </video>
      <div className="flex items-center gap-2">
        <span className="text-xs text-mossy-gray font-medium">Speed:</span>
        <select
          value={speed}
          onChange={handleSpeedChange}
          className="text-xs border border-border rounded-lg px-2 py-1 bg-surface text-forest-slate focus:outline-none focus:ring-2 focus:ring-state-today/40"
          aria-label="Playback speed"
        >
          {SPEED_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function DocumentDownload({ src, title }: { src: string; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
      <p className="text-mossy-gray text-sm">This document cannot be previewed inline.</p>
      <Button asChild>
        <a href={src} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download {title}
        </a>
      </Button>
    </div>
  );
}
