"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, RotateCcw, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Term } from "@/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Full-screen flashcard practice over the user's terms: term → reveal → rate. */
export function TerminologyPractice({ terms, onClose }: { terms: Term[]; onClose: () => void }) {
  const deck = React.useMemo(() => shuffle(terms), [terms]);
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [results, setResults] = React.useState<{ easy: number; okay: number; struggled: number }>({
    easy: 0,
    okay: 0,
    struggled: 0,
  });

  const current = deck[index];
  const done = index >= deck.length;

  const next = React.useCallback(
    (rating?: "easy" | "okay" | "struggled") => {
      if (rating) setResults((r) => ({ ...r, [rating]: r[rating] + 1 }));
      setRevealed(false);
      setIndex((i) => i + 1);
    },
    []
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === " " && !revealed && !done) {
        e.preventDefault();
        setRevealed(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, done, onClose]);

  // Lock background scroll and only render on the client (portal target).
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-canvas">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-sm font-medium text-forest-slate">
          Practice <span className="text-mossy-gray">· {Math.min(index + 1, deck.length)} / {deck.length}</span>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-mossy-gray hover:bg-surface hover:text-forest-slate" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-1 w-full bg-border">
        <div className="h-full bg-state-today transition-all" style={{ width: `${(index / Math.max(deck.length, 1)) * 100}%` }} />
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        {done ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-state-today/10">
              <Check className="h-8 w-8 text-state-today" />
            </div>
            <h2 className="text-2xl font-bold text-forest-slate">Deck complete! 🎉</h2>
            <p className="mt-2 text-sm text-mossy-gray">
              😎 {results.easy} easy · 🙂 {results.okay} okay · 😣 {results.struggled} struggled
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" onClick={() => { setIndex(0); setRevealed(false); setResults({ easy: 0, okay: 0, struggled: 0 }); }} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Again
              </Button>
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-card sm:p-12">
              <p className="text-xs font-semibold uppercase tracking-wide text-mossy-gray">Term</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-forest-slate sm:text-3xl">{current.term}</h2>

              {revealed ? (
                <div className="mt-6 border-t border-border pt-6 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-mossy-gray">Definition</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-forest-slate">{current.definition}</p>
                  {current.example && (
                    <p className="mt-3 text-sm text-mossy-gray"><span className="font-medium text-forest-slate">e.g. </span>{current.example}</p>
                  )}
                  {current.relatedTerms && current.relatedTerms.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {current.relatedTerms.map((r) => (
                        <span key={r} className="rounded-md bg-muted px-2 py-0.5 text-xs text-mossy-gray">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Button onClick={() => setRevealed(true)} variant="outline" className="mt-8 gap-2">
                  <Eye className="h-4 w-4" /> Reveal <span className="text-xs text-mossy-gray">(Space)</span>
                </Button>
              )}
            </div>

            {revealed && (
              <div className="mt-5 grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => next("struggled")} className="flex-col gap-0.5 h-auto py-2.5 text-state-stale hover:bg-state-stale/10">
                  <span className="text-lg leading-none">😣</span>
                  <span className="text-xs">Struggled</span>
                </Button>
                <Button variant="outline" onClick={() => next("okay")} className="flex-col gap-0.5 h-auto py-2.5 text-state-upcoming hover:bg-state-upcoming/10">
                  <span className="text-lg leading-none">🙂</span>
                  <span className="text-xs">Okay</span>
                </Button>
                <Button variant="outline" onClick={() => next("easy")} className="flex-col gap-0.5 h-auto py-2.5 text-state-today hover:bg-state-today/10">
                  <span className="text-lg leading-none">😎</span>
                  <span className="text-xs">Easy</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
