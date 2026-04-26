"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleYoutubeBookmark } from "@/actions/youtube-bookmarks";
import { cn } from "@/lib/utils";

interface YoutubeBookmarkToggleProps {
  youtubeId: string;
  type: "video" | "playlist";
  title: string;
  thumbnailUrl: string;
  initialIsBookmarked: boolean;
}

export function YoutubeBookmarkToggle({
  youtubeId,
  type,
  title,
  thumbnailUrl,
  initialIsBookmarked,
}: YoutubeBookmarkToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);

  const handleToggle = () => {
    // Optimistic update
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);

    startTransition(async () => {
      const result = await toggleYoutubeBookmark(youtubeId, type, title, thumbnailUrl);
      if (!result.success) {
        // Revert on error
        setIsBookmarked(!nextState);
      } else if (result.success && result.data) {
        setIsBookmarked(result.data.isBookmarked);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "h-8 w-8 rounded-full transition-colors",
        isBookmarked 
          ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50" 
          : "text-mossy-gray hover:text-forest-slate hover:bg-canvas"
      )}
      title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
    >
      <Star className={cn("h-4 w-4", isBookmarked && "fill-current")} />
      <span className="sr-only">{isBookmarked ? "Remove Bookmark" : "Bookmark"}</span>
    </Button>
  );
}
