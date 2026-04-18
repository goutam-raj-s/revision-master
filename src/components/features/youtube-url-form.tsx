"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CirclePlay as Youtube, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractYoutubeVideoId } from "@/lib/youtube-utils";

export function YoutubeUrlForm() {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const videoId = extractYoutubeVideoId(url.trim());
    if (!videoId) {
      setError("Please enter a valid YouTube URL");
      return;
    }
    router.push(`/study/youtube?v=${videoId}`);
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
          <Youtube className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-forest-slate">Watch &amp; Annotate</h2>
        <p className="text-sm text-mossy-gray">
          Paste a YouTube URL to start a study session with timestamped notes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="yt-url">YouTube URL</Label>
          <Input
            id="yt-url"
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
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
        Supports youtube.com, youtu.be, and embed URLs
      </p>
    </div>
  );
}
