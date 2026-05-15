"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search, BookOpen, LayoutDashboard, Tag, BookText, Settings, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Document } from "@/types";

interface CommandPaletteProps {
  documents?: Document[];
  tags?: string[];
}

export function CommandPalette({ documents = [], tags = [] }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
    setQuery("");
  }

  const filteredDocs = query
    ? documents.filter(
        (d) =>
          d.title.toLowerCase().includes(query.toLowerCase()) ||
          d.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : documents.slice(0, 5);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-forest-slate/20 backdrop-blur-sm animate-fade-in" />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className="rounded-2xl border border-border glass-surface shadow-glass overflow-hidden"
          shouldFilter={false}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Search className="h-4 w-4 text-mossy-gray shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search documents, tags, or navigate…"
              className="flex-1 bg-transparent text-sm text-forest-slate placeholder:text-mossy-gray/60 outline-none"
              autoFocus
            />
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-canvas text-mossy-gray transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-mossy-gray">
              No results found for &quot;{query}&quot;
            </Command.Empty>

            {/* Navigation */}
            <Command.Group
              heading={
                <span className="px-2 py-1 text-xs font-semibold text-mossy-gray uppercase tracking-wide">
                  Navigate
                </span>
              }
            >
              {[
                { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
                { label: "All Documents", icon: BookOpen, href: "/documents" },
                { label: "Terminology", icon: BookText, href: "/terminology" },
                { label: "Settings", icon: Settings, href: "/settings" },
              ]
                .filter((n) => !query || n.label.toLowerCase().includes(query.toLowerCase()))
                .map((nav) => (
                  <Command.Item
                    key={nav.href}
                    value={nav.label}
                    onSelect={() => navigate(nav.href)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer",
                      "text-forest-slate hover:bg-canvas data-[selected=true]:bg-canvas",
                      "transition-colors"
                    )}
                  >
                    <nav.icon className="h-4 w-4 text-mossy-gray" />
                    {nav.label}
                  </Command.Item>
                ))}
            </Command.Group>

            {/* Documents */}
            {filteredDocs.length > 0 && (
              <Command.Group
                heading={
                  <span className="px-2 py-1 text-xs font-semibold text-mossy-gray uppercase tracking-wide">
                    Documents
                  </span>
                }
              >
                {filteredDocs.map((doc) => (
                  <Command.Item
                    key={doc.id}
                    value={doc.title}
                    onSelect={() => navigate(`/documents/${doc.id}`)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer",
                      "text-forest-slate hover:bg-canvas data-[selected=true]:bg-canvas",
                      "transition-colors"
                    )}
                  >
                    <BookOpen className="h-4 w-4 text-mossy-gray shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{doc.title}</div>
                      {doc.tags.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {doc.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-mossy-gray">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Tags */}
            {tags.filter((t) => !query || t.toLowerCase().includes(query.toLowerCase())).length > 0 && (
              <Command.Group
                heading={
                  <span className="px-2 py-1 text-xs font-semibold text-mossy-gray uppercase tracking-wide">
                    Tags
                  </span>
                }
              >
                {tags
                  .filter((t) => !query || t.toLowerCase().includes(query.toLowerCase()))
                  .slice(0, 5)
                  .map((tag) => (
                    <Command.Item
                      key={tag}
                      value={`tag:${tag}`}
                      onSelect={() => navigate(`/documents?tag=${tag}`)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer",
                        "text-forest-slate hover:bg-canvas data-[selected=true]:bg-canvas",
                        "transition-colors"
                      )}
                    >
                      <Tag className="h-4 w-4 text-mossy-gray" />#{tag}
                    </Command.Item>
                  ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer hint */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-canvas/50">
            <span className="text-xs text-mossy-gray">
              <kbd className="px-1.5 py-0.5 rounded bg-border text-xs font-mono">↑↓</kbd> navigate
            </span>
            <span className="text-xs text-mossy-gray">
              <kbd className="px-1.5 py-0.5 rounded bg-border text-xs font-mono">↵</kbd> select
            </span>
            <span className="text-xs text-mossy-gray">
              <kbd className="px-1.5 py-0.5 rounded bg-border text-xs font-mono">Esc</kbd> close
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
