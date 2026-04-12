"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Link2, Loader2, AlertTriangle, X, Plus, CheckCircle2, GitMerge, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { addDocumentAction, fetchDocTitleAction, mergeDocumentsAction } from "@/actions/documents";
import { isValidGoogleDocUrl } from "@/lib/utils";
import type { ActionResult, SimilarityMatch } from "@/types";

const initialState: ActionResult<{ docId: string; similarMatches: SimilarityMatch[] }> = { success: false };

export function AddDocumentForm() {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [fetchingTitle, setFetchingTitle] = React.useState(false);
  const [urlError, setUrlError] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [delay, setDelay] = React.useState("2");
  const [difficulty, setDifficulty] = React.useState("medium");
  const [similarMatches, setSimilarMatches] = React.useState<SimilarityMatch[]>([]);
  const [showSimilarity, setShowSimilarity] = React.useState(false);
  const [state, action, pending] = useActionState(addDocumentAction, initialState);

  React.useEffect(() => {
    if (state.success && state.data) {
      if (state.data.similarMatches.length > 0) {
        setSimilarMatches(state.data.similarMatches);
        setShowSimilarity(true);
      } else {
        toast("Document added!", { variant: "success", description: "Scheduled for review" });
        router.push("/dashboard");
      }
    }
  }, [state, router]);

  async function handleUrlBlur() {
    if (!url || !isValidGoogleDocUrl(url)) {
      if (url) setUrlError("Please enter a valid Google Docs URL (docs.google.com)");
      return;
    }
    setUrlError("");
    if (title) return;

    setFetchingTitle(true);
    const result = await fetchDocTitleAction(url);
    if (result.success && result.data) {
      setTitle(result.data.title);
    } else {
      setTitle("");
      setUrlError(result.error || "Could not fetch document title.");
    }
    setFetchingTitle(false);
  }

  function handleAddTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  }

  async function handleMerge(parentDocId: string) {
    if (!state.data?.docId) return;
    await mergeDocumentsAction(state.data.docId, parentDocId);
    toast("Documents merged!", { variant: "success" });
    setShowSimilarity(false);
    router.push("/documents");
  }

  function handleIgnoreSimilarity() {
    setShowSimilarity(false);
    toast("Document added as new entry", { variant: "success" });
    router.push("/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Similarity Warning Banner */}
      {showSimilarity && (
        <div className="mb-6 rounded-2xl border border-state-upcoming/30 bg-state-upcoming/5 p-5 animate-slide-down">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-state-upcoming mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-forest-slate mb-1">
                Insight match detected
              </h3>
              <p className="text-sm text-mossy-gray mb-3">
                This document appears to overlap with existing knowledge in your library.
              </p>
              <div className="space-y-2">
                {similarMatches.map((match) => (
                  <div
                    key={match.doc.id}
                    className="flex items-center justify-between gap-3 bg-surface rounded-xl border border-border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-forest-slate truncate">{match.doc.title}</div>
                      <div className="text-xs text-mossy-gray mt-0.5">{match.reason}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMerge(match.doc.id)}
                        className="text-xs gap-1.5"
                      >
                        <GitMerge className="h-3.5 w-3.5" />
                        Merge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3">
                <Button variant="ghost" size="sm" onClick={handleIgnoreSimilarity}>
                  Ignore — keep as new document
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form action={action} className="space-y-5">
        {state.error && (
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-slide-down">
            {state.error}
          </div>
        )}

        {/* URL */}
        <div className="space-y-1.5">
          <Label htmlFor="url">Google Doc URL <span className="text-destructive">*</span></Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Link2 className="h-4 w-4 text-mossy-gray" />
            </div>
            <Input
              id="url"
              name="url"
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
              onBlur={handleUrlBlur}
              placeholder="https://docs.google.com/document/d/..."
              className="pl-9"
              required
            />
            {fetchingTitle && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-state-today" />
            )}
          </div>
          {urlError && <p className="text-xs text-destructive">{urlError}</p>}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">
            Document Title
            {fetchingTitle && <span className="ml-2 text-mossy-gray font-normal">(fetching…)</span>}
          </Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Auto-extracted from the document"
            required
          />
        </div>

        {/* Difficulty + Initial delay row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select name="difficulty" value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="initialDelayDays">First Review</Label>
            <Select name="initialDelayDays" value={delay} onValueChange={setDelay}>
              <SelectTrigger id="initialDelayDays">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 7, 14, 21, 30].map((d) => (
                  <SelectItem key={d} value={String(d)}>+{d} days{d === 2 ? " (default)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <Label htmlFor="tag-input">Tags</Label>
          <div className="flex gap-2">
            <Input
              id="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tag and press Enter"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddTag} aria-label="Add tag">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {/* Hidden input with serialized tags */}
          <input type="hidden" name="tags" value={tags.join(",")} />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="tag" className="gap-1.5 cursor-default">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="hover:text-destructive transition-colors"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={pending || !url || !title} className="w-full mt-2">
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding to library…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Add to Library
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
