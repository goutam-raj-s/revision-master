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
  const [mediaFilter, setMediaFilter] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const [sortOrder, setSortOrder] = React.useState<"newest" | "oldest" | "a-z" | "z-a">("newest");

  // Client-side search filter & sort
  const filtered = React.useMemo(() => {
    let result = docs.filter((doc) => {
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
      if (sortOrder === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOrder === "a-z") {
        return a.title.localeCompare(b.title);
      } else if (sortOrder === "z-a") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return result;
  }, [docs, search, tagFilter, mediaFilter, sortOrder]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, tagFilter, mediaFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedDocs = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <select
          value={mediaFilter || ""}
          onChange={(e) => setMediaFilter(e.target.value || null)}
          className="text-sm border border-border rounded-xl px-3 py-2 bg-surface text-forest-slate focus:outline-none focus:ring-2 focus:ring-state-today/40 min-w-[140px]"
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
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="text-sm border border-border rounded-xl px-3 py-2 bg-surface text-forest-slate focus:outline-none focus:ring-2 focus:ring-state-today/40 min-w-[140px]"
          aria-label="Sort Order"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="a-z">A-Z</option>
          <option value="z-a">Z-A</option>
        </select>
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
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas/50">
                  <TableHead className="w-[40px]"></TableHead>
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
                  return (
                    <TableRow key={doc.id} className="group task-row-hover">
                      <TableCell>
                        <SimpleTooltip content={status.label}>
                          <div className={cn(
                            "h-2 w-2 rounded-full shrink-0 cursor-default",
                            doc.status === "revision" && "bg-state-today",
                            doc.status === "first_visit" && "bg-state-upcoming",
                            doc.status === "updated" && "bg-state-stale",
                            doc.status === "completed" && "bg-state-completed",
                          )} />
                        </SimpleTooltip>
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
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                        className="cursor-pointer"
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
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
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
