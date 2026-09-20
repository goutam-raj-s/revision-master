"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, FileText, X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { removeDocFromCollectionAction, removeTaskFromCollectionAction } from "@/actions/collections";
import type { Document, LightweightTask } from "@/types";

export function CollectionDocRow({ collectionId, doc }: { collectionId: string; doc: Document }) {
  const router = useRouter();

  async function remove() {
    const res = await removeDocFromCollectionAction(collectionId, doc.id);
    if (res.success) {
      toast("Removed from collection");
      router.refresh();
    } else {
      toast(res.error ?? "Could not remove", { variant: "error" });
    }
  }

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card transition-all hover:shadow-hover">
      <FileText className="h-4 w-4 shrink-0 text-mossy-gray" />
      <Link href={`/study/${doc.id}`} className="min-w-0 flex-1 truncate text-sm font-medium text-forest-slate hover:text-state-today">
        {doc.title}
      </Link>
      {doc.tags.slice(0, 2).map((t) => (
        <span key={t} className="hidden shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-mossy-gray sm:inline">#{t}</span>
      ))}
      <button onClick={remove} className="p-1 text-mossy-gray opacity-0 transition-all hover:text-destructive group-hover:opacity-100" aria-label="Remove from collection">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function CollectionTaskRow({ collectionId, task }: { collectionId: string; task: LightweightTask }) {
  const router = useRouter();

  async function remove() {
    const res = await removeTaskFromCollectionAction(collectionId, task.id);
    if (res.success) {
      toast("Removed from collection");
      router.refresh();
    } else {
      toast(res.error ?? "Could not remove", { variant: "error" });
    }
  }

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card transition-all hover:shadow-hover">
      <CheckSquare className="h-4 w-4 shrink-0 text-state-today" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-forest-slate">{task.title}</div>
        {task.comments[0] && <div className="truncate text-xs text-mossy-gray">{task.comments[0].content}</div>}
      </div>
      {task.tags.slice(0, 2).map((t) => (
        <span key={t} className="hidden shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-mossy-gray sm:inline">#{t}</span>
      ))}
      <button onClick={remove} className="p-1 text-mossy-gray opacity-0 transition-all hover:text-destructive group-hover:opacity-100" aria-label="Remove from collection">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
