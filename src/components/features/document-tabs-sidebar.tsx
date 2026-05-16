"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  FileText, 
  MoreVertical, 
  ArrowLeft,
  Loader2,
  Trash2,
  Pencil,
  Search,
  Layers3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { createSubPageAction, deleteDocumentAction } from "@/actions/documents";
import { toast } from "@/components/ui/toast";
import type { Document } from "@/types";

interface DocumentTabsSidebarProps {
  subPages: Document[];
  currentDocId: string;
  parentId: string;
}

export function DocumentTabsSidebar({ subPages, currentDocId, parentId }: DocumentTabsSidebarProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const filteredPages = query.trim()
    ? subPages.filter((page) => page.title.toLowerCase().includes(query.trim().toLowerCase()))
    : subPages;

  React.useEffect(() => {
    setIsCollapsed(window.localStorage.getItem("lostbae_doc_tabs_collapsed") === "1");
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem("lostbae_doc_tabs_collapsed", isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  async function handleAddSubPage() {
    setIsCreating(true);
    const result = await createSubPageAction(parentId, "Untitled Page");
    if (result.success && result.data) {
      toast("New page created", { variant: "success" });
      router.push(`/documents/${result.data.docId}`);
    } else {
      toast(result.error || "Failed to create page", { variant: "error" });
    }
    setIsCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this page?")) return;
    const result = await deleteDocumentAction(id);
    if (result.success) {
      toast("Page deleted");
      if (id === currentDocId) {
        const remaining = subPages.filter(p => p.id !== id);
        if (remaining.length > 0) {
          router.push(`/documents/${remaining[0].id}`);
        } else {
          router.push("/documents");
        }
      } else {
        router.refresh();
      }
    }
  }

  return (
    <div 
      className={cn(
        "hidden lg:flex flex-shrink-0 border-r border-border h-[calc(100vh-4rem)] sticky top-16 bg-canvas flex-col transition-all duration-300 ease-in-out group/sidebar",
        isCollapsed ? "w-12" : "w-64"
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface shadow-sm hover:bg-forest-slate/5 transition-all opacity-0 group-hover/sidebar:opacity-100",
          isCollapsed && "opacity-100"
        )}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ArrowLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", isCollapsed && "rotate-180")} />
      </button>

      {/* Top Nav */}
      <div className={cn("p-4 border-b border-border/50", isCollapsed && "px-2 text-center")}>
        {!isCollapsed ? (
          <>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 text-sm text-mossy-gray hover:text-forest-slate transition-colors font-medium mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-forest-slate tracking-tight">Document tabs</h3>
                <p className="text-[11px] text-mossy-gray">{subPages.length} page{subPages.length === 1 ? "" : "s"}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={handleAddSubPage}
                disabled={isCreating}
                className="h-7 w-7 hover:bg-forest-slate/5"
              >
                {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mossy-gray" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find page..."
                className="h-8 w-full rounded-full border border-border bg-surface pl-8 pr-3 text-xs text-forest-slate outline-none transition-colors placeholder:text-mossy-gray/60 focus:border-state-today/40 focus:ring-2 focus:ring-state-today/10"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            <Link href="/documents" title="Back to Documents">
              <ArrowLeft className="h-5 w-5 text-mossy-gray" />
            </Link>
            <button 
              onClick={handleAddSubPage}
              disabled={isCreating}
              className="p-1 hover:bg-forest-slate/5 rounded-md"
              title="Add new page"
            >
              <Plus className="h-5 w-5 text-mossy-gray" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs List */}
      <div className={cn("flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar", isCollapsed && "px-1")}>
        {filteredPages.map((page) => {
          const isActive = page.id === currentDocId;
          return (
            <div
              key={page.id}
              className={cn(
                "group flex items-center gap-2 rounded-xl text-sm transition-all relative",
                isActive 
                  ? "bg-state-today/10 text-state-today font-medium shadow-sm border border-state-today/20" 
                  : "text-mossy-gray hover:bg-forest-slate/5 hover:text-forest-slate border border-transparent",
                isCollapsed ? "justify-center px-1 py-2" : "px-3 py-2"
              )}
            >
              <Link 
                href={`/documents/${page.id}`}
                className={cn("flex items-center gap-2 min-w-0", isCollapsed ? "justify-center" : "flex-1")}
                title={isCollapsed ? page.title : undefined}
              >
                <FileText className={cn("h-4 w-4 shrink-0", isActive ? "text-state-today" : "text-mossy-gray/70")} />
                {!isCollapsed && <span className="truncate">{page.title}</span>}
              </Link>

              {!isCollapsed && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "p-1 rounded-md hover:bg-black/5 transition-opacity opacity-0 group-hover:opacity-100",
                      isActive && "opacity-100"
                    )}>
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => router.push(`/documents/${page.id}`)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Open Page
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(page.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete Page
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
        {filteredPages.length === 0 && !isCollapsed && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/60 px-3 py-8 text-center">
            <Layers3 className="mb-2 h-5 w-5 text-mossy-gray" />
            <p className="text-xs font-medium text-forest-slate">No pages found</p>
            <p className="mt-1 text-[11px] text-mossy-gray">Try a different search or add a new page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
