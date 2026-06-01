"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ListVideo } from "lucide-react";
import type { YoutubePlaylistItem } from "@/types";

interface YoutubePlaylistNavProps {
  playlistId: string;
  playlistName: string;
  prevItem: YoutubePlaylistItem | null;
  nextItem: YoutubePlaylistItem | null;
  currentIndex: number;
  total: number;
}

function itemHref(item: YoutubePlaylistItem, playlistId: string): string {
  if (item.sourceType === "external") {
    return `/study/youtube?u=${encodeURIComponent(item.videoUrl)}&yp=${playlistId}`;
  }
  return `/study/youtube?v=${item.videoId}&yp=${playlistId}`;
}

export function YoutubePlaylistNav({
  playlistId,
  playlistName,
  prevItem,
  nextItem,
  currentIndex,
  total,
}: YoutubePlaylistNavProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Playlist badge */}
      <Link
        href={`/study/youtube?yp=${playlistId}`}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-mossy-gray hover:text-forest-slate transition-colors"
        title={`Playlist: ${playlistName}`}
      >
        <ListVideo className="h-3 w-3" />
        <span className="max-w-[100px] truncate">{playlistName}</span>
        <span className="text-mossy-gray/60">{currentIndex}/{total}</span>
      </Link>

      {/* Prev */}
      {prevItem ? (
        <Link
          href={itemHref(prevItem, playlistId)}
          className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-mossy-gray hover:bg-canvas hover:text-forest-slate transition-colors"
          title={`Previous: ${prevItem.title}`}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-lg border border-border/40 bg-surface/50 px-2.5 py-1.5 text-xs text-mossy-gray/40 cursor-not-allowed">
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </span>
      )}

      {/* Next */}
      {nextItem ? (
        <Link
          href={itemHref(nextItem, playlistId)}
          className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-mossy-gray hover:bg-canvas hover:text-forest-slate transition-colors"
          title={`Next: ${nextItem.title}`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-lg border border-border/40 bg-surface/50 px-2.5 py-1.5 text-xs text-mossy-gray/40 cursor-not-allowed">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );
}
