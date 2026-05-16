"use client";

import * as React from "react";
import { Search, Loader2, Music, Plus, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchYoutubeVideos } from "@/actions/youtube";
import { addFileDocumentAction } from "@/actions/documents";
import { toast } from "@/components/ui/toast";
import { useAudioPlayer } from "@/store/audio-player";
import { toAudioTrack } from "./track-card";
import { isYoutubeUrl, extractYoutubeVideoId } from "@/lib/youtube-utils";
import { fetchYoutubeMetadata } from "@/actions/youtube";

type YoutubeSearchProps = {
  onSuccess: () => void;
};

export function YoutubeSearch({ onSuccess }: YoutubeSearchProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [addingId, setAddingId] = React.useState<string | null>(null);
  const store = useAudioPlayer.getState();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      if (isYoutubeUrl(query)) {
        const metadata = await fetchYoutubeMetadata(query);
        setResults([{
          videoId: metadata.videoId,
          title: metadata.title,
          thumbnailUrl: metadata.thumbnailUrl,
          duration: "Video Link"
        }]);
      } else {
        const data = await searchYoutubeVideos(query);
        setResults(data);
      }
    } catch {
      toast("Search failed", { variant: "error" });
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(video: any) {
    setAddingId(video.videoId);
    try {
      const result = await addFileDocumentAction({
        title: video.title,
        fileUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        mediaType: "audio",
        tags: ["youtube"],
        difficulty: "medium",
        delayDays: 2,
      });

      if (result.success) {
        toast("Track added to library", { variant: "success" });
        onSuccess();
      } else {
        toast(result.error || "Failed to add track", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setAddingId(null);
    }
  }

  function handlePlay(video: any) {
    store.playNow({
      id: `temp-${video.videoId}`,
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      thumbnailUrl: video.thumbnailUrl,
      isFavourite: false,
      playCount: 0,
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mossy-gray" />
          <Input
            placeholder="Search YouTube for music..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={searching || !query.trim()}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {results.map((video) => (
          <div
            key={video.videoId}
            className="flex items-center gap-3 p-2 rounded-xl border border-border hover:bg-canvas transition-colors group"
          >
            <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-black/70 text-[10px] text-white px-1 font-mono">
                {video.duration}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-forest-slate truncate leading-tight">
                {video.title}
              </p>
              <p className="text-xs text-mossy-gray mt-0.5">YouTube Video</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handlePlay(video)}
                className="h-8 w-8 p-0 rounded-full hover:bg-state-today hover:text-white transition-colors"
                title="Play Now"
              >
                <Play className="h-4 w-4 fill-current" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAdd(video)}
                disabled={addingId !== null}
                className="h-8 w-8 p-0 rounded-full hover:bg-canvas text-forest-slate transition-colors"
                title="Add to Library"
              >
                {addingId === video.videoId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}

        {!searching && results.length === 0 && query && (
          <p className="text-center py-8 text-sm text-mossy-gray">
            No results found. Try a different search.
          </p>
        )}
      </div>
    </div>
  );
}
