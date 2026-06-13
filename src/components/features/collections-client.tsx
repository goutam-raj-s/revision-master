"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderPlus, Folder, Trash2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { createCollectionAction, deleteCollectionAction } from "@/actions/collections";
import type { TopicCollection } from "@/types";

export function CollectionsClient({ initial }: { initial: TopicCollection[] }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const res = await createCollectionAction(name);
    setCreating(false);
    if (res.success && res.data) {
      setName("");
      router.push(`/collections/${res.data.id}`);
    } else {
      toast(res.error ?? "Could not create", { variant: "error" });
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this collection? The documents themselves stay in your library.")) return;
    const res = await deleteCollectionAction(id);
    if (res.success) {
      toast("Collection deleted");
      router.refresh();
    } else {
      toast(res.error ?? "Could not delete", { variant: "error" });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="New collection name…"
          className="max-w-sm"
        />
        <Button onClick={create} disabled={creating || !name.trim()} className="gap-1.5">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
          Create
        </Button>
      </div>

      {initial.length === 0 ? (
        <Card className="p-10 text-center shadow-card">
          <Folder className="mx-auto h-8 w-8 text-mossy-gray/50" />
          <p className="mt-3 text-sm text-mossy-gray">No collections yet. Group related documents into topics above.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {initial.map((c) => (
            <Card key={c.id} className="group flex items-center justify-between gap-3 p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-hover">
              <Link href={`/collections/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-state-upcoming/10">
                  <Folder className="h-5 w-5 text-state-upcoming" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-forest-slate">{c.name}</p>
                  <p className="text-xs text-mossy-gray">{c.docCount} document{c.docCount !== 1 ? "s" : ""}</p>
                </div>
              </Link>
              <div className="flex items-center gap-1">
                <button onClick={() => remove(c.id)} className="p-1.5 text-mossy-gray opacity-0 transition-all hover:text-destructive group-hover:opacity-100" aria-label="Delete collection">
                  <Trash2 className="h-4 w-4" />
                </button>
                <Link href={`/collections/${c.id}`} className="text-mossy-gray transition-colors hover:text-state-today">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
