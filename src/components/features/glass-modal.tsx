"use client";

import * as React from "react";
import {
  X,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  Plus,
  Tag,
  BookText,
  ChevronDown,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { cn, getGoogleDocEmbedUrl, formatRelativeDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { completeReviewAction, rescheduleDocAction, updateDocumentAction } from "@/actions/documents";
import { createNoteAction, createTermAction, getDocNotes, getDocTerms, deleteNoteAction } from "@/actions/notes";
import type { TaskItem, Note, Term, Difficulty } from "@/types";

interface GlassModalProps {
  task: TaskItem | null;
  onClose: () => void;
  onComplete: (docId: string) => void;
}

export function GlassModal({ task, onClose, onComplete }: GlassModalProps) {
  const [iframeLoaded, setIframeLoaded] = React.useState(false);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [terms, setTerms] = React.useState<Term[]>([]);
  const [newNote, setNewNote] = React.useState("");
  const [newTerm, setNewTerm] = React.useState("");
  const [newDefinition, setNewDefinition] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [savingTerm, setSavingTerm] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const [rescheduleDays, setRescheduleDays] = React.useState(7);
  const [activeTab, setActiveTab] = React.useState<"notes" | "terms">("notes");
  const [difficulty, setDifficulty] = React.useState<Difficulty>(task?.doc.difficulty ?? "medium");

  React.useEffect(() => {
    if (!task) return;
    setIframeLoaded(false);
    setNotes([]);
    setTerms([]);
    setDifficulty(task.doc.difficulty);

    // Load notes and terms
    getDocNotes(task.doc.id).then(setNotes);
    getDocTerms(task.doc.id).then(setTerms);
  }, [task?.doc.id]);

  // Trap focus and handle Escape
  React.useEffect(() => {
    if (!task) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "e" && !e.metaKey && !e.ctrlKey) {
        const active = document.activeElement;
        const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
        if (!isInput) handleComplete();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [task, onClose]);

  async function handleComplete() {
    if (!task) return;
    setCompleting(true);
    await completeReviewAction(task.doc.id);
    toast("Review complete!", { variant: "success", description: "Rescheduled for next interval" });
    onComplete(task.doc.id);
    onClose();
  }

  async function handleReschedule() {
    if (!task) return;
    await rescheduleDocAction(task.doc.id, rescheduleDays);
    toast(`Rescheduled for +${rescheduleDays} days`, { variant: "success" });
    onClose();
  }

  async function handleSaveNote() {
    if (!task || !newNote.trim()) return;
    setSavingNote(true);
    const fd = new FormData();
    fd.set("docId", task.doc.id);
    fd.set("content", newNote.trim());
    const result = await createNoteAction({ success: false }, fd);
    if (result.success && result.data) {
      setNotes((prev) => [result.data!, ...prev]);
      setNewNote("");
      toast("Note saved", { variant: "success" });
    }
    setSavingNote(false);
  }

  async function handleSaveTerm() {
    if (!task || !newTerm.trim() || !newDefinition.trim()) return;
    setSavingTerm(true);
    const fd = new FormData();
    fd.set("docId", task.doc.id);
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

  async function handleDifficultyChange(val: string) {
    if (!task) return;
    const d = val as Difficulty;
    setDifficulty(d);
    const fd = new FormData();
    fd.set("docId", task.doc.id);
    fd.set("difficulty", d);
    await updateDocumentAction({ success: false }, fd);
  }

  async function handleDeleteNote(noteId: string) {
    await deleteNoteAction(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  if (!task) return null;

  const embedUrl = getGoogleDocEmbedUrl(task.doc.url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Reviewing: ${task.doc.title}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-forest-slate/25 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl h-[88vh] glass-surface rounded-3xl overflow-hidden shadow-glass animate-slide-up flex">
        {/* Left pane — Google Doc (70%) */}
        <div className="flex-1 relative bg-white/60 border-r border-border/50">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="shimmer-bg absolute inset-0" />
              <div className="relative flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 text-state-today animate-spin" />
                <span className="text-sm text-mossy-gray">Loading document…</span>
              </div>
            </div>
          )}
          <iframe
            src={embedUrl}
            title={task.doc.title}
            className={cn(
              "w-full h-full border-0 transition-opacity duration-500",
              iframeLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIframeLoaded(true)}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            loading="eager"
          />
          {/* External link */}
          <a
            href={task.doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/90 border border-border text-xs text-mossy-gray hover:text-forest-slate shadow-soft transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Open in Google Docs
          </a>
        </div>

        {/* Right pane — Metadata sidebar (30%) */}
        <div className="w-80 shrink-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border/50">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-serif font-medium text-forest-slate text-sm leading-snug line-clamp-2">
                {task.doc.title}
              </h2>
              <button
                onClick={onClose}
                className="shrink-0 p-1.5 rounded-lg hover:bg-canvas text-mossy-gray transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant={task.urgency === "today" ? "today" : task.urgency === "overdue" ? "stale" : "upcoming"}>
                {formatRelativeDate(task.repetition.nextReviewDate)}
              </Badge>
              {task.doc.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="tag">#{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="px-5 py-3 border-b border-border/50">
            <Label className="text-xs mb-1.5 block">Difficulty</Label>
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

          {/* Tabs: Notes / Terms */}
          <div className="flex border-b border-border/50">
            <button
              onClick={() => setActiveTab("notes")}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-colors",
                activeTab === "notes"
                  ? "text-state-today border-b-2 border-state-today"
                  : "text-mossy-gray hover:text-forest-slate"
              )}
            >
              Notes ({notes.filter((n) => !n.isDone).length})
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-colors",
                activeTab === "terms"
                  ? "text-state-today border-b-2 border-state-today"
                  : "text-mossy-gray hover:text-forest-slate"
              )}
            >
              Terms ({terms.length})
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === "notes" && (
              <>
                {/* New note input */}
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
                  </Button>
                </div>

                {/* Existing notes */}
                {notes.filter((n) => !n.isDone).map((note) => (
                  <div key={note.id} className="group bg-surface rounded-xl border border-border p-3 relative">
                    <p className="text-xs text-forest-slate leading-relaxed pr-6">{note.content}</p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive text-mossy-gray transition-all"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {notes.filter((n) => !n.isDone).length === 0 && (
                  <p className="text-xs text-mossy-gray text-center py-4">No notes yet. Add one above!</p>
                )}
              </>
            )}

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

                {/* Existing terms */}
                {terms.map((term) => (
                  <div key={term.id} className="bg-surface rounded-xl border border-border p-3">
                    <div className="text-xs font-semibold text-forest-slate">{term.term}</div>
                    <div className="text-xs text-mossy-gray mt-1 leading-relaxed">{term.definition}</div>
                  </div>
                ))}
                {terms.length === 0 && (
                  <p className="text-xs text-mossy-gray text-center py-4">No terms yet. Build your glossary!</p>
                )}
              </>
            )}
          </div>

          {/* Footer CTAs */}
          <div className="p-4 border-t border-border/50 space-y-2">
            {/* Reschedule */}
            <div className="flex items-center gap-2">
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
              <Button variant="outline" size="sm" onClick={handleReschedule} className="shrink-0">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Complete */}
            <Button
              className="w-full"
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Mark Complete
              <span className="ml-auto text-white/50 text-xs font-mono">[E]</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
