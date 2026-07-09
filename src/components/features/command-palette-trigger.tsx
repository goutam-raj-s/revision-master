"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { getCommandPaletteDataAction } from "@/actions/command-palette";
import type { Document } from "@/types";

const CommandPalette = dynamic(
  () => import("@/components/features/command-palette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

interface TermItem {
  id: string;
  term: string;
  docId?: string;
}

interface CommandPaletteData {
  documents: Document[];
  tags: string[];
  terms: TermItem[];
}

export function CommandPaletteTrigger() {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<CommandPaletteData | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.key === "k" || event.key === "/") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!open || data || loading) return;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      getCommandPaletteDataAction()
        .then((result) => {
          if (!cancelled) setData(result);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [open, data, loading]);

  if (!open) return null;

  if (!data) {
    return (
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
        <button
          type="button"
          className="absolute inset-0 bg-forest-slate/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-label="Close command palette"
        />
        <div className="relative flex w-full max-w-xl items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-mossy-gray shadow-glass">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading command palette...
        </div>
      </div>
    );
  }

  return (
    <CommandPalette
      documents={data.documents}
      tags={data.tags}
      terms={data.terms}
      onClose={() => setOpen(false)}
    />
  );
}
