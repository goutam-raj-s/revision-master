"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CirclePlay as Youtube, ArrowRight, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractYoutubeVideoId, extractYoutubePlaylistId, parseUrlInput } from "@/lib/youtube-utils";

export function YoutubeUrlForm() {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedUrl = url.trim();
    const playlistId = extractYoutubePlaylistId(trimmedUrl);
    const videoId = extractYoutubeVideoId(trimmedUrl);

    const parsedUrl = parseUrlInput(trimmedUrl);

    if (playlistId && videoId) {
      router.push(`/study/youtube?list=${playlistId}&v=${videoId}`);
    } else if (playlistId) {
      router.push(`/study/youtube?list=${playlistId}`);
    } else if (videoId) {
      router.push(`/study/youtube?v=${videoId}`);
    } else if (!parsedUrl) {
      setError("Please enter a valid URL");
    } else {
      router.push(`/study/youtube?u=${encodeURIComponent(parsedUrl.toString())}`);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
          <Youtube className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-forest-slate">Watch &amp; Annotate</h2>
        <p className="text-sm text-mossy-gray">
          Paste a YouTube or course video URL to start a study session with timestamped notes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="yt-url">Video URL</Label>
          <Input
            id="yt-url"
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            placeholder="https://youtu.be/... or https://www.airtribe.live/..."
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button type="submit" disabled={!url.trim()} className="w-full gap-2">
          Start Session
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-xs text-mossy-gray text-center">
        <Link2 className="inline h-3.5 w-3.5 align-[-2px]" /> Supports YouTube links, direct video files, and course pages
      </p>
    </div>
  );
}
