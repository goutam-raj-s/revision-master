"use client";

import * as React from "react";
import { Play, GripVertical, Trash2, X } from "lucide-react";
import { useAudioPlayer } from "@/store/audio-player";
import { removeFromPlaylist, reorderPlaylist, deletePlaylist } from "@/actions/audio";
import { TrackAvatar } from "./mini-player";
import { toAudioTrack } from "./track-card";
import { toast } from "@/components/ui/toast";
import { getYoutubeThumbnail } from "@/lib/youtube-utils";
import type { Playlist, Document } from "@/types";

interface PlaylistPanelProps {
  playlist: Playlist;
  tracks: Document[];
  onClose: () => void;
  onPlaylistDeleted: (id: string) => void;
  onTrackRemoved: (playlistId: string, trackId: string) => void;
  onReordered: (playlistId: string, newOrder: string[]) => void;
}

export function PlaylistPanel({
  playlist,
  tracks,
  onClose,
  onPlaylistDeleted,
  onTrackRemoved,
  onReordered,
}: PlaylistPanelProps) {
  const [orderedTracks, setOrderedTracks] = React.useState<Document[]>(tracks);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const store = useAudioPlayer.getState();

  // Sync if tracks prop changes
  React.useEffect(() => {
    setOrderedTracks(tracks);
  }, [tracks]);

  function handleDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === toIndex) return;
    const newTracks = [...orderedTracks];
    const [moved] = newTracks.splice(dragIndex, 1);
    newTracks.splice(toIndex, 0, moved);
    setOrderedTracks(newTracks);
    setDragIndex(null);
    const newIds = newTracks.map((t) => t.id);
    onReordered(playlist.id, newIds);
    const result = await reorderPlaylist(playlist.id, newIds);
    if (!result.success) {
      toast("Failed to reorder playlist", { variant: "error" });
      setOrderedTracks(tracks);
    }
  }

  async function handleRemove(trackId: string) {
    setOrderedTracks((prev) => prev.filter((t) => t.id !== trackId));
    onTrackRemoved(playlist.id, trackId);
    const result = await removeFromPlaylist(playlist.id, trackId);
    if (!result.success) {
      toast("Failed to remove track", { variant: "error" });
      setOrderedTracks(tracks);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete playlist "${playlist.name}"?`)) return;
    const result = await deletePlaylist(playlist.id);
    if (result.success) {
      onPlaylistDeleted(playlist.id);
    } else {
      toast("Failed to delete playlist", { variant: "error" });
    }
  }

  function handlePlayAll() {
    if (orderedTracks.length === 0) return;
    store.playNow(orderedTracks.map(toAudioTrack));
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-forest-slate">{playlist.name}</h3>
          <p className="text-xs text-mossy-gray">{orderedTracks.length} tracks</p>
        </div>
        <div className="flex items-center gap-2">
          {orderedTracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-state-today text-white hover:bg-state-today/90 transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              Play All
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-mossy-gray hover:text-destructive hover:bg-destructive/5 transition-colors"
            aria-label="Delete playlist"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mossy-gray hover:text-forest-slate hover:bg-canvas transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {orderedTracks.length === 0 ? (
        <p className="text-sm text-mossy-gray text-center py-6">No tracks in this playlist.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {orderedTracks.map((track, idx) => (
            <li
              key={track.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-canvas group transition-colors cursor-pointer"
              onClick={() => store.playNow(orderedTracks.map(toAudioTrack), idx)}
            >
              <GripVertical className="h-4 w-4 text-mossy-gray shrink-0 cursor-grab" />
              <span className="text-xs text-mossy-gray w-5 shrink-0">{idx + 1}</span>
              <TrackAvatar 
                title={track.title} 
                thumbnailUrl={getYoutubeThumbnail(track.fileUrl || track.url)} 
                size={28} 
              />
              <span className="flex-1 text-sm text-forest-slate truncate">{track.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(track.id); }}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 text-mossy-gray hover:text-destructive transition-all"
                aria-label="Remove from playlist"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
