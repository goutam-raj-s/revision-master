"use client";

import * as React from "react";
import { PanelRight } from "lucide-react";
import { StudySidebarPanel } from "@/components/features/study-sidebar-panel";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { Document, Repetition, Note, Term } from "@/types";

interface MobileSidebarButtonProps {
  doc: Document;
  rep: Repetition | null;
  initialNotes: Note[];
  initialTerms: Term[];
}

export function MobileSidebarButton({
  doc,
  rep,
  initialNotes,
  initialTerms,
}: MobileSidebarButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* FAB — only visible below lg breakpoint */}
      <SimpleTooltip content="Open document panel" side="left">
        <button
          onClick={() => setOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 rounded-full bg-state-today text-white shadow-glass p-3 hover:bg-state-today/90 transition-colors"
          aria-label="Open document panel"
        >
          <PanelRight className="h-5 w-5" />
        </button>
      </SimpleTooltip>

      {/* Overlay sidebar */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-forest-slate/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Sidebar panel */}
          <div className="relative w-80 max-w-full h-full animate-slide-up flex flex-col shadow-glass">
            <StudySidebarPanel
              doc={doc}
              rep={rep}
              initialNotes={initialNotes}
              initialTerms={initialTerms}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
