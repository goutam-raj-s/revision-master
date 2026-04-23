"use client";

import * as React from "react";
import { Search, Music, PlusCircle } from "lucide-react";
import { TrackCard, toAudioTrack } from "./track-card";
import { PlaylistPanel } from "./playlist-panel";
import { useAudioPlayer } from "@/store/audio-player";
import { createPlaylist, addToPlaylist } from "@/actions/audio";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Document, Playlist } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddAudioForm } from "./add-audio-form";

type Tab = "tracks" | "playlists" | "favourites" | "recent";
type SortKey = "recent" | "title" | "plays" | "duration";
type RevFilter = "all" | "today" | "2days" | "3days";

function sortDocs(docs: Document[], sort: SortKey): Document[] {
  const arr = [...docs];
  switch (sort) {
    case "title":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "plays":
      return arr.sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));
    case "recent":
    default:
      return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

interface MusicLibraryClientProps {
  initialDocs: Document[];
  initialPlaylists: Playlist[];
}

export function MusicLibraryClient({ initialDocs, initialPlaylists }: MusicLibraryClientProps) {
  const [tab, setTab] = React.useState<Tab>("tracks");
  const [docs, setDocs] = React.useState<Document[]>(initialDocs);
  const [playlists, setPlaylists] = React.useState<Playlist[]>(initialPlaylists);
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("recent");
  const [revFilter, setRevFilter] = React.useState<RevFilter>("all");
  const [activePlaylistId, setActivePlaylistId] = React.useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const store = useAudioPlayer.getState();

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) ?? null;
  const playlistTracks = activePlaylist
    ? activePlaylist.trackIds.map((id) => docs.find((d) => d.id === id)).filter(Boolean) as Document[]
    : [];

  function getVisibleDocs(): Document[] {
    let base: Document[];
    if (tab === "favourites") base = docs.filter((d) => d.isFavourite);
    else if (tab === "recent")
      base = docs
        .filter((d) => d.lastPlayedAt)
        .sort((a, b) => new Date(b.lastPlayedAt!).getTime() - new Date(a.lastPlayedAt!).getTime());
    else base = sortDocs(docs, sort);

    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((d) => d.title.toLowerCase().includes(q));
    }

    if (revFilter !== "all" && (tab === "tracks" || tab === "favourites")) {
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      if (revFilter === "2days") {
        todayEnd.setDate(todayEnd.getDate() + 2);
      } else if (revFilter === "3days") {
        todayEnd.setDate(todayEnd.getDate() + 3);
      }

      base = base.filter((d) => {
        if (!d.nextReviewDate) return false;
        return new Date(d.nextReviewDate) <= todayEnd;
      });
    }

    return base;
  }

  async function handleNewPlaylist() {
    const name = prompt("Playlist name:");
    if (!name) return;
    const result = await createPlaylist(name);
    if (result.success && result.data) {
      setPlaylists((prev) => [result.data!, ...prev]);
      toast("Playlist created", { variant: "success" });
    } else {
      toast(result.error ?? "Failed to create playlist", { variant: "error" });
    }
  }

  async function handleAddToPlaylist(playlistId: string, docId: string) {
    const result = await addToPlaylist(playlistId, docId);
    if (result.success) {
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId && !p.trackIds.includes(docId)
            ? { ...p, trackIds: [...p.trackIds, docId] }
            : p
        )
      );
      toast("Added to playlist", { variant: "success" });
    } else {
      toast(result.error ?? "Failed", { variant: "error" });
    }
  }

  function handleFavouriteToggled(id: string, val: boolean) {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, isFavourite: val } : d)));
  }

  function handleDeleted(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  const visibleDocs = getVisibleDocs();

  const tabs: { key: Tab; label: string }[] = [
    { key: "tracks", label: "All Tracks" },
    { key: "playlists", label: "Playlists" },
    { key: "favourites", label: "Favourites" },
    { key: "recent", label: "Recently Played" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setActivePlaylistId(null); }}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                tab === t.key
                  ? "border-state-today text-state-today"
                  : "border-transparent text-mossy-gray hover:text-forest-slate"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="ml-auto mb-2 pr-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-forest-slate text-white hover:bg-forest-slate/90 transition-colors shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Add Track
          </button>
        </div>
      </div>

      {/* Playlists tab */}
      {tab === "playlists" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-forest-slate">Your Playlists</h2>
            <button
              onClick={handleNewPlaylist}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border border-border hover:bg-canvas transition-colors text-forest-slate"
            >
              <PlusCircle className="h-4 w-4" />
              New Playlist
            </button>
          </div>

          {activePlaylist ? (
            <PlaylistPanel
              playlist={activePlaylist}
              tracks={playlistTracks}
              onClose={() => setActivePlaylistId(null)}
              onPlaylistDeleted={(id) => {
                setPlaylists((prev) => prev.filter((p) => p.id !== id));
                setActivePlaylistId(null);
              }}
              onTrackRemoved={(playlistId, trackId) => {
                setPlaylists((prev) =>
                  prev.map((p) =>
                    p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) } : p
                  )
                );
              }}
              onReordered={(playlistId, newOrder) => {
                setPlaylists((prev) =>
                  prev.map((p) => (p.id === playlistId ? { ...p, trackIds: newOrder } : p))
                );
              }}
            />
          ) : playlists.length === 0 ? (
            <div className="text-center py-16">
              <Music className="h-12 w-12 text-mossy-gray/30 mx-auto mb-3" />
              <p className="text-mossy-gray">No playlists yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {playlists.map((pl) => {
                const firstTrack = pl.trackIds[0] ? docs.find((d) => d.id === pl.trackIds[0]) : undefined;
                return (
                  <div
                    key={pl.id}
                    onClick={() => setActivePlaylistId(pl.id)}
                    className="bg-surface border border-border rounded-2xl p-4 cursor-pointer hover:shadow-hover transition-shadow group"
                  >
                    <div className="w-full aspect-square rounded-xl bg-canvas flex items-center justify-center mb-3 overflow-hidden">
                      {firstTrack ? (
                        <div
                          className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                          style={{ background: `hsl(${firstTrack.title.charCodeAt(0) % 360}, 60%, 45%)` }}
                        >
                          {firstTrack.title.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <Music className="h-10 w-10 text-mossy-gray/30" />
                      )}
                    </div>
                    <p className="font-medium text-forest-slate text-sm truncate">{pl.name}</p>
                    <p className="text-xs text-mossy-gray">{pl.trackIds.length} tracks</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Track-based tabs */}
      {tab !== "playlists" && (
        <div>
          {/* Search + sort */}
          {(tab === "tracks" || tab === "favourites") && (
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mossy-gray" />
                <input
                  type="text"
                  placeholder="Search tracks…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-state-today/40 text-forest-slate"
                />
              </div>
              {tab === "tracks" && (
                <div className="flex gap-2">
                  <select
                    value={revFilter}
                    onChange={(e) => setRevFilter(e.target.value as RevFilter)}
                    className="text-sm border border-border rounded-xl px-3 py-2 bg-surface text-forest-slate focus:outline-none focus:ring-2 focus:ring-state-today/40"
                    aria-label="Filter Due"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Due Today</option>
                    <option value="2days">Due In 2 Days</option>
                    <option value="3days">Due In 3 Days</option>
                  </select>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="text-sm border border-border rounded-xl px-3 py-2 bg-surface text-forest-slate focus:outline-none focus:ring-2 focus:ring-state-today/40"
                    aria-label="Sort"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="title">Title A–Z</option>
                    <option value="plays">Most Played</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Play all */}
          {visibleDocs.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => store.playNow(visibleDocs.map(toAudioTrack))}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-state-today text-white hover:bg-state-today/90 transition-colors"
              >
                <Music className="h-4 w-4" />
                Play All
              </button>
              <span className="text-sm text-mossy-gray">{visibleDocs.length} tracks</span>
            </div>
          )}

          {visibleDocs.length === 0 ? (
            <div className="text-center py-16">
              <Music className="h-12 w-12 text-mossy-gray/30 mx-auto mb-3" />
              <p className="text-mossy-gray mb-4">
                {tab === "favourites"
                  ? "No favourites yet. Click the heart on any track."
                  : tab === "recent"
                  ? "No recently played tracks."
                  : "No audio tracks found. Upload some audio files or add a YouTube track."}
              </p>
              {tab === "tracks" && (
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-state-today hover:underline"
                >
                  <PlusCircle className="h-4 w-4" /> Add your first track
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {visibleDocs.map((doc) => (
                <TrackCard
                  key={doc.id}
                  track={doc}
                  playlists={playlists}
                  onFavouriteToggled={handleFavouriteToggled}
                  onDeleted={handleDeleted}
                  onAddToPlaylist={handleAddToPlaylist}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Audio Track</DialogTitle>
            <DialogDescription>
              Add a track from a YouTube URL or upload an audio file.
            </DialogDescription>
          </DialogHeader>
          <AddAudioForm onSuccess={() => {
            setIsAddOpen(false);
            // Typically we'd revalidate path to fetch new tracks, but since we are in client,
            // the form will be rehydrated or we can let the page reload to see it.
            // A hard refresh is fine for now.
            window.location.reload();
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
