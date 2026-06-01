"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteYoutubeSession, renameYoutubeSession } from "@/actions/youtube";
import { toast } from "@/components/ui/toast";

interface YoutubeSessionActionsProps {
  sessionId: string;
  currentTitle: string;
  redirectOnDelete?: string;
}

export function YoutubeSessionActions({
  sessionId,
  currentTitle,
  redirectOnDelete = "/study/youtube",
}: YoutubeSessionActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleRename() {
    const newTitle = prompt("New title for this session:", currentTitle);
    if (!newTitle?.trim() || newTitle.trim() === currentTitle) return;
    startTransition(async () => {
      const result = await renameYoutubeSession(sessionId, newTitle);
      if (result.success) {
        toast("Session renamed", { variant: "success" });
        router.refresh();
      } else {
        toast(result.error ?? "Failed to rename", { variant: "error" });
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete this study session? Notes will be permanently lost.`)) return;
    startTransition(async () => {
      const result = await deleteYoutubeSession(sessionId);
      if (result.success) {
        toast("Session deleted", { variant: "success" });
        router.push(redirectOnDelete);
      } else {
        toast(result.error ?? "Failed to delete", { variant: "error" });
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-border bg-surface text-mossy-gray transition-colors hover:bg-canvas hover:text-forest-slate disabled:opacity-60"
          aria-label="Session options"
          title="Session options"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={handleRename}>
          <Pencil className="h-3.5 w-3.5" />
          Rename session
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
