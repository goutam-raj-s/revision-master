"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, Loader2, BookText, FileText, Tag, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import {
  createNoteAction, createTermAction, deleteNoteAction,
  markNoteDoneAction, updateNoteAction, deleteTermAction,
} from "@/actions/notes";
import { updateDocumentAction, rescheduleDocAction } from "@/actions/documents";
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

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left: Notes & Terms */}
      <div className="lg:col-span-2 space-y-6">
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
            {activeNotes.map((note) => (
              <div key={note.id} className="group relative bg-surface rounded-2xl border border-border p-4 shadow-card">
                <p className="text-sm text-forest-slate leading-relaxed pr-16">{note.content}</p>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMarkNoteDone(note.id)}
                    className="p-1.5 rounded-lg hover:bg-state-today/10 hover:text-state-today text-mossy-gray transition-colors"
                    title="Mark done"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-mossy-gray transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Done notes (archived) */}
            {doneNotes.length > 0 && (
              <div>
                <p className="text-xs text-mossy-gray font-medium mb-2">Archived</p>
                {doneNotes.map((note) => (
                  <div key={note.id} className="group relative bg-canvas rounded-xl border border-border/50 px-4 py-3 opacity-60">
                    <p className="text-sm text-mossy-gray line-through pr-10">{note.content}</p>
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

            {activeNotes.length === 0 && doneNotes.length === 0 && (
              <div className="text-center py-8 text-sm text-mossy-gray">
                No notes yet. Write one above!
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
            {terms.map((term) => (
              <div key={term.id} className="group relative bg-surface rounded-2xl border border-border p-4 shadow-card">
                <div className="text-sm font-semibold text-forest-slate">{term.term}</div>
                <div className="text-sm text-mossy-gray mt-1 leading-relaxed">{term.definition}</div>
                <button
                  onClick={() => handleDeleteTerm(term.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-mossy-gray transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {terms.length === 0 && (
              <div className="text-center py-8 text-sm text-mossy-gray">
                No terms yet. Build your glossary!
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
            <Button type="button" variant="outline" size="icon-sm" onClick={handleAddTag}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
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
