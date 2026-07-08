"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2, RefreshCw } from "lucide-react";
import { getStudySidebarDataAction } from "@/actions/documents";
import { Button } from "@/components/ui/button";
import type { Document, Note, Repetition, Term } from "@/types";

const StudySidebarPanel = dynamic(
  () => import("@/components/features/study-sidebar-panel").then((mod) => mod.StudySidebarPanel),
  {
    ssr: false,
    loading: () => <StudySidebarShell label="Preparing panel..." />,
  }
);

interface StudySidebarLoaderProps {
  doc: Document;
  rootDocId: string;
  onClose?: () => void;
}

interface SidebarData {
  rep: Repetition | null;
  notes: Note[];
  terms: Term[];
}

export function StudySidebarLoader({ doc, rootDocId, onClose }: StudySidebarLoaderProps) {
  const [data, setData] = React.useState<SidebarData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getStudySidebarDataAction(doc.id, rootDocId);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error ?? "Could not load study panel.");
    }
    setLoading(false);
  }, [doc.id, rootDocId]);

  React.useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) void load();
    });

    return () => {
      cancelled = true;
    };
  }, [load]);

  if (loading && !data) {
    return <StudySidebarShell label="Loading notes and review data..." />;
  }

  if (error && !data) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 border-l border-border bg-surface p-6 text-center">
        <p className="text-sm font-medium text-forest-slate">Panel data did not load.</p>
        <p className="text-xs text-mossy-gray">{error}</p>
        <Button type="button" size="sm" variant="outline" onClick={() => void load()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <StudySidebarPanel
      doc={doc}
      rep={data.rep}
      initialNotes={data.notes}
      initialTerms={data.terms}
      onClose={onClose}
    />
  );
}

function StudySidebarShell({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-surface">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="h-3 w-16 rounded-full bg-canvas" />
        <div className="mt-2 h-4 w-40 rounded-full bg-canvas" />
      </div>
      <div className="flex flex-1 items-center justify-center gap-2 text-xs text-mossy-gray">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {label}
      </div>
    </div>
  );
}
