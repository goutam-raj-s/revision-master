"use client";

import * as React from "react";
import { Check, X, Plus, Loader2, Lightbulb, Ban, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { updateTermDetailsAction } from "@/actions/notes";
import type { Term } from "@/types";

/** Expandable example / anti-example / related-terms for a glossary term. */
export function TermDetails({ term }: { term: Term }) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [example, setExample] = React.useState(term.example ?? "");
  const [antiExample, setAntiExample] = React.useState(term.antiExample ?? "");
  const [related, setRelated] = React.useState((term.relatedTerms ?? []).join(", "));

  const hasDetails = term.example || term.antiExample || (term.relatedTerms?.length ?? 0) > 0;

  async function save() {
    setSaving(true);
    const res = await updateTermDetailsAction(term.id, {
      example,
      antiExample,
      relatedTerms: related.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setSaving(false);
    if (res.success) {
      term.example = example.trim() || undefined;
      term.antiExample = antiExample.trim() || undefined;
      term.relatedTerms = related.split(",").map((s) => s.trim()).filter(Boolean);
      setEditing(false);
      toast("Details saved", { variant: "success" });
    } else {
      toast(res.error ?? "Could not save", { variant: "error" });
    }
  }

  if (editing) {
    return (
      <div className="mt-3 space-y-2 rounded-xl border border-border bg-canvas/50 p-3">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-mossy-gray">Example</label>
        <Textarea value={example} onChange={(e) => setExample(e.target.value)} placeholder="A concrete example…" className="min-h-[56px] resize-none text-sm" />
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-mossy-gray">Anti-example (what it&apos;s NOT)</label>
        <Textarea value={antiExample} onChange={(e) => setAntiExample(e.target.value)} placeholder="A common misconception or counter-example…" className="min-h-[56px] resize-none text-sm" />
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-mossy-gray">Related terms (comma-separated)</label>
        <Input value={related} onChange={(e) => setRelated(e.target.value)} placeholder="closure, scope, hoisting" className="h-9 text-sm" />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {term.example && (
        <div className="flex gap-2 text-sm">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-state-today" />
          <span className="text-forest-slate"><span className="text-mossy-gray">e.g. </span>{term.example}</span>
        </div>
      )}
      {term.antiExample && (
        <div className="flex gap-2 text-sm">
          <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-state-stale" />
          <span className="text-forest-slate"><span className="text-mossy-gray">not: </span>{term.antiExample}</span>
        </div>
      )}
      {term.relatedTerms && term.relatedTerms.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5 text-mossy-gray" />
          {term.relatedTerms.map((r) => (
            <span key={r} className="rounded-md bg-muted px-2 py-0.5 text-xs text-mossy-gray">{r}</span>
          ))}
        </div>
      )}
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-xs text-mossy-gray transition-colors hover:text-state-today"
      >
        <Plus className="h-3 w-3" /> {hasDetails ? "Edit details" : "Add example / details"}
      </button>
    </div>
  );
}
