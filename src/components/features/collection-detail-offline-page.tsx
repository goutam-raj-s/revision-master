"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Folder, Loader2 } from "lucide-react";
import { getCollectionWithDocsAction } from "@/actions/collections";
import { CollectionTasksClient } from "@/components/features/collection-tasks-client";
import { SharePackButton } from "@/components/features/share-pack-button";
import { getOfflineCollectionDetail } from "@/lib/offline/read-models";
import type { LightweightTask } from "@/types";

type CollectionDetail = {
  id: string;
  name: string;
  tasks: LightweightTask[];
  publicToken?: string;
};

export function CollectionDetailOfflinePage({ collectionId }: { collectionId: string }) {
  const [collection, setCollection] = React.useState<CollectionDetail | null>(null);
  const [source, setSource] = React.useState<"loading" | "indexeddb" | "server" | "missing">("loading");

  React.useEffect(() => {
    let cancelled = false;
    window.setTimeout(async () => {
      try {
        const local = await getOfflineCollectionDetail(collectionId);
        if (!cancelled && local.collection) {
          setCollection(local.collection);
          setSource("indexeddb");
          return;
        }
        if (!cancelled && local.hasLocalData) {
          setSource("missing");
          return;
        }
      } catch {
        // Fall through to backend.
      }

      const serverCollection = await getCollectionWithDocsAction(collectionId);
      if (!cancelled) {
        setCollection(serverCollection ? {
          id: serverCollection.id,
          name: serverCollection.name,
          tasks: serverCollection.tasks,
          publicToken: serverCollection.publicToken,
        } : null);
        setSource(serverCollection ? "server" : "missing");
      }
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  if (source === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-mossy-gray">
        <Loader2 className="h-7 w-7 animate-spin" />
        <p className="mt-3 text-sm">Checking local collection...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="space-y-4">
        <Link href="/collections" className="inline-flex items-center gap-1.5 text-sm text-mossy-gray transition-colors hover:text-forest-slate">
          <ArrowLeft className="h-3.5 w-3.5" /> Collections
        </Link>
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-mossy-gray">Collection not found in local data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/collections" className="inline-flex items-center gap-1.5 text-sm text-mossy-gray transition-colors hover:text-forest-slate">
        <ArrowLeft className="h-3.5 w-3.5" /> Collections
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-state-upcoming/10">
            <Folder className="h-5 w-5 text-state-upcoming" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">{collection.name}</h1>
            <p className="text-xs text-mossy-gray">
              {collection.tasks.length} task{collection.tasks.length !== 1 ? "s" : ""}
              {source === "indexeddb" && <span className="ml-2 text-state-today">from IndexedDB</span>}
            </p>
          </div>
        </div>
        <SharePackButton collectionId={collection.id} initialToken={collection.publicToken} />
      </div>

      {collection.tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-mossy-gray">
            No tasks yet. Open a task and use <span className="font-medium text-forest-slate">Add to collection</span>.
          </p>
        </div>
      ) : (
        <CollectionTasksClient collectionId={collection.id} tasks={collection.tasks} />
      )}
    </div>
  );
}
