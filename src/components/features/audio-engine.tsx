"use client";

import * as React from "react";
import { useAudioPlayer } from "@/store/audio-player";
import { toast } from "@/components/ui/toast";
import { recordPlay } from "@/actions/audio";

export function AudioEngine() {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const prevTrackId = React.useRef<string | null>(null);
  const prevIsPlaying = React.useRef<boolean>(false);

  const currentTrack = useAudioPlayer((s) => s.currentTrack);
  const isPlaying = useAudioPlayer((s) => s.isPlaying);
  const volume = useAudioPlayer((s) => s.volume);
  const isMuted = useAudioPlayer((s) => s.isMuted);
  const speed = useAudioPlayer((s) => s.speed);
  const currentTime = useAudioPlayer((s) => s.currentTime);
  const sleepTimerEndsAt = useAudioPlayer((s) => s.sleepTimerEndsAt);

  const setCurrentTime = useAudioPlayer((s) => s.setCurrentTime);
  const setDuration = useAudioPlayer((s) => s.setDuration);
  const next = useAudioPlayer((s) => s.next);
  const pause = useAudioPlayer((s) => s.pause);
  const handleError = useAudioPlayer((s) => s.handleError);

  // Track seeking from outside: detect when store currentTime changes but audio currentTime differs significantly
  const lastStoreTime = React.useRef<number>(0);
  const isSeekingFromOutside = React.useRef<boolean>(false);

  // When track changes, update src and play
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrack) {
      audio.pause();
      audio.src = "";
      prevTrackId.current = null;
      return;
    }
    if (currentTrack.id !== prevTrackId.current) {
      // Cancel any pending playback before switching src
      audio.pause();
      audio.src = currentTrack.url;
      audio.load();
      prevTrackId.current = currentTrack.id;
      // recordPlay is fire-and-forget — errors silently ignored
      recordPlay(currentTrack.id).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // When isPlaying changes
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying !== prevIsPlaying.current) {
      prevIsPlaying.current = isPlaying;
      if (isPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  // Volume / mute
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Speed
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed]);

  // Seek from outside (store currentTime changes that are user-initiated seeks)
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const diff = Math.abs(currentTime - lastStoreTime.current);
    // Only seek if the change is large (user dragged scrubber) or it was flagged
    if (diff > 1.5 && !isSeekingFromOutside.current) {
      isSeekingFromOutside.current = true;
      audio.currentTime = currentTime;
      isSeekingFromOutside.current = false;
    }
    lastStoreTime.current = currentTime;
  }, [currentTime]);

  // Sleep timer
  React.useEffect(() => {
    if (!sleepTimerEndsAt) return;
    const remaining = sleepTimerEndsAt - Date.now();
    if (remaining <= 0) {
      pause();
      toast("Sleep timer ended", { variant: "default" });
      useAudioPlayer.getState().setSleepTimer(null);
      return;
    }
    const id = setTimeout(() => {
      pause();
      toast("Sleep timer ended", { variant: "default" });
      useAudioPlayer.getState().setSleepTimer(null);
    }, remaining);
    return () => clearTimeout(id);
  }, [sleepTimerEndsAt, pause]);

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    lastStoreTime.current = audio.currentTime;
    setCurrentTime(audio.currentTime);
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
    audio.playbackRate = speed;
    audio.volume = isMuted ? 0 : volume;
    if (isPlaying) audio.play().catch(() => {});
  }

  function handleEnded() {
    next();
  }

  function handleAudioError() {
    toast("Track unavailable", { variant: "error", description: "Skipping to next track…" });
    handleError();
  }

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      className="hidden"
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      onError={handleAudioError}
    />
  );
}
