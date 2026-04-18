"use client";

import * as React from "react";
import { Play, Heart, MoreVertical, PlayCircle, ListEnd, ListPlus, Trash2 } from "lucide-react";
import { useAudioPlayer, type AudioTrack } from "@/store/audio-player";
import { toggleAudioFavourite, recordPlay } from "@/actions/audio";
import { deleteDocumentAction } from "@/actions/documents";
import { TrackAvatar } from "./mini-player";
import { cn } from "@/lib/utils";
import type { Document, Playlist } from "@/types";

export function toAudioTrack(doc: Document): AudioTrack {
  return {
    id: doc.id,
    title: doc.title,
    url: doc.fileUrl!,
    isFavourite: doc.isFavourite ?? false,
    playCount: doc.playCount ?? 0,
  };
}

interface TrackCardProps {
  track: Document;
  playlists?: Playlist[];
  onFavouriteToggled?: (id: string, val: boolean) => void;
  onDeleted?: (id: string) => void;
  onAddToPlaylist?: (playlistId: string, docId: string) => void;
}

export function TrackCard({ track, playlists = [], onFavouriteToggled, onDeleted, onAddToPlaylist }: TrackCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const store = useAudioPlayer.getState();

  const isFavourite = useAudioPlayer((s) =>
    s.queue.find((t) => t.id === track.id)?.isFavourite ?? track.isFavourite ?? false
  );

  // Close menu on outside click
  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowPlaylistSubmenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showMenu]);

  async function handlePlay() {
    store.playNow(toAudioTrack(track));
    await recordPlay(track.id);
  }

  async function handleFavourite() {
    const newVal = !track.isFavourite;
    store.setTrackFavourite(track.id, newVal);
    onFavouriteToggled?.(track.id, newVal);
    try {
      await toggleAudioFavourite(track.id);
    } catch {
      store.setTrackFavourite(track.id, !newVal);
      onFavouriteToggled?.(track.id, !newVal);
    }
  }

  async function handleDelete() {
    setShowMenu(false);
    await deleteDocumentAction(track.id);
    onDeleted?.(track.id);
  }

  const displayFav = (isFavourite as boolean) ?? track.isFavourite ?? false;

  return (
    <div className="relative group bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-hover transition-shadow">
      {/* Play overlay */}
      <div
        className="cursor-pointer"
        onClick={handlePlay}
      >
        <div className="relative p-4 flex flex-col items-center gap-3">
          <div className="relative">
            <TrackAvatar title={track.title} size={64} />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          <div className="w-full text-center">
            <p className="text-sm font-medium text-forest-slate line-clamp-2 leading-tight">{track.title}</p>
            {(track.playCount ?? 0) > 0 && (
              <span className="inline-block mt-1 text-xs bg-state-today/10 text-state-today px-2 py-0.5 rounded-full">
                {track.playCount} plays
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between px-3 pb-3">
        <button
          onClick={handleFavourite}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            displayFav ? "text-destructive" : "text-mossy-gray hover:text-destructive"
          )}
          aria-label={displayFav ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart className={cn("h-4 w-4", displayFav && "fill-current")} />
        </button>

        {/* Context menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
            className="p-1.5 rounded-lg text-mossy-gray hover:text-forest-slate hover:bg-canvas transition-colors"
            aria-label="Track options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute bottom-full right-0 mb-1 bg-surface border border-border rounded-2xl shadow-hover z-20 min-w-[170px] py-1 text-sm">
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-canvas text-forest-slate transition-colors"
                onClick={() => { setShowMenu(false); store.playNow(toAudioTrack(track)); recordPlay(track.id); }}
              >
                <PlayCircle className="h-4 w-4" />
                Play Now
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-canvas text-forest-slate transition-colors"
                onClick={() => { setShowMenu(false); store.playNext(toAudioTrack(track)); }}
              >
                <Play className="h-4 w-4" />
                Play Next
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-canvas text-forest-slate transition-colors"
                onClick={() => { setShowMenu(false); store.addToQueue(toAudioTrack(track)); }}
              >
                <ListEnd className="h-4 w-4" />
                Add to Queue
              </button>

              {playlists.length > 0 && (
                <div className="relative">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-canvas text-forest-slate transition-colors"
                    onClick={() => setShowPlaylistSubmenu((v) => !v)}
                  >
                    <ListPlus className="h-4 w-4" />
                    Add to Playlist
                  </button>
                  {showPlaylistSubmenu && (
                    <div className="absolute bottom-0 right-full mr-1 bg-surface border border-border rounded-2xl shadow-hover z-30 min-w-[150px] py-1">
                      {playlists.map((pl) => (
                        <button
                          key={pl.id}
                          className="block w-full text-left px-3 py-2 hover:bg-canvas text-sm text-forest-slate transition-colors"
                          onClick={() => {
                            setShowMenu(false);
                            setShowPlaylistSubmenu(false);
                            onAddToPlaylist?.(pl.id, track.id);
                          }}
                        >
                          {pl.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-canvas transition-colors"
                onClick={async () => { setShowMenu(false); await handleFavourite(); }}
              >
                <Heart className={cn("h-4 w-4", displayFav && "fill-current text-destructive")} />
                {displayFav ? "Unfavourite" : "Favourite"}
              </button>

              <div className="border-t border-border my-1" />
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-canvas text-destructive transition-colors"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
