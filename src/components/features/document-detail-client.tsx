"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, Loader2, BookText, FileText, X, Save, Search, Copy, CalendarDays } from "lucide-react";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import {
  createNoteAction, createTermAction, deleteNoteAction,
  markNoteDoneAction, deleteTermAction,
} from "@/actions/notes";
import { updateDocumentAction } from "@/actions/documents";
import type { Document, Repetition, Note, Term, Difficulty } from "@/types";

interface DocumentDetailClientProps {
  doc: Document;
  rep: Repetition | null;
  initialNotes: Note[];
  initialTerms: Term[];
}

export function DocumentDetailClient({ doc, rep, initialNotes, initialTerms }: DocumentDetailClientProps) {
  const router = useRouter();
  const [notes, setNotes] = React.useState(initialNotes);
  const [terms, setTerms] = React.useState(initialTerms);
  const [newNote, setNewNote] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [newTerm, setNewTerm] = React.useState("");
  const [newDef, setNewDef] = React.useState("");
  const [savingTerm, setSavingTerm] = React.useState(false);
  const [difficulty, setDifficulty] = React.useState<Difficulty>(doc.difficulty);
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>(doc.tags);
  const [savingTags, setSavingTags] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<"notes" | "terms">("notes");
  const [query, setQuery] = React.useState("");
  const recentTags = tags.slice(-3);
  const hiddenTagCount = Math.max(0, tags.length - recentTags.length);

  async function handleSaveNote() {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const fd = new FormData();
    fd.set("docId", doc.id);
    fd.set("content", newNote.trim());
    const result = await createNoteAction({ success: false }, fd);
    if (result.success && result.data) {
      setNotes((prev) => [result.data!, ...prev]);
      setNewNote("");
      toast("Note saved", { variant: "success" });
    } else {
      toast(result.error || "Failed to save note", { variant: "error" });
    }
    setSavingNote(false);
  }

  async function handleDeleteNote(noteId: string) {
    await deleteNoteAction(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast("Note deleted");
  }

  async function handleMarkNoteDone(noteId: string) {
    await markNoteDoneAction(noteId);
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, isDone: true } : n));
  }

  async function handleSaveTerm() {
    if (!newTerm.trim() || !newDef.trim()) return;
    setSavingTerm(true);
    const fd = new FormData();
    fd.set("docId", doc.id);
    fd.set("term", newTerm.trim());
    fd.set("definition", newDef.trim());
    const result = await createTermAction({ success: false }, fd);
    if (result.success && result.data) {
      setTerms((prev) => [...prev, result.data!].sort((a, b) => a.term.localeCompare(b.term)));
      setNewTerm("");
      setNewDef("");
      toast("Term saved to glossary", { variant: "success" });
    }
    setSavingTerm(false);
  }

  async function handleDeleteTerm(termId: string) {
    await deleteTermAction(termId);
    setTerms((prev) => prev.filter((t) => t.id !== termId));
    toast("Term deleted");
  }

  function handleAddTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  async function handleSaveTags() {
    setSavingTags(true);
    const fd = new FormData();
    fd.set("docId", doc.id);
    fd.set("tags", tags.join(","));
    await updateDocumentAction({ success: false }, fd);
    toast("Tags updated", { variant: "success" });
    setSavingTags(false);
    router.refresh();
  }

  async function handleDifficultyChange(val: string) {
    setDifficulty(val as Difficulty);
    const fd = new FormData();
    fd.set("docId", doc.id);
    fd.set("difficulty", val);
    await updateDocumentAction({ success: false }, fd);
    toast("Difficulty updated", { variant: "success" });
  }

  const activeNotes = notes.filter((n) => !n.isDone);
  const doneNotes = notes.filter((n) => n.isDone);
  const lowerQuery = query.trim().toLowerCase();
  const visibleActiveNotes = lowerQuery
    ? activeNotes.filter((note) => note.content.toLowerCase().includes(lowerQuery))
    : activeNotes;
  const visibleDoneNotes = lowerQuery
    ? doneNotes.filter((note) => note.content.toLowerCase().includes(lowerQuery))
    : doneNotes;
  const visibleTerms = lowerQuery
    ? terms.filter((term) =>
        term.term.toLowerCase().includes(lowerQuery) ||
        term.definition.toLowerCase().includes(lowerQuery)
      )
    : terms;

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied`, { variant: "success" });
    } catch {
      toast("Could not copy", { variant: "error" });
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left: Notes & Terms */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <FileText className="mb-2 h-4 w-4 text-state-today" />
            <div className="text-2xl font-semibold text-forest-slate">{activeNotes.length}</div>
            <div className="text-xs text-mossy-gray">Open notes</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <BookText className="mb-2 h-4 w-4 text-state-today" />
            <div className="text-2xl font-semibold text-forest-slate">{terms.length}</div>
            <div className="text-xs text-mossy-gray">Glossary terms</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <CalendarDays className="mb-2 h-4 w-4 text-state-today" />
            <div className="truncate text-sm font-semibold text-forest-slate">
              {rep ? new Date(rep.nextReviewDate).toLocaleDateString() : "Not scheduled"}
            </div>
            <div className="text-xs text-mossy-gray">Next review</div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mossy-gray" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes and terms..."
            className="h-10 rounded-full pl-9 pr-10"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-mossy-gray hover:bg-canvas hover:text-forest-slate"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border gap-4">
          {(["notes", "terms"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={cn(
                "pb-2.5 text-sm font-medium border-b-2 transition-colors",
                activeSection === s
                  ? "border-state-today text-state-today"
                  : "border-transparent text-mossy-gray hover:text-forest-slate"
              )}
            >
              {s === "notes" ? `Notes (${activeNotes.length})` : `Terms (${terms.length})`}
            </button>
          ))}
        </div>

        {activeSection === "notes" && (
          <div className="space-y-4">
            {/* New note */}
            <div className="space-y-2">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write a note about this document…"
                className="min-h-[100px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSaveNote();
                }}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={!newNote.trim() || savingNote}
                  className="gap-1.5"
                >
                  {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Note
                </Button>
              </div>
            </div>

            {/* Active notes */}
            {visibleActiveNotes.map((note) => (
              <div key={note.id} className="group relative bg-surface rounded-2xl border border-border p-4 shadow-card">
                <p className="text-sm text-forest-slate leading-relaxed pr-16 whitespace-pre-wrap">{note.content}</p>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SimpleTooltip content="Copy note" side="left">
                    <button
                      onClick={() => copyText(note.content, "Note")}
                      className="p-1.5 rounded-lg hover:bg-state-today/10 hover:text-state-today text-mossy-gray transition-colors"
                      aria-label="Copy note"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </SimpleTooltip>
                  <SimpleTooltip content="Mark done" side="left">
                    <button
                      onClick={() => handleMarkNoteDone(note.id)}
                      className="p-1.5 rounded-lg hover:bg-state-today/10 hover:text-state-today text-mossy-gray transition-colors"
                      aria-label="Mark note done"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </SimpleTooltip>
                  <SimpleTooltip content="Delete note" side="left">
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-mossy-gray transition-colors"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </SimpleTooltip>
                </div>
              </div>
            ))}

            {/* Done notes (archived) */}
            {doneNotes.length > 0 && (
              <div>
                <p className="text-xs text-mossy-gray font-medium mb-2">Archived</p>
                {visibleDoneNotes.map((note) => (
                  <div key={note.id} className="group relative bg-canvas rounded-xl border border-border/50 px-4 py-3 opacity-60">
                    <p className="text-sm text-mossy-gray line-through pr-10 whitespace-pre-wrap">{note.content}</p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-destructive text-mossy-gray"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeNotes.length === 0 && doneNotes.length === 0 ? (
              <div className="text-center py-8 text-sm text-mossy-gray">
                No notes yet. Write one above!
              </div>
            ) : visibleActiveNotes.length === 0 && visibleDoneNotes.length === 0 && (
              <div className="text-center py-8 text-sm text-mossy-gray">
                No notes match your search.
              </div>
            )}
          </div>
        )}

        {activeSection === "terms" && (
          <div className="space-y-4">
            {/* New term */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3 shadow-card">
              <Label className="text-xs uppercase tracking-wide text-mossy-gray">Add Term to Glossary</Label>
              <Input
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Term (e.g., Cache Stampede)"
              />
              <Textarea
                value={newDef}
                onChange={(e) => setNewDef(e.target.value)}
                placeholder="Definition…"
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveTerm}
                  disabled={!newTerm.trim() || !newDef.trim() || savingTerm}
                  className="gap-1.5"
                >
                  {savingTerm ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookText className="h-3.5 w-3.5" />}
                  Save Term
                </Button>
              </div>
            </div>

            {/* Terms list */}
            {visibleTerms.map((term) => (
              <div key={term.id} className="group relative bg-surface rounded-2xl border border-border p-4 shadow-card">
                <div className="text-sm font-semibold text-forest-slate">{term.term}</div>
                <div className="text-sm text-mossy-gray mt-1 leading-relaxed">{term.definition}</div>
                <SimpleTooltip content="Copy term" side="left">
                  <button
                    onClick={() => copyText(`${term.term}: ${term.definition}`, "Term")}
                    className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-state-today/10 hover:text-state-today text-mossy-gray transition-all"
                    aria-label="Copy term"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </SimpleTooltip>
                <SimpleTooltip content="Delete term" side="left">
                  <button
                    onClick={() => handleDeleteTerm(term.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-mossy-gray transition-all"
                    aria-label="Delete term"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </SimpleTooltip>
              </div>
            ))}
            {terms.length === 0 ? (
              <div className="text-center py-8 text-sm text-mossy-gray">
                No terms yet. Build your glossary!
              </div>
            ) : visibleTerms.length === 0 && (
              <div className="text-center py-8 text-sm text-mossy-gray">
                No terms match your search.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Metadata panel */}
      <div className="space-y-4">
        {/* Difficulty */}
        <div className="bg-surface rounded-2xl border border-border p-4 space-y-2 shadow-card">
          <Label className="text-xs uppercase tracking-wide text-mossy-gray">Difficulty</Label>
          <Select value={difficulty} onValueChange={handleDifficultyChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div className="bg-surface rounded-2xl border border-border p-4 space-y-3 shadow-card">
          <Label className="text-xs uppercase tracking-wide text-mossy-gray">Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); handleAddTag(); } }}
              placeholder="Add tag…"
              className="flex-1 h-8 text-xs"
            />
            <SimpleTooltip content="Add tag">
              <Button type="button" variant="outline" size="icon-sm" onClick={handleAddTag} aria-label="Add tag">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </SimpleTooltip>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentTags.map((tag) => (
              <Badge key={tag} variant="tag" className="gap-1 cursor-default">
                #{tag}
                <button
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  className="hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
            {hiddenTagCount > 0 && (
              <Badge
                variant="outline"
                className="cursor-default"
                title={tags.slice(0, -3).map((tag) => `#${tag}`).join(", ")}
              >
                +{hiddenTagCount}
              </Badge>
            )}
            {tags.length === 0 && <span className="text-xs text-mossy-gray">No tags yet</span>}
          </div>
          {JSON.stringify(tags) !== JSON.stringify(doc.tags) && (
            <Button size="sm" onClick={handleSaveTags} disabled={savingTags} className="w-full">
              {savingTags ? "Saving…" : "Save Tags"}
            </Button>
          )}
        </div>

        {/* Review info */}
        {rep && (
          <div className="bg-surface rounded-2xl border border-border p-4 space-y-2 shadow-card">
            <Label className="text-xs uppercase tracking-wide text-mossy-gray">Review Schedule</Label>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-mossy-gray">Next review</span>
                <span className="font-mono text-xs text-forest-slate">{new Date(rep.nextReviewDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mossy-gray">Interval</span>
                <span className="font-mono text-xs text-forest-slate">{rep.intervalDays}d</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mossy-gray">Reviews done</span>
                <span className="font-mono text-xs text-forest-slate">{rep.reviewCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
