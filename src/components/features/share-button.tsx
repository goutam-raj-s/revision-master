"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ShareModal = dynamic(
  () => import("@/components/features/share-modal").then((mod) => mod.ShareModal),
  { ssr: false }
);

interface ShareButtonProps {
  docId: string;
  title: string;
  size?: "icon" | "sm";
  className?: string;
}

export function ShareButton({ docId, title, size = "icon", className }: ShareButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size === "icon" ? "icon-sm" : "sm"}
        onClick={() => setOpen(true)}
        className={cn(size === "sm" && "gap-1.5", className)}
        aria-label={`Share ${title}`}
        title={`Share ${title}`}
      >
        <Share2 className="h-3.5 w-3.5" />
        {size === "sm" && <span>Share</span>}
      </Button>
      {open && (
        <ShareModal
          open={open}
          onOpenChange={setOpen}
          docId={docId}
          docTitle={title}
        />
      )}
    </>
  );
}
