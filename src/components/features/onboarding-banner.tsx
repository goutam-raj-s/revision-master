"use client";

import * as React from "react";
import Link from "next/link";
import { X, BookOpen, Brain, BarChart3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    num: "1",
    icon: BookOpen,
    title: "Add a document",
    desc: "Paste a Google Doc link or upload a file to start your library.",
    href: "/documents/new",
    cta: "Add now →",
  },
  {
    num: "2",
    icon: Brain,
    title: "Study it",
    desc: "Open it for review — take notes, add terms, and mark it complete.",
    href: "/documents",
    cta: null,
  },
  {
    num: "3",
    icon: BarChart3,
    title: "Track your progress",
    desc: "lostbae schedules reviews automatically. Come back daily to stay sharp.",
    href: "/dashboard",
    cta: null,
  },
];

const DISMISSED_KEY = "lostbae_onboarding_dismissed";

interface OnboardingBannerProps {
  totalDocs: number;
}

export function OnboardingBanner({ totalDocs }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = React.useState(true); // start dismissed to avoid SSR flicker

  React.useEffect(() => {
    // Only show if user has no docs AND hasn't dismissed before
    if (totalDocs === 0 && !localStorage.getItem(DISMISSED_KEY)) {
      setDismissed(false);
    }
  }, [totalDocs]);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  if (dismissed || totalDocs > 0) return null;

  return (
    <div className="relative rounded-2xl border border-state-today/25 bg-state-today/6 px-6 py-5 mb-2 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-state-today/5 to-transparent pointer-events-none" />

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-mossy-gray hover:text-forest-slate hover:bg-canvas transition-colors"
        aria-label="Dismiss onboarding guide"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-forest-slate">
          Welcome to lostbae 👋
        </h2>
        <p className="text-sm text-mossy-gray mt-0.5">
          Get started in 3 simple steps.
        </p>
      </div>

      {/* Steps */}
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        {STEPS.map((step) => (
          <div
            key={step.num}
            className="flex items-start gap-3 bg-surface/70 rounded-xl px-4 py-3 border border-border"
          >
            <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-state-today text-white text-xs font-bold mt-0.5">
              {step.num}
            </span>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <step.icon className="h-3.5 w-3.5 text-state-today" />
                <span className="text-sm font-medium text-forest-slate">{step.title}</span>
              </div>
              <p className="text-xs text-mossy-gray leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-3">
        <Link href="/documents/new">
          <Button size="sm" className="gap-1.5 rounded-full shadow-soft bouncy-hover">
            Add your first document
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
        <button
          onClick={dismiss}
          className="text-sm text-mossy-gray hover:text-forest-slate transition-colors"
        >
          Got it, I&apos;ll explore on my own →
        </button>
      </div>
    </div>
  );
}
