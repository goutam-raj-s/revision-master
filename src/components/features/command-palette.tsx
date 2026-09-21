"use client";

import * as React from "react";
import { Command } from "cmdk";
import {
  Search,
  LayoutDashboard,
  BookText,
  Settings,
  X,
  Sun,
  Utensils,
  CheckSquare,
  FolderOpen,
  Send,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { setTheme, getStoredTheme } from "@/components/ui/theme-toggle";
import { getTermSummariesAction } from "@/actions/notes";

interface TermItem {
  id: string;
  term: string;
  docId?: string;
}

interface CommandPaletteProps {
  terms?: TermItem[];
}

export function pushRecentDoc(id: string) {
  void id;
}

export function CommandPalette({ terms = [] }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [paletteTerms, setPaletteTerms] = React.useState<TermItem[]>(terms);
  const [hasLoadedPaletteData, setHasLoadedPaletteData] = React.useState(terms.length > 0);
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
    if (!open || hasLoadedPaletteData) return;
    let cancelled = false;

    async function loadPaletteData() {
      try {
        const nextTerms = await getTermSummariesAction();
        if (cancelled) return;
        setPaletteTerms(nextTerms);
        setHasLoadedPaletteData(true);
      } catch {
        if (!cancelled) setHasLoadedPaletteData(true);
      }
    }

    loadPaletteData();
    return () => {
      cancelled = true;
    };
  }, [hasLoadedPaletteData, open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function navigate(href: string) {
    router.push(href);
    close();
  }

  const q = query.toLowerCase();

  const filteredTerms = query
    ? paletteTerms.filter((t) => t.term.toLowerCase().includes(q)).slice(0, 6)
    : [];

  const actions = [
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
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm animate-fade-in" />

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
              placeholder="Search terms or run an action…"
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

            {/* Navigation */}
            <Command.Group heading={<span className={headingClass}>Navigate</span>}>
              {[
                { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
                { label: "Tasks", icon: CheckSquare, href: "/tasks" },
                { label: "Terminology", icon: BookText, href: "/terminology" },
                { label: "Collections", icon: FolderOpen, href: "/collections" },
                { label: "Posts", icon: Send, href: "/posts" },
                { label: "Stats", icon: BarChart3, href: "/stats" },
                { label: "Calories", icon: Utensils, href: "/calories" },
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

            {/* Terms */}
            {filteredTerms.length > 0 && (
              <Command.Group heading={<span className={headingClass}>Terms</span>}>
                {filteredTerms.map((t) => (
                  <Command.Item
                    key={t.id}
                    value={`term:${t.term}`}
                    onSelect={() => navigate("/terminology")}
                    className={itemClass}
                  >
                    <BookText className="h-4 w-4 text-mossy-gray shrink-0" />
                    <span className="truncate">{t.term}</span>
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
