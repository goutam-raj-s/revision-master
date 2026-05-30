"use client";

import * as React from "react";
import { ImagePlus } from "lucide-react";
import { updateDocumentThumbnailAction } from "@/actions/documents";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface DocumentThumbnailButtonProps {
  docId: string;
  currentThumbnailUrl?: string;
}

export function DocumentThumbnailButton({ docId, currentThumbnailUrl }: DocumentThumbnailButtonProps) {
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    const nextUrl = window.prompt("Paste thumbnail image URL. Leave empty to remove it.", currentThumbnailUrl || "");
    if (nextUrl === null) return;

    setPending(true);
    const result = await updateDocumentThumbnailAction(docId, nextUrl);
    setPending(false);

    if (result.success) {
      toast(nextUrl.trim() ? "Thumbnail updated" : "Thumbnail removed", { variant: "success" });
      window.location.reload();
    } else {
      toast(result.error || "Could not update thumbnail", { variant: "error" });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className="gap-1.5"
    >
      <ImagePlus className="h-3.5 w-3.5" />
      Thumbnail
    </Button>
  );
}
