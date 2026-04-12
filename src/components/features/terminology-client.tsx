"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X, ExternalLink, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { deleteTermAction } from "@/actions/notes";
import type { Term, Document } from "@/types";

interface TerminologyClientProps {
  terms: Term[];
  docs: Document[];
}

export function TerminologyClient({ terms: initialTerms, docs }: TerminologyClientProps) {
  const [terms, setTerms] = React.useState(initialTerms);
  const [search, setSearch] = React.useState("");

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
    toast("Term deleted");
  }

  if (terms.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="h-12 w-12 rounded-2xl bg-state-upcoming/10 flex items-center justify-center mx-auto mb-4">
          <Search className="h-6 w-6 text-state-upcoming" />
        </div>
        <h2 className="text-base font-semibold text-forest-slate mb-1">No terms yet</h2>
        <p className="text-sm text-mossy-gray">
          Add terminology definitions when reviewing documents to build your personal glossary.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mossy-gray" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search terms…"
          className="pl-9"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-mossy-gray hover:text-forest-slate">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Alphabet index */}
      <div className="flex flex-wrap gap-1">
        {grouped.map(([letter]) => (
          <a
            key={letter}
            href={`#group-${letter}`}
            className="text-xs font-mono px-2 py-1 rounded-lg bg-surface border border-border text-mossy-gray hover:text-state-today hover:border-state-today/30 transition-colors"
          >
            {letter}
          </a>
        ))}
      </div>

      {/* Grouped terms */}
      {grouped.map(([letter, groupTerms]) => (
        <div key={letter} id={`group-${letter}`}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-mono text-sm font-bold text-mossy-gray">{letter}</h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2">
            {groupTerms.map((term) => {
              const sourceDoc = docMap.get(term.docId);
              return (
                <div key={term.id} className="group bg-surface rounded-2xl border border-border p-4 shadow-card task-row-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-forest-slate text-sm">{term.term}</h3>
                      <p className="text-sm text-mossy-gray mt-1 leading-relaxed">{term.definition}</p>
                      {sourceDoc && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <ExternalLink className="h-3 w-3 text-mossy-gray" />
                          <Link
                            href={`/documents/${sourceDoc.id}`}
                            className="text-xs text-state-today hover:underline truncate"
                          >
                            {sourceDoc.title}
                          </Link>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(term.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-mossy-gray transition-all shrink-0"
                      aria-label={`Delete term ${term.term}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
