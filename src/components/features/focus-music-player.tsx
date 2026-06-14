"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Music, Play, Pause, X, Volume2 } from "lucide-react";

// Routes where the focus-music launcher is shown. The component is mounted once
// at the app root and never unmounts, so playback continues across page/tab
// navigations; we only hide the *button* outside the authenticated app.
const APP_ROUTE_PREFIXES = [
  "/dashboard", "/documents", "/study", "/terminology", "/collections",
  "/posts", "/stats", "/settings", "/video", "/admin",
];

/**
 * Ambient focus-music player for the reading view — a fixed set of soundscapes
 * synthesised live with the Web Audio API. No audio files are bundled or
 * streamed, so there are no broken links, bandwidth, or licensing concerns.
 * "Fixed (not any)" tracks, exactly like Notion's reading music.
 */

type TrackId = "chimes" | "ocean" | "forest" | "drone";

interface Track {
  id: TrackId;
  label: string;
  emoji: string;
  /** Builds the audio graph; returns a cleanup fn. */
  build: (ctx: AudioContext, out: GainNode) => () => void;
}

// ── Noise buffer helper ──────────────────────────────────────────────────────
function makeNoiseBuffer(ctx: AudioContext, kind: "white" | "brown" = "white") {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === "brown") {
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = w;
    }
  }
  return buffer;
}

function noiseSource(ctx: AudioContext, kind: "white" | "brown" = "white") {
  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(ctx, kind);
  src.loop = true;
  return src;
}

const TRACKS: Track[] = [
  {
    id: "chimes",
    label: "Chimes",
    emoji: "🎐",
    build: (ctx, out) => {
      const stops: Array<() => void> = [];
      let stopped = false;

      // Warm low pad underneath the chimes.
      const pad = ctx.createOscillator();
      pad.type = "sine";
      pad.frequency.value = 146.83; // D3
      const padGain = ctx.createGain();
      padGain.gain.value = 0.06;
      pad.connect(padGain).connect(out);
      pad.start();
      stops.push(() => pad.stop());

      // Soft, randomly-timed wind-chime tones on a pentatonic scale (no clashing).
      const scale = [587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66]; // D5–D6 pentatonic
      function ding() {
        if (stopped) return;
        const freq = scale[Math.floor(Math.random() * scale.length)];
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        const t = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
        osc.connect(g).connect(out);
        osc.start(t);
        osc.stop(t + 2.5);
        timer = window.setTimeout(ding, 900 + Math.random() * 2600);
      }
      let timer = window.setTimeout(ding, 400);
      stops.push(() => clearTimeout(timer));

      return () => {
        stopped = true;
        stops.forEach((s) => s());
      };
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    emoji: "🌊",
    build: (ctx, out) => {
      const src = noiseSource(ctx, "brown");
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 700;
      const swell = ctx.createGain();
      swell.gain.value = 0.3;
      // Slow LFO to make waves rise and fall.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.1;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.25;
      lfo.connect(lfoGain).connect(swell.gain);
      src.connect(lp).connect(swell).connect(out);
      src.start();
      lfo.start();
      return () => { src.stop(); lfo.stop(); };
    },
  },
  {
    id: "forest",
    label: "Forest",
    emoji: "🌲",
    build: (ctx, out) => {
      // Soft wind bed.
      const src = noiseSource(ctx, "brown");
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1200;
      const bed = ctx.createGain();
      bed.gain.value = 0.18;
      src.connect(lp).connect(bed).connect(out);
      src.start();
      // Occasional bird chirps via short oscillator blips.
      let stopped = false;
      function chirp() {
        if (stopped) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const base = 1800 + Math.random() * 1600;
        osc.frequency.setValueAtTime(base, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(base * 1.4, ctx.currentTime + 0.08);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        osc.connect(g).connect(out);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        timer = window.setTimeout(chirp, 1200 + Math.random() * 3500);
      }
      let timer = window.setTimeout(chirp, 800);
      return () => { stopped = true; clearTimeout(timer); src.stop(); };
    },
  },
  {
    id: "drone",
    label: "Deep Focus",
    emoji: "🧘",
    build: (ctx, out) => {
      // Low warm pad: two detuned sines + filtered brown noise.
      const freqs = [110, 110 * 1.5, 110 * 2];
      const oscs = freqs.map((f, i) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        o.detune.value = i * 4;
        const g = ctx.createGain();
        g.gain.value = i === 0 ? 0.12 : 0.05;
        o.connect(g).connect(out);
        o.start();
        return o;
      });
      const src = noiseSource(ctx, "brown");
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 400;
      const ng = ctx.createGain();
      ng.gain.value = 0.08;
      src.connect(lp).connect(ng).connect(out);
      src.start();
      return () => { oscs.forEach((o) => o.stop()); src.stop(); };
    },
  },
];

export function FocusMusicPlayer() {
  const pathname = usePathname();
  const onAppRoute = APP_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<TrackId | null>(null);
  const [volume, setVolume] = React.useState(0.5);

  const ctxRef = React.useRef<AudioContext | null>(null);
  const masterRef = React.useRef<GainNode | null>(null);
  const cleanupRef = React.useRef<(() => void) | null>(null);

  const stop = React.useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setActive(null);
  }, []);

  const playTrack = React.useCallback(
    (id: TrackId) => {
      if (typeof window === "undefined") return;
      if (!ctxRef.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const master = ctx.createGain();
        master.gain.value = volume;
        master.connect(ctx.destination);
        ctxRef.current = ctx;
        masterRef.current = master;
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      // Tear down any current track first.
      cleanupRef.current?.();
      const track = TRACKS.find((t) => t.id === id)!;
      cleanupRef.current = track.build(ctx, masterRef.current!);
      setActive(id);
    },
    [volume]
  );

  // Keep master gain in sync with the volume slider.
  React.useEffect(() => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.05);
    }
  }, [volume]);

  // Tear everything down on unmount (leaving the reading view).
  React.useEffect(() => {
    return () => {
      cleanupRef.current?.();
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  // Outside the app, hide the widget — unless music is playing, so the user can
  // still pause it. The component stays mounted either way, so audio persists.
  if (!onAppRoute && !active) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[60] print:hidden">
      {open ? (
        <div className="w-64 rounded-2xl border border-border bg-surface p-3 shadow-hover">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-forest-slate">
              <Music className="h-4 w-4 text-state-today" /> Focus music
            </span>
            <button onClick={() => setOpen(false)} className="p-1 text-mossy-gray hover:text-forest-slate" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {TRACKS.map((t) => {
              const on = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => (on ? stop() : playTrack(t.id))}
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                    on
                      ? "border-state-today bg-state-today/10 text-state-today"
                      : "border-border text-mossy-gray hover:bg-canvas hover:text-forest-slate"
                  }`}
                  aria-pressed={on}
                >
                  <span className="text-base leading-none">{t.emoji}</span>
                  <span className="flex-1 text-left">{t.label}</span>
                  {on ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-mossy-gray" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-state-today"
              aria-label="Volume"
            />
          </div>
          <p className="mt-2 text-[10px] leading-snug text-mossy-gray">
            Generated locally — ambient soundscapes to help you focus while reading.
          </p>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-hover transition-colors hover:bg-canvas ${
            active ? "text-state-today" : "text-mossy-gray"
          }`}
          aria-label="Focus music"
          title="Focus music"
        >
          <Music className={`h-5 w-5 ${active ? "animate-pulse" : ""}`} />
        </button>
      )}
    </div>
  );
}
