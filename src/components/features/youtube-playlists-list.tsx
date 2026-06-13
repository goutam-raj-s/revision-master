"use client";

import * as React from "react";
import Link from "next/link";
import { ListVideo, PlayCircle, PlusCircle, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { createYoutubePlaylist, renameYoutubePlaylist, deleteYoutubePlaylist } from "@/actions/youtube-playlists";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { YoutubePlaylist } from "@/types";

export function YoutubePlaylistsList({ initialPlaylists }: { initialPlaylists: YoutubePlaylist[] }) {
  const [playlists, setPlaylists] = React.useState(initialPlaylists);
  const [isPending, startTransition] = React.useTransition();

  function handleCreatePlaylist() {
    const name = prompt("Playlist name:");
    if (!name?.trim()) return;

    startTransition(async () => {
      const result = await createYoutubePlaylist(name);
      if (result.success && result.data) {
        setPlaylists((prev) => [result.data!, ...prev]);
        toast("Playlist created", { variant: "success" });
      } else {
        toast(result.error ?? "Failed to create playlist", { variant: "error" });
      }
    });
  }

  function handleRename(playlist: YoutubePlaylist) {
    const newName = prompt("New playlist name:", playlist.name);
    if (!newName?.trim() || newName.trim() === playlist.name) return;

    startTransition(async () => {
      const result = await renameYoutubePlaylist(playlist.id, newName);
      if (result.success) {
        setPlaylists((prev) =>
          prev.map((p) => (p.id === playlist.id ? { ...p, name: newName.trim() } : p))
        );
        toast("Playlist renamed", { variant: "success" });
      } else {
        toast(result.error ?? "Failed to rename", { variant: "error" });
      }
    });
  }

  function handleDelete(playlist: YoutubePlaylist) {
    if (!confirm(`Delete playlist "${playlist.name}"? This cannot be undone.`)) return;

    startTransition(async () => {
      const result = await deleteYoutubePlaylist(playlist.id);
      if (result.success) {
        setPlaylists((prev) => prev.filter((p) => p.id !== playlist.id));
        toast("Playlist deleted", { variant: "success" });
      } else {
        toast(result.error ?? "Failed to delete", { variant: "error" });
      }
    });
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <ListVideo className="h-4 w-4 text-state-today" />
          <h3 className="text-sm font-semibold text-forest-slate uppercase tracking-wider">Your YouTube Playlists</h3>
        </div>
        <button
          type="button"
          onClick={handleCreatePlaylist}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-forest-slate transition-colors hover:bg-canvas disabled:opacity-60"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          New Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/70 px-4 py-6 text-center">
          <ListVideo className="mx-auto mb-2 h-7 w-7 text-mossy-gray/40" />
          <p className="text-sm font-medium text-forest-slate">No playlists yet</p>
          <p className="mt-1 text-xs text-mossy-gray">Create one here, then add videos from any YouTube study session.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => {
            const firstItem = playlist.items[0];
            return (
              <div key={playlist.id} className="group relative flex gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm transition-all hover:shadow-md">
                <Link href={`/study/youtube?yp=${playlist.id}`} className="flex gap-3 flex-1 min-w-0">
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted">
                    {firstItem?.thumbnailUrl ? (
                      <img
                        src={firstItem.thumbnailUrl}
                        alt={firstItem.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ListVideo className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                      <PlayCircle className="h-6 w-6 text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center pr-6">
                    <h4 className="line-clamp-2 text-sm font-medium leading-tight text-forest-slate transition-colors group-hover:text-primary">
                      {playlist.name}
                    </h4>
                    <p className="mt-1.5 text-xs text-mossy-gray">
                      {playlist.sessionIds.length} video{playlist.sessionIds.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>

                {/* ⋯ menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-mossy-gray opacity-0 transition-opacity hover:bg-canvas hover:text-forest-slate group-hover:opacity-100"
                      onClick={(e) => e.preventDefault()}
                      aria-label="Playlist options"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => handleRename(playlist)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(playlist)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete playlist
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
