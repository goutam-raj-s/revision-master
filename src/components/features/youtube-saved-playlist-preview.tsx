"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ListVideo, PlayCircle, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  renameYoutubePlaylist,
  deleteYoutubePlaylist,
  removeYoutubeSessionFromPlaylist,
} from "@/actions/youtube-playlists";
import { toast } from "@/components/ui/toast";
import { YoutubeShareButton } from "@/components/features/youtube-share-button";
import type { YoutubePlaylist, YoutubePlaylistItem } from "@/types";

function itemHref(item: YoutubePlaylistItem, playlistId: string): string {
  if (item.sourceType === "external") {
    return `/study/youtube?u=${encodeURIComponent(item.videoUrl)}&yp=${playlistId}`;
  }
  return `/study/youtube?v=${item.videoId}&yp=${playlistId}`;
}

export function YoutubeSavedPlaylistPreview({ playlist: initialPlaylist }: { playlist: YoutubePlaylist }) {
  const router = useRouter();
  const [playlist, setPlaylist] = React.useState(initialPlaylist);
  const [isPending, startTransition] = React.useTransition();

  function handleRename() {
    const newName = prompt("New playlist name:", playlist.name);
    if (!newName?.trim() || newName.trim() === playlist.name) return;
    startTransition(async () => {
      const result = await renameYoutubePlaylist(playlist.id, newName);
      if (result.success) {
        setPlaylist((p) => ({ ...p, name: newName.trim() }));
        toast("Playlist renamed", { variant: "success" });
      } else {
        toast(result.error ?? "Failed to rename", { variant: "error" });
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete playlist "${playlist.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteYoutubePlaylist(playlist.id);
      if (result.success) {
        toast("Playlist deleted", { variant: "success" });
        router.push("/study/youtube");
      } else {
        toast(result.error ?? "Failed to delete", { variant: "error" });
      }
    });
  }

  function handleRemoveVideo(item: YoutubePlaylistItem) {
    startTransition(async () => {
      const result = await removeYoutubeSessionFromPlaylist(playlist.id, item.sessionId);
      if (result.success) {
        setPlaylist((p) => ({
          ...p,
          items: p.items.filter((i) => i.sessionId !== item.sessionId),
          sessionIds: p.sessionIds.filter((id) => id !== item.sessionId),
        }));
        toast("Removed from playlist", { variant: "success" });
      } else {
        toast(result.error ?? "Failed to remove", { variant: "error" });
      }
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-canvas">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-serif font-bold text-forest-slate truncate">
              {playlist.name}
            </h2>
            <p className="text-sm text-mossy-gray mt-1">
              {playlist.items.length} saved video{playlist.items.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <YoutubeShareButton resourceType="playlist" resourceId={playlist.id} title={playlist.name} />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRename}
              disabled={isPending}
              className="gap-1.5 text-xs text-mossy-gray hover:text-forest-slate"
              title="Rename playlist"
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete playlist"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
            <Button variant="outline" asChild>
              <Link href="/study/youtube" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                All Playlists
              </Link>
            </Button>
          </div>
        </div>

        {playlist.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/70 px-4 py-14 text-center">
            <ListVideo className="mx-auto mb-2 h-8 w-8 text-mossy-gray/40" />
            <p className="text-sm font-medium text-forest-slate">No videos in this playlist yet</p>
            <p className="mt-1 text-xs text-mossy-gray">Open a YouTube study session and add it from the Playlist menu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlist.items.map((item) => (
              <div key={item.sessionId} className="group relative block space-y-3">
                <Link href={itemHref(item, playlist.id)} className="block">
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
                {/* Remove video button */}
                <button
                  onClick={() => handleRemoveVideo(item)}
                  disabled={isPending}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100 disabled:opacity-40"
                  title="Remove from playlist"
                  aria-label="Remove from playlist"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
