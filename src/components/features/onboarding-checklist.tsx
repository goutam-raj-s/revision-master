"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Circle, X, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OnboardingChecklistProps {
  hasDocs: boolean;
  hasReviewed: boolean;
  hasTerms: boolean;
}

const DISMISS_KEY = "lostbae-onboarding-dismissed";
const GOAL_KEY = "lostbae-daily-goal";

/** Getting-started checklist for new users. Hides itself once complete or dismissed. */
export function OnboardingChecklist({ hasDocs, hasReviewed, hasTerms }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = React.useState(true); // default hidden until mounted
  const [hasGoal, setHasGoal] = React.useState(false);

  React.useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    setHasGoal(Boolean(localStorage.getItem(GOAL_KEY)));
  }, []);

  const steps = [
    { label: "Add your first document", done: hasDocs, href: "/documents/new" },
    { label: "Complete your first review", done: hasReviewed, href: "/dashboard" },
    { label: "Add a glossary term", done: hasTerms, href: "/terminology" },
    { label: "Set a daily goal", done: hasGoal, href: "/dashboard" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  if (dismissed || allDone) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <Card className="relative p-5 shadow-card">
      <button onClick={dismiss} className="absolute right-3 top-3 text-mossy-gray hover:text-forest-slate" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-state-today" />
        <h2 className="text-sm font-semibold text-forest-slate">Get started</h2>
        <span className="text-xs text-mossy-gray">{doneCount} / {steps.length}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full bg-state-today transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ul className="mt-3 space-y-1">
        {steps.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-canvas ${
                s.done ? "text-mossy-gray" : "text-forest-slate"
              }`}
            >
              {s.done ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-state-today text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              ) : (
                <Circle className="h-4 w-4 text-border" />
              )}
              <span className={s.done ? "line-through" : ""}>{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
