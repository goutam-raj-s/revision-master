"use client";

/**
 * ImagePickerButton
 *
 * Reusable component that lets users attach an image via:
 *   1. File upload (from disk / phone gallery)
 *   2. Pasting a URL
 *
 * Props:
 *   imageUrl      – current image url (controlled)
 *   onImageUrl    – called with the new url (or "" to clear)
 *   disabled      – disables the trigger button
 *   size          – "sm" | "xs"  (button size preset)
 *   label         – button label (default "Image")
 */

import * as React from "react";
import { ImagePlus, Link2, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { uploadImageAction } from "@/actions/upload";

interface ImagePickerButtonProps {
  imageUrl?: string;
  onImageUrl: (url: string) => void;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "xs";
}

type Mode = "idle" | "url";

export function ImagePickerButton({
  imageUrl,
  onImageUrl,
  disabled,
  label = "Image",
  size = "sm",
}: ImagePickerButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [mode, setMode] = React.useState<Mode>("idle");
  const [urlDraft, setUrlDraft] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  /* ── file upload ─────────────────────────────────────────── */
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      const result = await uploadImageAction(base64);
      setUploading(false);
      if (result.success && result.url) {
        onImageUrl(result.url);
        toast("Image attached", { variant: "success" });
      } else {
        toast(result.error || "Could not upload image", { variant: "error" });
      }
    };
    reader.onerror = () => {
      setUploading(false);
      toast("Could not read file", { variant: "error" });
    };
    reader.readAsDataURL(file);
  }

  /* ── url confirm ─────────────────────────────────────────── */
  function confirmUrl() {
    const trimmed = urlDraft.trim();
    if (trimmed) onImageUrl(trimmed);
    setUrlDraft("");
    setMode("idle");
  }

  const btnSize = size === "xs" ? "h-7 px-2 text-xs" : "";

  if (mode === "url") {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          autoFocus
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); confirmUrl(); }
            if (e.key === "Escape") { setMode("idle"); setUrlDraft(""); }
          }}
          placeholder="https://…"
          className={`h-8 text-sm ${size === "xs" ? "h-7 text-xs" : ""}`}
        />
        <Button type="button" size="sm" className={btnSize} onClick={confirmUrl} disabled={!urlDraft.trim()}>
          OK
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={btnSize}
          onClick={() => { setMode("idle"); setUrlDraft(""); }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload from device */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={`gap-1.5 ${btnSize}`}
        disabled={disabled || uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {label}
      </Button>

      {/* Paste URL */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`gap-1.5 text-mossy-gray ${btnSize}`}
        disabled={disabled || uploading}
        onClick={() => { setMode("url"); setUrlDraft(imageUrl ?? ""); }}
        title="Set image URL"
      >
        <Link2 className="h-3.5 w-3.5" />
        URL
      </Button>

      {/* Preview + remove */}
      {imageUrl && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas px-2 py-1">
          <img src={imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => onImageUrl("")}
            className="rounded-lg p-1 text-mossy-gray hover:bg-surface hover:text-destructive"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
