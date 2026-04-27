"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createNativeDocumentAction } from "@/actions/documents";
import { toast } from "@/components/ui/toast";
import type { Difficulty } from "@/types";

export default function CreateDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [difficulty, setDifficulty] = React.useState<Difficulty>("medium");
  const [delayDays, setDelayDays] = React.useState("2");
  const [isCreating, setIsCreating] = React.useState(false);

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast("Title is required", { variant: "error" });
      return;
    }

    setIsCreating(true);
    const result = await createNativeDocumentAction({
      title,
      content: "", // Start empty
      tags,
      difficulty,
      delayDays: parseInt(delayDays),
    });

    if (result.success && result.data) {
      toast("Document created successfully", { variant: "success" });
      router.push(`/documents/${result.data.docId}`);
    } else {
      toast(result.error || "Failed to create document", { variant: "error" });
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/documents"
            className="p-2 rounded-full hover:bg-surface border border-transparent hover:border-border transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-mossy-gray" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-forest-slate tracking-tight">Create Document</h1>
            <p className="text-sm text-mossy-gray mt-1">Design your own study materials from scratch.</p>
          </div>
        </div>
        <Button onClick={handleCreate} disabled={isCreating || !title.trim()} className="gap-2 shadow-lg shadow-state-today/20">
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isCreating ? "Creating…" : "Initialize Document"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4 bg-surface rounded-3xl border border-border p-8 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium ml-1">Document Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Advanced Quantum Mechanics Notes"
                className="text-lg font-serif h-14 rounded-2xl focus:ring-state-today/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium ml-1">Initial Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag…"
                  className="rounded-xl h-11"
                />
                <Button variant="outline" onClick={handleAddTag} className="rounded-xl h-11">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="tag"
                    className="px-3 py-1.5 rounded-full text-sm group transition-all hover:pr-8 relative"
                  >
                    #{tag}
                    <button
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <p className="text-xs text-mossy-gray italic">No tags added yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-canvas/50 rounded-3xl border-2 border-dashed border-border p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-surface rounded-2xl border border-border flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="h-8 w-8 text-state-today/60" />
            </div>
            <div className="max-w-xs mx-auto">
              <h3 className="text-lg font-semibold text-forest-slate">Editor Experience</h3>
              <p className="text-sm text-mossy-gray mt-1">
                Once you initialize the document, you'll get access to the full rich-text editor to craft your content.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-semibold text-mossy-gray uppercase tracking-widest">SRS Settings</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger id="difficulty" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (More gap between reviews)</SelectItem>
                    <SelectItem value="medium">Medium (Standard schedule)</SelectItem>
                    <SelectItem value="hard">Hard (Frequent reviews)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay">First Review Date</Label>
                <Select value={delayDays} onValueChange={setDelayDays}>
                  <SelectTrigger id="delay" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">+1 day</SelectItem>
                    <SelectItem value="2">+2 days (Standard)</SelectItem>
                    <SelectItem value="3">+3 days</SelectItem>
                    <SelectItem value="7">+7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-[10px] text-mossy-gray leading-relaxed">
                Your document will be automatically added to your spaced repetition queue after initialization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
