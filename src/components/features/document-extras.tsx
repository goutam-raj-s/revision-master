"use client";

import * as React from "react";
import Link from "next/link";
import TurndownService from "turndown";
import { Download, BookOpenCheck, Link2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { getBacklinksAction, setReadingProgressAction } from "@/actions/documents";

interface DocumentExtrasProps {
  docId: string;
  title: string;
  content?: string;
  initialProgress?: number;
}

const STEPS = [0, 25, 50, 75, 100];

/** Reading progress, incoming backlinks, and Markdown export for a document. */
export function DocumentExtras({ docId, title, content, initialProgress = 0 }: DocumentExtrasProps) {
  const [progress, setProgress] = React.useState(initialProgress);
  const [backlinks, setBacklinks] = React.useState<{ id: string; title: string }[]>([]);

  React.useEffect(() => {
    getBacklinksAction(docId).then(setBacklinks).catch(() => {});
  }, [docId]);

  async function updateProgress(p: number) {
    setProgress(p);
    const res = await setReadingProgressAction(docId, p);
    if (!res.success) toast(res.error ?? "Could not save progress", { variant: "error" });
  }

  function exportMarkdown() {
    if (!content) {
      toast("Nothing to export yet", { variant: "default" });
      return;
    }
    const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
    const md = `# ${title}\n\n${td.turndown(content)}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^\w.-]+/g, "-").slice(0, 60) || "document"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Markdown exported", { variant: "success" });
  }

  return (
    <div className="space-y-4">
      {/* Reading progress */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-mossy-gray">
            <BookOpenCheck className="h-3.5 w-3.5" /> Reading progress
          </Label>
          <span className="font-mono text-xs font-medium text-forest-slate">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full rounded-full bg-state-today transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {STEPS.map((s) => (
            <button
              key={s}
              onClick={() => updateProgress(s)}
              className={`rounded-md py-1 text-xs font-medium transition-colors ${
                progress === s ? "bg-state-today text-white" : "border border-border text-mossy-gray hover:bg-canvas"
              }`}
            >
              {s === 100 ? "Done" : `${s}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
          <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-mossy-gray">
            <Link2 className="h-3.5 w-3.5" /> Linked from
          </Label>
          <ul className="mt-2 space-y-1">
            {backlinks.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/documents/${b.id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-forest-slate transition-colors hover:bg-canvas"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-mossy-gray" />
                  <span className="truncate">{b.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export */}
      <Button variant="outline" size="sm" onClick={exportMarkdown} className="w-full gap-1.5">
        <Download className="h-3.5 w-3.5" /> Export as Markdown
      </Button>
    </div>
  );
}
