"use client";

import { useEffect, useImperativeHandle, forwardRef, useRef } from "react";

export interface YoutubePlayerHandle {
  getCurrentTime(): number;
  seekTo(seconds: number): void;
  getPlayerState(): number;
}

interface Props {
  videoId: string;
  className?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YoutubePlayer = forwardRef<YoutubePlayerHandle, Props>(
  ({ videoId, className }, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null);
    const containerId = `yt-player-${videoId}`;

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
      seekTo: (s: number) => playerRef.current?.seekTo?.(s, true),
      getPlayerState: () => playerRef.current?.getPlayerState?.() ?? -1,
    }));

    useEffect(() => {
      let destroyed = false;

      const initPlayer = () => {
        if (destroyed) return;
        playerRef.current = new window.YT.Player(containerId, {
          videoId,
          playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
        });
      };

      if (window.YT?.loaded) {
        initPlayer();
      } else {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          initPlayer();
        };
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement("script");
          tag.src = "https://www.youtube.com/iframe_api";
          document.head.appendChild(tag);
        }
      }

      return () => {
        destroyed = true;
        playerRef.current?.destroy?.();
        playerRef.current = null;
      };
    }, [videoId, containerId]);

    return <div id={containerId} className={className} />;
  }
);

YoutubePlayer.displayName = "YoutubePlayer";
export default YoutubePlayer;
