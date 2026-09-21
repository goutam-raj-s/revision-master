"use client";

import * as React from "react";
import { getPostDraftsAction } from "@/actions/posts";
import { getSocialConnectionsAction } from "@/actions/social";
import { PostsClient } from "@/components/features/posts-client";
import { getOfflinePostsView } from "@/lib/offline/read-models";
import type { PostDraft, SocialConnection, SocialProvider } from "@/types";

export function PostsOfflinePage() {
  const [drafts, setDrafts] = React.useState<PostDraft[]>([]);
  const [connections, setConnections] = React.useState<SocialConnection[]>([]);
  const [configured, setConfigured] = React.useState<SocialProvider[]>([]);
  const [source, setSource] = React.useState<"loading" | "indexeddb" | "server">("loading");

  React.useEffect(() => {
    let cancelled = false;
    window.setTimeout(async () => {
      try {
        const local = await getOfflinePostsView();
        if (!cancelled && local.hasLocalData) {
          setDrafts(local.drafts);
          setConnections(local.connections);
          setConfigured(local.configured);
          setSource("indexeddb");
          return;
        }
      } catch {
        // Fall through to backend.
      }

      const [serverDrafts, social] = await Promise.all([
        getPostDraftsAction(),
        getSocialConnectionsAction(),
      ]);
      if (!cancelled) {
        setDrafts(serverDrafts);
        setConnections(social.connections);
        setConfigured(social.configured);
        setSource("server");
      }
    }, 0);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Social</h1>
        <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">
          Run account-specific publishing, comments, reactions and tracking from one place.
          {source === "indexeddb" && <span className="ml-2 text-state-today">from IndexedDB</span>}
          {source === "loading" && <span className="ml-2">checking local data...</span>}
        </p>
      </div>
      <PostsClient
        initial={drafts}
        connections={connections}
        configured={configured}
        onDraftsLoaded={setDrafts}
      />
    </div>
  );
}
