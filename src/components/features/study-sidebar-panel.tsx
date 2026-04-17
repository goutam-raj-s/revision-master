"use client";

import * as React from "react";
import {
  Plus, Trash2, Check, Loader2, BookText, X, RotateCcw, PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import {
  createNoteAction, createTermAction, deleteNoteAction,
  markNoteDoneAction, deleteTermAction,
} from "@/actions/notes";
import { updateDocumentAction, rescheduleDocAction } from "@/actions/documents";
import type { Document, Repetition, Note, Term, Difficulty } from "@/types";

type SidebarTab = "overview" | "notes" | "terms";

interface StudySidebarPanelProps {
  doc: Document;
  rep: Repetition | null;
  initialNotes: Note[];
  initialTerms: Term[];
  onClose?: () => void;
}

export function StudySidebarPanel({
  doc,
  rep,
  initialNotes,
  initialTerms,
  onClose,
}: StudySidebarPanelProps) {
  const [activeTab, setActiveTab] = React.useState<SidebarTab>("overview");

  // Overview state
  const [difficulty, setDifficulty] = React.useState<Difficulty>(doc.difficulty);
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>(doc.tags);
  const [savingTags, setSavingTags] = React.useState(false);
  const [rescheduleDays, setRescheduleDays] = React.useState(7);
  const [rescheduling, setRescheduling] = React.useState(false);

  // Notes state
  const [notes, setNotes] = React.useState<Note[]>(initialNotes);
  const [newNote, setNewNote] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);

  // Terms state
  const [terms, setTerms] = React.useState<Term[]>(initialTerms);
  const [newTerm, setNewTerm] = React.useState("");
  const [newDefinition, setNewDefinition] = React.useState("");
  const [savingTerm, setSavingTerm] = React.useState(false);

  const activeNotes = notes.filter((n) => !n.isDone);

  // ─── Overview handlers ──────────────────────────────────────────────────────
  async function handleDifficultyChange(val: string) {
    setDifficulty(val as Difficulty);
    const fd = new FormData();
    fd.set("docId", doc.id);
    fd.set("difficulty", val);
    await updateDocumentAction({ success: false }, fd);
    toast("Difficulty updated", { variant: "success" });
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
  }

  async function handleReschedule() {
    setRescheduling(true);
    await rescheduleDocAction(doc.id, rescheduleDays);
    toast(`Rescheduled +${rescheduleDays} days`, { variant: "success" });
    setRescheduling(false);
  }

  // ─── Notes handlers ─────────────────────────────────────────────────────────
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

  // ─── Terms handlers ─────────────────────────────────────────────────────────
  async function handleSaveTerm() {
    if (!newTerm.trim() || !newDefinition.trim()) return;
    setSavingTerm(true);
    const fd = new FormData();
    fd.set("docId", doc.id);
    fd.set("term", newTerm.trim());
    fd.set("definition", newDefinition.trim());
    const result = await createTermAction({ success: false }, fd);
    if (result.success && result.data) {
      setTerms((prev) => [...prev, result.data!].sort((a, b) => a.term.localeCompare(b.term)));
      setNewTerm("");
      setNewDefinition("");
      toast("Term saved to glossary", { variant: "success" });
    }
    setSavingTerm(false);
  }

  async function handleDeleteTerm(termId: string) {
    await deleteTermAction(termId);
    setTerms((prev) => prev.filter((t) => t.id !== termId));
    toast("Term deleted");
  }

  const tagsChanged = JSON.stringify(tags) !== JSON.stringify(doc.tags);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface border-l border-border">
      {/* Sidebar header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/60 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-mossy-gray font-medium mb-0.5">Document</p>
          <h2 className="font-serif font-medium text-forest-slate text-sm leading-snug line-clamp-2">
            {doc.title}
          </h2>
        </div>
        {onClose && (
          <SimpleTooltip content="Collapse sidebar" side="left">
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg hover:bg-canvas text-mossy-gray transition-colors"
              aria-label="Collapse sidebar"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          </SimpleTooltip>
        )}
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-border/60">
        {(["overview", "notes", "terms"] as SidebarTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium capitalize transition-colors",
              activeTab === tab
                ? "text-state-today border-b-2 border-state-today"
                : "text-mossy-gray hover:text-forest-slate"
            )}
          >
            {tab === "notes" ? `Notes (${activeNotes.length})` : tab === "terms" ? `Terms (${terms.length})` : tab}
          </button>
        ))}
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── Overview tab ─────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            {/* Difficulty */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-mossy-gray">Difficulty</Label>
              <Select value={difficulty} onValueChange={handleDifficultyChange}>
                <SelectTrigger className="h-8 text-xs">
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
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-mossy-gray">Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag…"
                  className="flex-1 h-8 text-xs"
                />
                <SimpleTooltip content="Add tag">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={handleAddTag}
                    aria-label="Add tag"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </SimpleTooltip>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="tag" className="gap-1 cursor-default">
                    #{tag}
                    <button
                      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      className="hover:text-destructive"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
                {tags.length === 0 && <span className="text-xs text-mossy-gray">No tags yet</span>}
              </div>
              {tagsChanged && (
                <Button
                  size="sm"
                  onClick={handleSaveTags}
                  disabled={savingTags}
                  className="w-full text-xs"
                >
                  {savingTags ? "Saving…" : "Save Tags"}
                </Button>
              )}
            </div>

            {/* Review Schedule */}
            {rep ? (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-mossy-gray">Review Schedule</Label>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-xs text-mossy-gray">Next review</span>
                    <span className="font-mono text-xs text-forest-slate">
                      {new Date(rep.nextReviewDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-mossy-gray">Interval</span>
                    <span className="font-mono text-xs text-forest-slate">{rep.intervalDays}d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-mossy-gray">Reviews done</span>
                    <span className="font-mono text-xs text-forest-slate">{rep.reviewCount}</span>
                  </div>
                </div>

                {/* Reschedule control */}
                <div className="flex items-center gap-2 pt-1">
                  <Select
                    value={String(rescheduleDays)}
                    onValueChange={(v) => setRescheduleDays(Number(v))}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 7, 14, 21, 30].map((d) => (
                        <SelectItem key={d} value={String(d)}>+{d} days</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <SimpleTooltip content="Apply reschedule">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReschedule}
                      disabled={rescheduling}
                      className="shrink-0"
                      aria-label="Reschedule"
                    >
                      {rescheduling
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <RotateCcw className="h-3.5 w-3.5" />
                      }
                    </Button>
                  </SimpleTooltip>
                </div>
              </div>
            ) : (
              <p className="text-xs text-mossy-gray">No review schedule yet.</p>
            )}
          </>
        )}

        {/* ── Notes tab ────────────────────────────────────────────────── */}
        {activeTab === "notes" && (
          <>
            {/* New note */}
            <div className="space-y-1.5">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note…"
                className="text-xs min-h-[72px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSaveNote();
                }}
              />
              <Button
                size="sm"
                onClick={handleSaveNote}
                disabled={!newNote.trim() || savingNote}
                className="w-full text-xs"
              >
                {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Save Note
                <span className="ml-auto text-white/50 font-mono">⌘↵</span>
              </Button>
            </div>

            {/* Active notes */}
            {activeNotes.map((note) => (
              <div key={note.id} className="group bg-canvas rounded-xl border border-border p-3 relative">
                <p className="text-xs text-forest-slate leading-relaxed pr-12">{note.content}</p>
                <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SimpleTooltip content="Mark done" side="left">
                    <button
                      onClick={() => handleMarkNoteDone(note.id)}
                      className="p-1 rounded-lg hover:bg-state-today/10 hover:text-state-today text-mossy-gray transition-colors"
                      aria-label="Mark note done"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </SimpleTooltip>
                  <SimpleTooltip content="Delete note" side="left">
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive text-mossy-gray transition-colors"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </SimpleTooltip>
                </div>
              </div>
            ))}

            {/* Done notes */}
            {notes.filter((n) => n.isDone).length > 0 && (
              <div>
                <p className="text-xs text-mossy-gray font-medium mb-1.5">Archived</p>
                {notes.filter((n) => n.isDone).map((note) => (
                  <div key={note.id} className="group relative bg-canvas/50 rounded-xl border border-border/50 px-3 py-2 opacity-60 mb-1.5">
                    <p className="text-xs text-mossy-gray line-through pr-8">{note.content}</p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-destructive text-mossy-gray"
                      aria-label="Delete archived note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {notes.length === 0 && (
              <p className="text-xs text-mossy-gray text-center py-4">No notes yet. Add one above!</p>
            )}
          </>
        )}

        {/* ── Terms tab ────────────────────────────────────────────────── */}
        {activeTab === "terms" && (
          <>
            {/* New term */}
            <div className="space-y-1.5">
              <Input
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Term (e.g. Cache Stampede)"
                className="text-xs h-8"
              />
              <Textarea
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                placeholder="Definition…"
                className="text-xs min-h-[60px] resize-none"
              />
              <Button
                size="sm"
                onClick={handleSaveTerm}
                disabled={!newTerm.trim() || !newDefinition.trim() || savingTerm}
                className="w-full text-xs"
              >
                {savingTerm ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookText className="h-3 w-3" />}
                Save Term
              </Button>
            </div>

            {/* Terms list */}
            {terms.map((term) => (
              <div key={term.id} className="group relative bg-canvas rounded-xl border border-border p-3">
                <div className="text-xs font-semibold text-forest-slate pr-7">{term.term}</div>
                <div className="text-xs text-mossy-gray mt-1 leading-relaxed">{term.definition}</div>
                <SimpleTooltip content="Delete term" side="left">
                  <button
                    onClick={() => handleDeleteTerm(term.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive text-mossy-gray transition-all"
                    aria-label="Delete term"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </SimpleTooltip>
              </div>
            ))}

            {terms.length === 0 && (
              <p className="text-xs text-mossy-gray text-center py-4">No terms yet. Build your glossary!</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
