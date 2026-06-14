"use client";

import * as React from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export type ThemePref = "light" | "dark" | "system";

const STORAGE_KEY = "lostbae-theme";
const ORDER: ThemePref[] = ["light", "dark", "system"];

export function getStoredTheme(): ThemePref {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem(STORAGE_KEY);
  // Default to dark until the user explicitly chooses light or system.
  return v === "light" || v === "dark" || v === "system" ? v : "dark";
}

export function applyTheme(pref: ThemePref) {
  const dark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(pref: ThemePref) {
  // Store every choice explicitly (including "system") so an unset value
  // always means the light default.
  localStorage.setItem(STORAGE_KEY, pref);
  applyTheme(pref);
}

const ICONS: Record<ThemePref, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

const LABELS: Record<ThemePref, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const [pref, setPref] = React.useState<ThemePref>("dark");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setPref(getStoredTheme());
    setMounted(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    setPref(next);
    setTheme(next);
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-mossy-gray"
      >
        <Monitor className="h-4 w-4" />
        {showLabel && "Theme"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABELS[pref]}. Click to change.`}
      title={`Theme: ${LABELS[pref]}`}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-mossy-gray hover:text-forest-slate hover:bg-accent transition-colors"
    >
      {ICONS[pref]}
      {showLabel && <span>{LABELS[pref]}</span>}
    </button>
  );
}
