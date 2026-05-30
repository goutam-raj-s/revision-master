"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewThumbnailProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImagePreviewThumbnail({ src, alt = "", className }: ImagePreviewThumbnailProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="group/preview relative shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/50"
        aria-label="Preview image"
      >
        <img
          src={src}
          alt={alt}
          className={cn("h-14 w-14 rounded-xl border border-border object-cover shadow-soft", className)}
        />
        <div className="pointer-events-none absolute left-0 top-[calc(100%+0.5rem)] z-40 hidden rounded-2xl border border-border bg-surface p-2 shadow-hover group-hover/preview:block">
          <img src={src} alt={alt} className="max-h-72 w-72 rounded-xl object-contain" />
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-slate/55 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-h-[86vh] max-w-[86vw] rounded-2xl border border-white/20 bg-surface p-2 shadow-glass">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -right-3 -top-3 rounded-full bg-forest-slate p-2 text-white shadow-hover"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={src} alt={alt} className="max-h-[80vh] max-w-[80vw] rounded-xl object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
