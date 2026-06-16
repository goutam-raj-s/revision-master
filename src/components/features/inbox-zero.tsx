"use client";

import * as React from "react";
import { Check, CalendarDays } from "lucide-react";
import { CompletionScene, getStoredCharacter, type CharacterId } from "./completion-scene";

interface InboxZeroProps {
  nextDate?: string;
  /** Optional flourish: how many reviews were cleared, current streak. */
  clearedToday?: number;
  streak?: number;
}

const CALM_LINES = [
  "Your knowledge is safely scheduled. Take a breath — the right ideas will resurface at exactly the right time.",
  "Nothing left to review. Rest is part of remembering.",
  "Inbox zero for your mind. Well done — come back when it's time.",
  "All clear. Spaced repetition is doing the work in the background now.",
];

export function InboxZero({ nextDate, clearedToday, streak }: InboxZeroProps) {
  // Render a stable line on the server, then randomise after mount. Picking a
  // random line during render differs between server and client and breaks
  // hydration.
  const [line, setLine] = React.useState(CALM_LINES[0]);
  React.useEffect(() => {
    setLine(CALM_LINES[Math.floor(Math.random() * CALM_LINES.length)]);
  }, []);

  // Read the chosen companion, and update live if changed in Settings.
  const [character, setCharacter] = React.useState<CharacterId>("aria");
  React.useEffect(() => {
    setCharacter(getStoredCharacter());
    const onChange = (e: Event) => setCharacter((e as CustomEvent).detail as CharacterId);
    window.addEventListener("lostbae-character-change", onChange);
    return () => window.removeEventListener("lostbae-character-change", onChange);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden px-6 pt-2 pb-14 text-center">
      {/* Soft radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-state-today) 0%, transparent 70%)", opacity: 0.1 }}
      />

      {/* Animated study-desk companion */}
      <CompletionScene characterId={character} className="mb-4 inbox-pop h-64 w-auto max-w-[440px] sm:h-72" />

      <h2 className="mb-2 text-xl font-semibold text-forest-slate animate-slide-up">All caught up for today! 🎉</h2>
      <p className="max-w-sm text-sm leading-relaxed text-mossy-gray animate-slide-up">{line}</p>

      {/* Stats flourish */}
      {(clearedToday || streak) ? (
        <div className="mt-6 flex items-center gap-3">
          {clearedToday ? (
            <div className="flex items-center gap-1.5 rounded-full bg-state-today/10 px-3 py-1.5 text-xs font-medium text-state-today">
              <Check className="h-3.5 w-3.5" />
              {clearedToday} cleared today
            </div>
          ) : null}
          {streak ? (
            <div className="flex items-center gap-1.5 rounded-full bg-state-stale/10 px-3 py-1.5 text-xs font-medium text-state-stale">
              🔥 {streak}-day streak
            </div>
          ) : null}
        </div>
      ) : null}

      {nextDate && (
        <div className="mt-6 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-mossy-gray shadow-card">
          <CalendarDays className="h-4 w-4 text-state-upcoming" />
          <span>Next review: <strong className="font-medium text-forest-slate">{nextDate}</strong></span>
        </div>
      )}
    </div>
  );
}
