"use client";

import * as React from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  url?: string;
  text?: string;
  size?: "icon" | "sm";
  className?: string;
}

function resolveShareUrl(url?: string) {
  if (!url) return window.location.href;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
}

export function ShareButton({ title, url, text, size = "icon", className }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleShare(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const shareUrl = resolveShareUrl(url);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast("Link copied", { variant: "success" });
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast("Could not share this item", { variant: "error" });
      }
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === "icon" ? "icon-sm" : "sm"}
      onClick={handleShare}
      className={cn(size === "sm" && "gap-1.5", className)}
      aria-label={`Share ${title}`}
      title={`Share ${title}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {size === "sm" && <span>Share</span>}
    </Button>
  );
}
