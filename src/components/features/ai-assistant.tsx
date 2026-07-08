"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import type { AiContextKind } from "@/types";

const AiAssistantPanel = dynamic(
  () => import("@/components/features/ai-assistant-panel").then((mod) => mod.AiAssistantPanel),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-4 right-4 z-[60] h-[min(70vh,560px)] w-[min(92vw,400px)] rounded-2xl border border-border bg-surface shadow-hover print:hidden" />
    ),
  }
);

interface AiAssistantProps {
  kind: AiContextKind;
  contextId: string;
  title: string;
  enableSummary?: boolean;
}

export function AiAssistant({ kind, contextId, title, enableSummary = true }: AiAssistantProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full border border-border bg-state-today px-4 py-2.5 text-sm font-medium text-white shadow-hover transition-transform hover:scale-105 print:hidden"
          aria-label="AI study assistant"
        >
          <Sparkles className="h-4 w-4" /> Ask AI
        </button>
      )}

      {open && (
        <AiAssistantPanel
          kind={kind}
          contextId={contextId}
          title={title}
          enableSummary={enableSummary}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
