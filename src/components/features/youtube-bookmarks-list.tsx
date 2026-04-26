"use client";

import Link from "next/link";
import { PlayCircle, ListVideo, Star } from "lucide-react";
import type { YoutubeBookmark } from "@/types";

export function YoutubeBookmarksList({ bookmarks }: { bookmarks: YoutubeBookmark[] }) {
  if (bookmarks.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Star className="h-4 w-4 text-yellow-500 fill-current" />
        <h3 className="text-sm font-semibold text-forest-slate uppercase tracking-wider">Bookmarked</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookmarks.map((bookmark) => {
          const href = bookmark.type === "playlist" 
            ? `/study/youtube?list=${bookmark.youtubeId}` 
            : `/study/youtube?v=${bookmark.youtubeId}`;
            
          return (
            <Link
              key={bookmark.id}
              href={href}
              className="group flex gap-3 p-3 bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-all"
            >
              <div className="relative h-16 w-28 shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50">
                {bookmark.thumbnailUrl ? (
                  <img
                    src={bookmark.thumbnailUrl}
                    alt={bookmark.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    {bookmark.type === "playlist" ? (
                      <ListVideo className="h-6 w-6 text-muted-foreground/50" />
                    ) : (
                      <PlayCircle className="h-6 w-6 text-muted-foreground/50" />
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  {bookmark.type === "playlist" ? (
                     <ListVideo className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  ) : (
                     <PlayCircle className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="text-sm font-medium text-forest-slate line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {bookmark.title}
                </h4>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {bookmark.type === "playlist" ? (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-600 border border-blue-100">
                      Playlist
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-red-50 text-red-600 border border-red-100">
                      Video
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
