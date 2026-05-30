"use client";

import * as React from "react";
import { ExternalLink, PanelTopOpen, RefreshCw } from "lucide-react";
import type { YoutubePlayerHandle } from "./youtube-player";

interface ExternalVideoPlayerProps {
  url: string;
  title: string;
  playerType: "direct" | "iframe";
  className?: string;
}

function getHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Original site";
  }
}

export const ExternalVideoPlayer = React.forwardRef<YoutubePlayerHandle, ExternalVideoPlayerProps>(
  ({ url, title, playerType, className }, ref) => {
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
    const loadedAtRef = React.useRef<number | null>(null);
    const [frameKey, setFrameKey] = React.useState(0);
    const host = getHost(url);

    function openFirstPartyWindow() {
      window.open(
        url,
        "external-video-first-party",
        "popup=yes,width=1180,height=760,noopener,noreferrer"
      );
    }

    React.useImperativeHandle(ref, () => ({
      getCurrentTime: () => {
        if (playerType === "direct") return videoRef.current?.currentTime ?? 0;
        if (!loadedAtRef.current) return 0;
        return Math.max(0, (Date.now() - loadedAtRef.current) / 1000);
      },
      seekTo: (seconds: number) => {
        if (playerType === "direct" && videoRef.current) {
          videoRef.current.currentTime = seconds;
        }
      },
      getPlayerState: () => {
        if (playerType !== "direct") return -1;
        const video = videoRef.current;
        if (!video) return -1;
        return video.paused ? 2 : 1;
      },
    }), [playerType]);

    if (playerType === "direct") {
      return (
        <video
          ref={videoRef}
          className={className}
          src={url}
          title={title}
          controls
          playsInline
          preload="metadata"
        />
      );
    }

    return (
      <div className={className}>
        <iframe
          key={frameKey}
          ref={iframeRef}
          src={url}
          title={title}
          className="h-full w-full border-0 bg-black"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-read; clipboard-write"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => {
            loadedAtRef.current = Date.now();
          }}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg border border-white/15 bg-black/70 px-2 py-1.5 text-xs text-white shadow-hover backdrop-blur">
          <span className="max-w-[180px] truncate">{host}</span>
          <button
            type="button"
            onClick={openFirstPartyWindow}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-white/15"
            aria-label="Open in first-party window"
            title="Open in first-party window"
          >
            <PanelTopOpen className="h-3.5 w-3.5" />
            <span>First-party</span>
          </button>
          <button
            type="button"
            onClick={() => setFrameKey((key) => key + 1)}
            className="rounded-md p-1 hover:bg-white/15"
            aria-label="Reload embedded page"
            title="Reload"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-1 hover:bg-white/15"
            aria-label="Open original page"
            title="Open original"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }
);

ExternalVideoPlayer.displayName = "ExternalVideoPlayer";
