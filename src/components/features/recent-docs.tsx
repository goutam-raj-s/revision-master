"use client";

import * as React from "react";
import Link from "next/link";
import { History, FileText } from "lucide-react";
import { getRecentDocsAction } from "@/actions/documents";

const RECENTS_KEY = "lostbae-recent-docs";

interface RecentItem {
  id: string;
  title: string;
  mediaType?: string;
}

/** "Continue where you left off" — recently opened documents, resolved from
 *  the same localStorage list the command palette maintains. */
export function RecentDocs() {
  const [items, setItems] = React.useState<RecentItem[]>([]);

  React.useEffect(() => {
    let ids: string[] = [];
    try {
      ids = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
    } catch {
      ids = [];
    }
    if (ids.length === 0) return;
    getRecentDocsAction(ids).then(setItems).catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-mossy-gray">
        <History className="h-3.5 w-3.5" /> Continue where you left off
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/study/${item.id}`}
            className="group flex min-w-[160px] max-w-[200px] shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-hover"
          >
            <FileText className="h-4 w-4 shrink-0 text-mossy-gray transition-colors group-hover:text-state-today" />
            <span className="truncate text-sm font-medium text-forest-slate">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
