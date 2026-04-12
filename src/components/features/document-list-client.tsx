"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, BookOpen, Calendar, Trash2, ExternalLink, Tag, ChevronRight } from "lucide-react";
import { cn, formatDate, formatRelativeDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleTooltip } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { deleteDocumentAction, getUserDocuments } from "@/actions/documents";
import type { Document } from "@/types";

const STATUS_CONFIG = {
  first_visit: { label: "First Visit", variant: "upcoming" as const },
  revision:    { label: "Revision",    variant: "today" as const },
  updated:     { label: "Updated",     variant: "stale" as const },
  completed:   { label: "Completed",   variant: "completed" as const },
};

interface DocumentListClientProps {
  initialDocs: Document[];
  allTags: { tag: string; count: number }[];
  initialTagFilter?: string;
  initialSearch?: string;
}

export function DocumentListClient({
  initialDocs,
  allTags,
  initialTagFilter,
  initialSearch,
}: DocumentListClientProps) {
  const router = useRouter();
  const [docs, setDocs] = React.useState(initialDocs);
  const [search, setSearch] = React.useState(initialSearch || "");
  const [tagFilter, setTagFilter] = React.useState<string | null>(initialTagFilter || null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Client-side search filter
  const filtered = React.useMemo(() => {
    return docs.filter((doc) => {
      const matchSearch =
        !search ||
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchTag = !tagFilter || doc.tags.includes(tagFilter);
      return matchSearch && matchTag;
    });
  }, [docs, search, tagFilter]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await deleteDocumentAction(deleteId);
    setDocs((prev) => prev.filter((d) => d.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
    toast("Document deleted", { variant: "success" });
  }

  return (
    <div className="space-y-4">
      {/* Search + Tag filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mossy-gray" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles and tags…"
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mossy-gray hover:text-forest-slate"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTagFilter(null)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-all duration-200",
              !tagFilter
                ? "border-state-today bg-state-today/10 text-state-today"
                : "border-border bg-surface text-mossy-gray hover:border-state-today/40 hover:text-forest-slate"
            )}
          >
            All
          </button>
          {allTags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all duration-200",
                tagFilter === tag
                  ? "border-state-today bg-state-today/10 text-state-today"
                  : "border-border bg-surface text-mossy-gray hover:border-state-today/40 hover:text-forest-slate"
              )}
            >
              #{tag} <span className="opacity-60">({count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-mossy-gray">
        Showing {filtered.length} of {docs.length} documents
      </p>

      {/* Doc list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="h-10 w-10 text-mossy-gray/30 mx-auto mb-3" />
          <p className="text-sm text-mossy-gray">No documents match your search.</p>
          <Link href="/documents/new">
            <Button variant="outline" size="sm" className="mt-3">Add your first document</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => {
            const status = STATUS_CONFIG[doc.status];
            return (
              <div
                key={doc.id}
                className="group flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3 shadow-card task-row-hover"
              >
                {/* Status dot */}
                <div className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  doc.status === "revision" && "bg-state-today",
                  doc.status === "first_visit" && "bg-state-upcoming",
                  doc.status === "updated" && "bg-state-stale",
                  doc.status === "completed" && "bg-state-completed",
                )} />

                {/* Title */}
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/50 rounded"
                >
                  <div className="font-serif font-medium text-forest-slate text-sm line-clamp-1 group-hover:text-state-today transition-colors">
                    {doc.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-mossy-gray font-mono">
                      {formatDate(doc.createdAt)}
                    </span>
                    {doc.parentDocId && (
                      <span className="text-xs text-mossy-gray">· merged</span>
                    )}
                  </div>
                </Link>

                {/* Tags */}
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  {doc.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="tag" className="text-xs">#{tag}</Badge>
                  ))}
                </div>

                {/* Status badge */}
                <Badge variant={status.variant} className="shrink-0 hidden md:flex">
                  {status.label}
                </Badge>

                {/* Difficulty */}
                <Badge
                  variant={doc.difficulty === "easy" ? "easy" : doc.difficulty === "medium" ? "medium" : "hard"}
                  className="shrink-0 hidden lg:flex"
                >
                  {doc.difficulty}
                </Badge>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SimpleTooltip content="Study Document">
                    <Link
                      href={`/study/${doc.id}`}
                      className="p-1.5 rounded-lg hover:bg-canvas text-mossy-gray hover:text-forest-slate transition-colors"
                      aria-label="Study Document"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                    </Link>
                  </SimpleTooltip>
                  <SimpleTooltip content="Delete permanently">
                    <button
                      onClick={() => setDeleteId(doc.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-mossy-gray hover:text-destructive transition-colors"
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </SimpleTooltip>
                </div>

                <Link href={`/documents/${doc.id}`} className="shrink-0 text-mossy-gray">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              This will permanently delete the document and all associated notes, tags, and revision history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full"
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
