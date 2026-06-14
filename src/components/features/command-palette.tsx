"use client";

import * as React from "react";
import { Command } from "cmdk";
import {
  Search,
  BookOpen,
  LayoutDashboard,
  Tag,
  BookText,
  Settings,
  X,
  Plus,
  RefreshCw,
  Sun,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { setTheme, getStoredTheme } from "@/components/ui/theme-toggle";
import { syncGoogleDocsAction } from "@/actions/google-docs";
import { toast } from "@/components/ui/toast";
import type { Document } from "@/types";

interface TermItem {
  id: string;
  term: string;
  docId?: string;
}

interface CommandPaletteProps {
  documents?: Document[];
  tags?: string[];
  terms?: TermItem[];
}

const RECENTS_KEY = "lostbae-recent-docs";

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function pushRecentDoc(id: string) {
  if (typeof window === "undefined") return;
  const next = [id, ...readRecents().filter((x) => x !== id)].slice(0, 6);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
}

export function CommandPalette({ documents = [], tags = [], terms = [] }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "/") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (open) setRecentIds(readRecents());
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function navigate(href: string) {
    router.push(href);
    close();
  }

  const q = query.toLowerCase();

  const filteredDocs = query
    ? documents.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      )
    : documents.slice(0, 5);

  const filteredTerms = query
    ? terms.filter((t) => t.term.toLowerCase().includes(q)).slice(0, 6)
    : [];

  const recentDocs = !query
    ? recentIds
        .map((id) => documents.find((d) => d.id === id))
        .filter((d): d is Document => Boolean(d))
    : [];

  const actions = [
    {
      label: "Import document",
      icon: Plus,
      keywords: "new create import add",
      run: () => navigate("/documents/new"),
    },
    {
      label: "Sync Google Docs",
      icon: RefreshCw,
      keywords: "google drive refresh",
      run: async () => {
        close();
        toast("Syncing Google Docs…");
        const res = await syncGoogleDocsAction();
        if (res.success && res.data) {
          toast(`Synced ${res.data.synced} doc${res.data.synced !== 1 ? "s" : ""}`, {
            variant: "success",
          });
          router.refresh();
        }
      },
    },
    {
      label: "Toggle dark / light theme",
      icon: Sun,
      keywords: "dark light mode appearance",
      run: () => {
        const cur = getStoredTheme();
        setTheme(cur === "dark" ? "light" : "dark");
        close();
      },
    },
  ].filter((a) => !query || a.label.toLowerCase().includes(q) || a.keywords.includes(q));

  if (!open) return null;

  const itemClass = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer",
    "text-forest-slate hover:bg-canvas data-[selected=true]:bg-canvas transition-colors"
  );
  const headingClass = "px-2 py-1 text-xs font-semibold text-mossy-gray uppercase tracking-wide";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={close}
    >
      <div className="absolute inset-0 bg-forest-slate/20 backdrop-blur-sm animate-fade-in" />

      <div className="relative w-full max-w-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <Command
          className="rounded-2xl border border-border glass-surface shadow-glass overflow-hidden"
          shouldFilter={false}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Search className="h-4 w-4 text-mossy-gray shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search docs, terms, run an action…"
              className="flex-1 bg-transparent text-sm text-forest-slate placeholder:text-mossy-gray/60 outline-none"
              autoFocus
            />
            <button
              onClick={close}
              className="rounded-md p-1 hover:bg-canvas text-mossy-gray transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-mossy-gray">
              No results found for &quot;{query}&quot;
            </Command.Empty>

            {/* Actions */}
            {actions.length > 0 && (
              <Command.Group heading={<span className={headingClass}>Actions</span>}>
                {actions.map((action) => (
                  <Command.Item
                    key={action.label}
                    value={`action:${action.label}`}
                    onSelect={action.run}
                    className={itemClass}
                  >
                    <action.icon className="h-4 w-4 text-state-today" />
                    {action.label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Recents */}
            {recentDocs.length > 0 && (
              <Command.Group heading={<span className={headingClass}>Recent</span>}>
                {recentDocs.map((doc) => (
                  <Command.Item
                    key={doc.id}
                    value={`recent:${doc.id}`}
                    onSelect={() => navigate(`/documents/${doc.id}`)}
                    className={itemClass}
                  >
                    <Clock className="h-4 w-4 text-mossy-gray shrink-0" />
                    <span className="truncate">{doc.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Navigation */}
            <Command.Group heading={<span className={headingClass}>Navigate</span>}>
              {[
                { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
                { label: "All Documents", icon: BookOpen, href: "/documents" },
                { label: "Terminology", icon: BookText, href: "/terminology" },
                { label: "Settings", icon: Settings, href: "/settings" },
              ]
                .filter((n) => !query || n.label.toLowerCase().includes(q))
                .map((nav) => (
                  <Command.Item
                    key={nav.href}
                    value={nav.label}
                    onSelect={() => navigate(nav.href)}
                    className={itemClass}
                  >
                    <nav.icon className="h-4 w-4 text-mossy-gray" />
                    {nav.label}
                  </Command.Item>
                ))}
            </Command.Group>

            {/* Documents */}
            {filteredDocs.length > 0 && (
              <Command.Group heading={<span className={headingClass}>Documents</span>}>
                {filteredDocs.map((doc) => (
                  <Command.Item
                    key={doc.id}
                    value={doc.title}
                    onSelect={() => navigate(`/documents/${doc.id}`)}
                    className={itemClass}
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

            {/* Terms */}
            {filteredTerms.length > 0 && (
              <Command.Group heading={<span className={headingClass}>Terms</span>}>
                {filteredTerms.map((t) => (
                  <Command.Item
                    key={t.id}
                    value={`term:${t.term}`}
                    onSelect={() => navigate(t.docId ? `/documents/${t.docId}` : "/terminology")}
                    className={itemClass}
                  >
                    <BookText className="h-4 w-4 text-mossy-gray shrink-0" />
                    <span className="truncate">{t.term}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Tags */}
            {tags.filter((t) => !query || t.toLowerCase().includes(q)).length > 0 && (
              <Command.Group heading={<span className={headingClass}>Tags</span>}>
                {tags
                  .filter((t) => !query || t.toLowerCase().includes(q))
                  .slice(0, 5)
                  .map((tag) => (
                    <Command.Item
                      key={tag}
                      value={`tag:${tag}`}
                      onSelect={() => navigate(`/documents?tag=${tag}`)}
                      className={itemClass}
                    >
                      <Tag className="h-4 w-4 text-mossy-gray" />#{tag}
                    </Command.Item>
                  ))}
              </Command.Group>
            )}
          </Command.List>

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
