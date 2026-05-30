"use client";

import * as React from "react";
import { ListPlus, PlusCircle } from "lucide-react";
import { addYoutubeSessionToPlaylist, createYoutubePlaylist } from "@/actions/youtube-playlists";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { YoutubePlaylist } from "@/types";

interface YoutubePlaylistControlsProps {
  sessionId: string;
  initialPlaylists: YoutubePlaylist[];
}

export function YoutubePlaylistControls({ sessionId, initialPlaylists }: YoutubePlaylistControlsProps) {
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

  function handleAdd(playlistId: string) {
    startTransition(async () => {
      const result = await addYoutubeSessionToPlaylist(playlistId, sessionId);
      if (result.success) {
        setPlaylists((prev) =>
          prev.map((playlist) =>
            playlist.id === playlistId && !playlist.sessionIds.includes(sessionId)
              ? { ...playlist, sessionIds: [...playlist.sessionIds, sessionId] }
              : playlist
          )
        );
        toast("Added to playlist", { variant: "success" });
      } else {
        toast(result.error ?? "Failed to add to playlist", { variant: "error" });
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-forest-slate transition-colors hover:bg-canvas disabled:opacity-60"
        >
          <ListPlus className="h-3.5 w-3.5" />
          Playlist
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Add to playlist</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleCreatePlaylist}>
          <PlusCircle className="h-3.5 w-3.5" />
          New playlist
        </DropdownMenuItem>
        {playlists.length > 0 && <DropdownMenuSeparator />}
        {playlists.map((playlist) => {
          const alreadyAdded = playlist.sessionIds.includes(sessionId);
          return (
            <DropdownMenuItem
              key={playlist.id}
              disabled={alreadyAdded}
              onClick={() => handleAdd(playlist.id)}
            >
              <ListPlus className="h-3.5 w-3.5" />
              <span className="min-w-0 flex-1 truncate">{playlist.name}</span>
              {alreadyAdded && <span className="text-[10px] text-mossy-gray">Added</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
