"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PlayCircle, AlertTriangle, ExternalLink, RefreshCw, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { removePlaylistVideo, refreshPlaylistVideos } from "@/actions/youtube-bookmarks";

interface PlaylistPreviewProps {
  playlist: {
    playlistId: string;
    title: string;
    videos: {
      videoId: string;
      title: string;
      thumbnailUrl: string;
    }[];
  };
  /** When this playlist is bookmarked, enable refresh + per-video remove. */
  bookmarked?: boolean;
}

export function PlaylistPreview({ playlist, bookmarked = false }: PlaylistPreviewProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function handleRefresh() {
    setBusy(true);
    const res = await refreshPlaylistVideos(playlist.playlistId);
    setBusy(false);
    if (res.success && res.data) {
      toast(`Saved ${res.data.count} videos`, { variant: "success" });
      router.refresh();
    } else {
      toast(res.error ?? "Refresh failed", { variant: "error" });
    }
  }

  async function handleRemove(videoId: string) {
    const res = await removePlaylistVideo(playlist.playlistId, videoId);
    if (res.success) {
      toast("Removed from saved playlist");
      router.refresh();
    } else {
      toast(res.error ?? "Could not remove", { variant: "error" });
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-canvas">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-forest-slate">
              {playlist.title}
            </h2>
            <p className="text-sm text-mossy-gray mt-1">
              {playlist.videos.length} videos{bookmarked ? " · saved" : " available"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {bookmarked && (
              <Button variant="outline" onClick={handleRefresh} disabled={busy} className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh from YouTube
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/study/youtube" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Different Link
              </Link>
            </Button>
          </div>
        </div>

        {playlist.videos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-state-stale/10">
              <AlertTriangle className="h-6 w-6 text-state-stale" />
            </div>
            <div>
              <p className="text-sm font-medium text-forest-slate">Couldn&apos;t load this playlist&apos;s videos</p>
              <p className="mt-1 text-xs text-mossy-gray">
                YouTube may be rate-limiting us. You can retry, or open it directly on YouTube.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/study/youtube?list=${playlist.playlistId}`} className="gap-2">
                  Retry
                </Link>
              </Button>
              <Button asChild>
                <a
                  href={`https://www.youtube.com/playlist?list=${playlist.playlistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open on YouTube
                </a>
              </Button>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlist.videos.map((video) => (
            <div key={video.videoId} className="group relative space-y-3">
              {bookmarked && (
                <button
                  onClick={() => handleRemove(video.videoId)}
                  title="Remove from saved playlist"
                  className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-forest-slate/70 text-white opacity-0 backdrop-blur transition-opacity hover:bg-destructive group-hover:opacity-100"
                  aria-label="Remove video"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <Link
                href={`/study/youtube?list=${playlist.playlistId}&v=${video.videoId}`}
                className="block space-y-3"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border shadow-sm group-hover:shadow-md transition-all">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <PlayCircle className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <PlayCircle className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-forest-slate line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
              </Link>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
