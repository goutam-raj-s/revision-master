"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Music } from "lucide-react";

const APP_ROUTE_PREFIXES = [
  "/dashboard", "/documents", "/study", "/terminology", "/collections",
  "/posts", "/stats", "/settings", "/video", "/admin",
];

const FocusMusicPanel = dynamic(
  () => import("@/components/features/focus-music-panel").then((mod) => mod.FocusMusicPanel),
  { ssr: false }
);

export function FocusMusicPlayer() {
  const pathname = usePathname();
  const onAppRoute = APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  const [loaded, setLoaded] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);

  if (!loaded && !onAppRoute) return null;

  return loaded ? (
    <FocusMusicPanel visible={onAppRoute || playing} onActiveChange={setPlaying} />
  ) : (
    <div className="fixed bottom-4 left-4 z-[60] print:hidden">
      <button
        onClick={() => setLoaded(true)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-mossy-gray shadow-hover transition-colors hover:bg-canvas"
        aria-label="Focus music"
        title="Focus music"
      >
        <Music className="h-5 w-5" />
      </button>
    </div>
  );
}
