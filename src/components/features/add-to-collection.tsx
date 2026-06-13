"use client";

import * as React from "react";
import { FolderPlus, Check, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import {
  getCollectionsAction,
  addDocToCollectionAction,
  createCollectionAction,
} from "@/actions/collections";
import type { TopicCollection } from "@/types";

export function AddToCollection({ docId }: { docId: string }) {
  const [collections, setCollections] = React.useState<TopicCollection[]>([]);
  const [added, setAdded] = React.useState<Set<string>>(new Set());
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");

  function load() {
    getCollectionsAction().then(setCollections).catch(() => {});
  }

  async function addTo(id: string, name: string) {
    const res = await addDocToCollectionAction(id, docId);
    if (res.success) {
      setAdded((s) => new Set(s).add(id));
      toast(`Added to "${name}"`, { variant: "success" });
    } else {
      toast(res.error ?? "Could not add", { variant: "error" });
    }
  }

  async function createAndAdd() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await createCollectionAction(newName);
    if (res.success && res.data) {
      await addDocToCollectionAction(res.data.id, docId);
      toast(`Added to "${newName}"`, { variant: "success" });
      setNewName("");
      load();
    } else {
      toast(res.error ?? "Could not create", { variant: "error" });
    }
    setCreating(false);
  }

  return (
    <DropdownMenu onOpenChange={(o) => o && load()}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-1.5">
          <FolderPlus className="h-3.5 w-3.5" /> Add to collection
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {collections.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-mossy-gray">No collections yet</div>
        )}
        {collections.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => addTo(c.id, c.name)} className="justify-between">
            <span className="truncate">{c.name}</span>
            {added.has(c.id) && <Check className="h-3.5 w-3.5 text-state-today" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="flex items-center gap-1 p-1.5" onClick={(e) => e.stopPropagation()}>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); createAndAdd(); }
              e.stopPropagation();
            }}
            placeholder="New collection"
            className="h-7 text-xs"
          />
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={createAndAdd} disabled={creating || !newName.trim()}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
