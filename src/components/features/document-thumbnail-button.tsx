"use client";

import * as React from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { updateDocumentThumbnailAction } from "@/actions/documents";
import { uploadImageAction } from "@/actions/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

interface DocumentThumbnailButtonProps {
  docId: string;
  currentThumbnailUrl?: string;
}

type Mode = "idle" | "url";

export function DocumentThumbnailButton({ docId, currentThumbnailUrl }: DocumentThumbnailButtonProps) {
  const [pending, setPending] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("idle");
  const [urlDraft, setUrlDraft] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function applyUrl(url: string) {
    setPending(true);
    const result = await updateDocumentThumbnailAction(docId, url);
    setPending(false);
    if (result.success) {
      toast(url.trim() ? "Thumbnail updated" : "Thumbnail removed", { variant: "success" });
      window.location.reload();
    } else {
      toast(result.error || "Could not update thumbnail", { variant: "error" });
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setPending(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      const result = await uploadImageAction(base64);
      if (result.success && result.url) {
        await applyUrl(result.url);
      } else {
        setPending(false);
        toast(result.error || "Could not upload image", { variant: "error" });
      }
    };
    reader.onerror = () => {
      setPending(false);
      toast("Could not read file", { variant: "error" });
    };
    reader.readAsDataURL(file);
  }

  function confirmUrl() {
    const trimmed = urlDraft.trim();
    setMode("idle");
    setUrlDraft("");
    applyUrl(trimmed);
  }

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
          className="h-8 w-48 text-sm"
        />
        <Button type="button" size="sm" onClick={confirmUrl} disabled={!urlDraft.trim() || pending}>
          OK
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { setMode("idle"); setUrlDraft(""); }}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {/* Upload from device */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={pending}
        className="gap-1.5"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
        Thumbnail
      </Button>
      {/* URL option */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => { setMode("url"); setUrlDraft(currentThumbnailUrl ?? ""); }}
        disabled={pending}
        className="gap-1.5 text-mossy-gray"
      >
        URL
      </Button>
    </div>
  );
}
