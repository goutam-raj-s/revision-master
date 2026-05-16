"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, X, BookOpen, Calendar, Trash2, Tag, ChevronRight,
  CheckSquare, Square, Minus, Download, Loader2, AlertTriangle,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { deleteDocumentAction, bulkDeleteDocumentsAction } from "@/actions/documents";
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
  const [mediaFilter, setMediaFilter] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const VALID_SORTS = ["newest", "oldest", "a-z", "z-a", "last-modified"] as const;
  type SortOrder = typeof VALID_SORTS[number];
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("last-modified");

  // Rehydrate persisted filter prefs from localStorage (client-only)
  React.useEffect(() => {
    const storedSort = localStorage.getItem("lostbae_doc_sort") as SortOrder | null;
    const storedMedia = localStorage.getItem("lostbae_doc_media");
    if (storedSort && (VALID_SORTS as readonly string[]).includes(storedSort)) setSortOrder(storedSort);
    if (storedMedia !== null) setMediaFilter(storedMedia || null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist sort + media changes
  React.useEffect(() => { localStorage.setItem("lostbae_doc_sort", sortOrder); }, [sortOrder]);
  React.useEffect(() => { localStorage.setItem("lostbae_doc_media", mediaFilter ?? ""); }, [mediaFilter]);

  // ─── Bulk selection ───────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = React.useState(false);

  // Client-side search filter & sort
  const filtered = React.useMemo(() => {
    const result = docs.filter((doc) => {
      const matchSearch =
        !search ||
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchTag = !tagFilter || doc.tags.includes(tagFilter);
      const docMedia = doc.mediaType || "google-doc";
      const matchMedia = !mediaFilter || docMedia === mediaFilter;
      return matchSearch && matchTag && matchMedia;
    });

    result.sort((a, b) => {
      if (sortOrder === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === "a-z") return a.title.localeCompare(b.title);
      if (sortOrder === "z-a") return b.title.localeCompare(a.title);
      if (sortOrder === "last-modified") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0;
    });

    return result;
  }, [docs, search, tagFilter, mediaFilter, sortOrder]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [search, tagFilter, mediaFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedDocs = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pageIds = paginatedDocs.map((d) => d.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...pageIds]));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  // ─── Export selected as CSV ───────────────────────────────────────────────
  function exportCSV() {
    const rows = docs.filter((d) => selectedIds.has(d.id));
    const header = "Title,Tags,Status,Difficulty,Created";
    const lines = rows.map((d) =>
      [
        `"${d.title.replace(/"/g, '""')}"`,
        `"${d.tags.join(", ")}"`,
        d.status,
        d.difficulty,
        new Date(d.createdAt).toLocaleDateString(),
      ].join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lostbae-documents-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${rows.length} document${rows.length !== 1 ? "s" : ""} as CSV`, { variant: "success" });
  }

  // ─── Single delete ────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await deleteDocumentAction(deleteId);
    setDocs((prev) => prev.filter((d) => d.id !== deleteId));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(deleteId); return next; });
    setDeleteId(null);
    setDeleting(false);
    toast("Document deleted", { variant: "success" });
  }

  // ─── Bulk delete ─────────────────────────────────────────────────────────
  async function handleBulkDelete() {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const result = await bulkDeleteDocumentsAction(ids);
    if (result.success) {
      setDocs((prev) => prev.filter((d) => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
      toast(`Deleted ${ids.length} document${ids.length !== 1 ? "s" : ""}`, { variant: "success" });
    } else {
      toast(result.error || "Bulk delete failed", { variant: "error" });
    }
    setBulkDeleting(false);
    setShowBulkConfirm(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      {/* Search + Tag filters */}
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mossy-gray" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles and tags…"
            className="h-9 pl-9 text-sm"
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
        <select
          value={mediaFilter || ""}
          onChange={(e) => setMediaFilter(e.target.value || null)}
          className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-forest-slate focus:outline-none focus:ring-2 focus:ring-state-today/40 sm:w-auto sm:min-w-[140px]"
          aria-label="Filter Media Type"
        >
          <option value="">All Media Types</option>
          <option value="google-doc">Google Docs</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
          <option value="pdf">PDF</option>
          <option value="image">Image</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-forest-slate focus:outline-none focus:ring-2 focus:ring-state-today/40 sm:w-auto sm:min-w-[140px]"
          aria-label="Sort Order"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="a-z">A-Z</option>
          <option value="z-a">Z-A</option>
          <option value="last-modified">Last Modified</option>
        </select>
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="flex max-w-full flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => setTagFilter(null)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-all duration-200 sm:px-3 sm:py-1.5",
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
                "max-w-full truncate rounded-full border px-2.5 py-1 text-xs transition-all duration-200 sm:px-3 sm:py-1.5",
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
        {selectedIds.size > 0 && (
          <span className="ml-2 text-state-today font-medium">
            · {selectedIds.size} selected
          </span>
        )}
      </p>

      {/* Doc list */}
      {filtered.length === 0 ? (
        docs.length === 0 ? (
          <div className="py-16 text-center bg-surface border border-border rounded-xl flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-state-today/10 text-state-today rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-forest-slate mb-1">Your library is empty</h3>
            <p className="text-sm text-mossy-gray max-w-[250px] mb-5">
              Start building your knowledge base by adding your first document.
            </p>
            <Link href="/documents/new">
              <Button size="sm" className="rounded-full shadow-soft hover:shadow-hover">
                Add your first document
              </Button>
            </Link>
          </div>
        ) : (
          <div className="py-12 text-center bg-surface border border-border rounded-xl flex flex-col items-center justify-center">
            <Search className="h-10 w-10 text-mossy-gray/30 mx-auto mb-3" />
            <h3 className="text-md font-medium text-forest-slate mb-1">No matches found</h3>
            <p className="text-sm text-mossy-gray">Try adjusting your search or filters.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
              onClick={() => {
                setSearch("");
                setTagFilter(null);
                setMediaFilter("");
              }}
            >
              Clear filters
            </Button>
          </div>
        )
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2 sm:hidden">
            {paginatedDocs.map((doc) => {
              const status = STATUS_CONFIG[doc.status];
              const isSelected = selectedIds.has(doc.id);
              return (
                <div
                  key={doc.id}
                  className={cn(
                    "rounded-2xl border border-border bg-surface p-3 shadow-card",
                    isSelected && "border-state-today/30 bg-state-today/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleSelect(doc.id)}
                      className="mt-0.5 shrink-0 rounded-lg p-1 text-mossy-gray hover:text-state-today"
                      aria-label={isSelected ? "Deselect" : "Select"}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-state-today" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <Link href={`/documents/${doc.id}`} className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-semibold leading-snug text-forest-slate">
                        {doc.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant={status.variant} className="px-1.5 py-0 text-[10px]">
                          {status.label}
                        </Badge>
                        <span className="font-mono text-[11px] text-mossy-gray">
                          {formatDate(doc.createdAt)}
                        </span>
                      </div>
                      {doc.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {doc.tags.slice(-2).map((tag) => (
                            <Badge key={tag} variant="tag" className="max-w-[120px] truncate px-1.5 py-0 text-[10px]">
                              #{tag}
                            </Badge>
                          ))}
                          {doc.tags.length > 2 && (
                            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                              +{doc.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </Link>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <SimpleTooltip content="Study Document">
                        <Link
                          href={`/study/${doc.id}`}
                          className="rounded-lg p-1.5 text-mossy-gray transition-colors hover:bg-canvas hover:text-forest-slate"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                        </Link>
                      </SimpleTooltip>
                      <button
                        onClick={() => setDeleteId(doc.id)}
                        className="rounded-lg p-1.5 text-mossy-gray transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Delete ${doc.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border bg-surface sm:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas/50">
                  {/* Select-all checkbox */}
                  <TableHead className="w-[40px]">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center text-mossy-gray hover:text-forest-slate transition-colors"
                      aria-label={allPageSelected ? "Deselect all on page" : "Select all on page"}
                    >
                      {allPageSelected ? (
                        <CheckSquare className="h-4 w-4 text-state-today" />
                      ) : somePageSelected ? (
                        <Minus className="h-4 w-4 text-state-today" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Tags</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Difficulty</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocs.map((doc) => {
                  const status = STATUS_CONFIG[doc.status];
                  const isSelected = selectedIds.has(doc.id);
                  return (
                    <TableRow
                      key={doc.id}
                      className={cn(
                        "group task-row-hover transition-colors",
                        isSelected && "bg-state-today/5 border-state-today/20"
                      )}
                    >
                      {/* Checkbox */}
                      <TableCell>
                        <button
                          onClick={() => toggleSelect(doc.id)}
                          className="flex items-center justify-center text-mossy-gray hover:text-state-today transition-colors"
                          aria-label={isSelected ? "Deselect" : "Select"}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-state-today" />
                          ) : (
                            <Square className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </TableCell>

                      <TableCell>
                        <Link href={`/documents/${doc.id}`} className="block">
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
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1 flex-wrap">
                          {doc.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="tag" className="text-[10px] px-1.5 py-0">#{tag}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant={doc.difficulty === "easy" ? "easy" : doc.difficulty === "medium" ? "medium" : "hard"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {doc.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <SimpleTooltip content="Study Document">
                            <Link
                              href={`/study/${doc.id}`}
                              className="p-1.5 rounded-lg hover:bg-canvas text-mossy-gray hover:text-forest-slate transition-colors"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                            </Link>
                          </SimpleTooltip>
                          <SimpleTooltip content="Delete permanently">
                            <button
                              onClick={() => setDeleteId(doc.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-mossy-gray hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </SimpleTooltip>
                          <Link href={`/documents/${doc.id}`} className="p-1.5 rounded-lg text-mossy-gray hover:text-forest-slate transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination className="justify-center sm:justify-end">
              <PaginationContent className="max-w-full overflow-x-auto pb-1 custom-scrollbar">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={cn("h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm", currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer")}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={currentPage === pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 cursor-pointer text-xs sm:h-9 sm:w-9 sm:text-sm"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={cn("h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm", currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* ── Floating Bulk Action Bar ─────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div
          className={cn(
            "fixed bottom-4 left-3 right-3 z-50 sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2",
            "flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3",
            "bg-forest-slate/95 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10",
            "animate-slide-up"
          )}
        >
          {/* Selection count */}
          <div className="flex items-center gap-2 pr-3 border-r border-white/20">
            <CheckSquare className="h-4 w-4 text-state-today" />
            <span className="text-xs font-semibold text-white tabular-nums sm:text-sm">
              {selectedIds.size} selected
            </span>
          </div>

          {/* Export CSV */}
          <SimpleTooltip content="Export as CSV" side="top">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportCSV}
              className="gap-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden min-[390px]:inline">Export CSV</span>
            </Button>
          </SimpleTooltip>

          {/* Bulk delete */}
          <SimpleTooltip content={`Delete ${selectedIds.size} document${selectedIds.size !== 1 ? "s" : ""}`} side="top">
            <Button
              size="sm"
              onClick={() => setShowBulkConfirm(true)}
              className="gap-1.5 bg-destructive/90 text-xs text-white hover:bg-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {selectedIds.size}
            </Button>
          </SimpleTooltip>

          {/* Dismiss */}
          <button
            onClick={clearSelection}
            className="ml-1 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Single Delete Confirmation ───────────────────────────────────── */}
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

      {/* ── Bulk Delete Confirmation ─────────────────────────────────────── */}
      <Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-destructive/10 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Delete {selectedIds.size} document{selectedIds.size !== 1 ? "s" : ""}?</DialogTitle>
            </div>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-forest-slate">{selectedIds.size} document{selectedIds.size !== 1 ? "s" : ""}</span>{" "}
              along with all associated notes, terms, and revision history.
              <br />
              <strong className="text-destructive">This cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={bulkDeleting}>Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="rounded-full gap-2"
            >
              {bulkDeleting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…</>
              ) : (
                <><Trash2 className="h-3.5 w-3.5" /> Delete {selectedIds.size}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
