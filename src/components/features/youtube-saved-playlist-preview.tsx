import Link from "next/link";
import { ArrowLeft, ListVideo, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { YoutubePlaylist, YoutubePlaylistItem } from "@/types";

function itemHref(item: YoutubePlaylistItem): string {
  if (item.sourceType === "external") {
    return `/study/youtube?u=${encodeURIComponent(item.videoUrl)}`;
  }
  return `/study/youtube?v=${item.videoId}`;
}

export function YoutubeSavedPlaylistPreview({ playlist }: { playlist: YoutubePlaylist }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-canvas">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-serif font-bold text-forest-slate truncate">
              {playlist.name}
            </h2>
            <p className="text-sm text-mossy-gray mt-1">
              {playlist.items.length} saved video{playlist.items.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/study/youtube" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              All Playlists
            </Link>
          </Button>
        </div>

        {playlist.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white/70 px-4 py-14 text-center">
            <ListVideo className="mx-auto mb-2 h-8 w-8 text-mossy-gray/40" />
            <p className="text-sm font-medium text-forest-slate">No videos in this playlist yet</p>
            <p className="mt-1 text-xs text-mossy-gray">Open a YouTube study session and add it from the Playlist menu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlist.items.map((item) => (
              <Link
                key={item.sessionId}
                href={itemHref(item)}
                className="group block space-y-3"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border shadow-sm group-hover:shadow-md transition-all">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
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
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
