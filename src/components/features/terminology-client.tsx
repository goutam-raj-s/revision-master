"use client";

import * as React from "react";
import Link from "next/link";
import { BookText, ChevronDown, ChevronRight, ExternalLink, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { createStandaloneTermAction, deleteTermAction } from "@/actions/notes";
import type { Term, Document } from "@/types";

interface TerminologyClientProps {
  terms: Term[];
  docs: Document[];
}

export function TerminologyClient({ terms: initialTerms, docs }: TerminologyClientProps) {
  const [terms, setTerms] = React.useState(initialTerms);
  const [search, setSearch] = React.useState("");
  const [showComposer, setShowComposer] = React.useState(false);
  const [newTerm, setNewTerm] = React.useState("");
  const [newDefinition, setNewDefinition] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => new Set());

  const docMap = React.useMemo(() => {
    const m = new Map<string, Document>();
    docs.forEach((d) => m.set(d.id, d));
    return m;
  }, [docs]);

  const filtered = React.useMemo(() => {
    if (!search) return terms;
    const q = search.toLowerCase();
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
    );
  }, [terms, search]);

  // Group alphabetically
  const grouped = React.useMemo(() => {
    const groups = new Map<string, Term[]>();
    filtered.forEach((t) => {
      const letter = t.term.charAt(0).toUpperCase();
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter)!.push(t);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  async function handleDelete(termId: string) {
    await deleteTermAction(termId);
    setTerms((prev) => prev.filter((t) => t.id !== termId));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(termId);
      return next;
    });
    toast("Term deleted");
  }

  async function handleAddTerm() {
    if (!newTerm.trim() || !newDefinition.trim()) return;

    setSaving(true);
    const fd = new FormData();
    fd.set("term", newTerm.trim());
    fd.set("definition", newDefinition.trim());

    const result = await createStandaloneTermAction({ success: false }, fd);
    if (result.success && result.data) {
      setTerms((prev) => [...prev, result.data!].sort((a, b) => a.term.localeCompare(b.term)));
      setExpandedIds((prev) => new Set(prev).add(result.data!.id));
      setNewTerm("");
      setNewDefinition("");
      setShowComposer(false);
      toast("Term added", { variant: "success" });
    } else {
      toast(result.error || "Could not add term", { variant: "error" });
    }
    setSaving(false);
  }

  function toggleExpanded(termId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(termId)) {
        next.delete(termId);
      } else {
        next.add(termId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mossy-gray" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search terms…"
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mossy-gray hover:text-forest-slate"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          onClick={() => setShowComposer((value) => !value)}
          className="h-9 gap-2 self-start sm:self-auto"
          variant={showComposer ? "outline" : "default"}
        >
          <Plus className="h-4 w-4" />
          Add Term
        </Button>
      </div>

      {showComposer && (
        <div className="rounded-2xl border border-border bg-surface p-3 shadow-card sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-state-today/10 text-state-today">
              <BookText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-forest-slate">New terminology</h2>
              <p className="text-xs text-mossy-gray">Saved directly to your glossary.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Input
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Term"
              className="h-9"
            />
            <Textarea
              value={newDefinition}
              onChange={(e) => setNewDefinition(e.target.value)}
              placeholder="Short explanation"
              className="min-h-[88px] resize-none text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowComposer(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddTerm}
                disabled={saving || !newTerm.trim() || !newDefinition.trim()}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Save Term
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Alphabet index */}
      {grouped.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {grouped.map(([letter]) => (
            <a
              key={letter}
              href={`#group-${letter}`}
              className="rounded-lg border border-border bg-surface px-2 py-1 font-mono text-xs text-mossy-gray transition-colors hover:border-state-today/30 hover:text-state-today"
            >
              {letter}
            </a>
          ))}
        </div>
      )}

      {/* Grouped terms */}
      {terms.length === 0 ? (
        <div className="py-14 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-state-upcoming/10">
            <Search className="h-6 w-6 text-state-upcoming" />
          </div>
          <h2 className="mb-1 text-base font-semibold text-forest-slate">No terms yet</h2>
          <p className="mx-auto max-w-xs text-sm text-mossy-gray">
            Add one here or save terminology while reviewing documents.
          </p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-mossy-gray">
          No terms match your search.
        </div>
      ) : (
        grouped.map(([letter, groupTerms]) => (
          <div key={letter} id={`group-${letter}`}>
            <div className="mb-2 flex items-center gap-3 sm:mb-3">
              <h2 className="font-mono text-sm font-bold text-mossy-gray">{letter}</h2>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2">
              {groupTerms.map((term) => {
                const sourceDoc = term.docId ? docMap.get(term.docId) : undefined;
                const isExpanded = expandedIds.has(term.id);
                return (
                  <div key={term.id} className="group rounded-2xl border border-border bg-surface shadow-card task-row-hover">
                    <div className="flex items-center justify-between gap-2 p-3 sm:p-4">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(term.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-mossy-gray" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-mossy-gray" />
                        )}
                        <span className="truncate text-sm font-semibold text-forest-slate">
                          {term.term}
                        </span>
                      </button>
                      {sourceDoc && (
                        <Link
                          href={`/documents/${sourceDoc.id}`}
                          className="hidden max-w-[150px] shrink-0 items-center gap-1.5 truncate text-xs text-state-today hover:underline sm:inline-flex"
                          title={sourceDoc.title}
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{sourceDoc.title}</span>
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(term.id)}
                        className="p-1.5 text-mossy-gray opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label={`Delete term ${term.term}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-border/60 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
                        <p className="text-sm leading-relaxed text-mossy-gray">{term.definition}</p>
                        {sourceDoc && (
                          <Link
                            href={`/documents/${sourceDoc.id}`}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs text-state-today hover:underline sm:hidden"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {sourceDoc.title}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
