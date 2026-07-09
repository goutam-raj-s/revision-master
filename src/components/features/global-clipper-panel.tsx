"use client";

import { useEffect, useRef, useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface GlobalClipperPanelProps {
  onClose: () => void;
}

export function GlobalClipperPanel({ onClose }: GlobalClipperPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      title: formData.get("title") as string,
      url: formData.get("url") as string,
      notes: formData.get("notes") as string,
      tags: formData.get("tags") as string,
      terminology: formData.get("terminology") as string,
      actionIfExists: formData.get("actionIfExists") as string,
    };

    setPending(true);
    try {
      const res = await fetch("/api/documents/clipper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("Error", {
          description: data.error || "Failed to save",
          variant: "error",
        });
        return;
      }

      toast("Saved to Revision Master", {
        description: "Your clip has been saved successfully.",
        variant: "success",
      });
      onClose();
    } catch {
      toast("Error", {
        description: "Network error",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex max-h-[90vh] w-[320px] min-w-[300px] max-w-[90vw] resize flex-col overflow-auto rounded-xl border border-zinc-200 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Quick Clip</h3>
        <button
          onClick={onClose}
          className="text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label="Close clipper"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
        <div className="space-y-1">
          <label htmlFor="clipper-title" className="text-xs font-medium text-zinc-500">Title</label>
          <input ref={inputRef} id="clipper-title" name="title" required placeholder="Document Title" className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800" />
        </div>

        <div className="space-y-1">
          <label htmlFor="clipper-url" className="text-xs font-medium text-zinc-500">URL</label>
          <input id="clipper-url" name="url" required type="url" placeholder="https://..." className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800" />
        </div>

        <div className="space-y-1">
          <label htmlFor="clipper-action" className="text-xs font-medium text-zinc-500">If URL already saved:</label>
          <select id="clipper-action" name="actionIfExists" className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800">
            <option value="append">Append note to existing</option>
            <option value="create_new">Create new document</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="clipper-notes" className="text-xs font-medium text-zinc-500">Notes (Optional)</label>
          <textarea id="clipper-notes" name="notes" rows={2} placeholder="Add your notes..." className="w-full resize-none rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800" />
        </div>

        <div className="space-y-1">
          <label htmlFor="clipper-tags" className="text-xs font-medium text-zinc-500">Tags</label>
          <input id="clipper-tags" name="tags" placeholder="e.g. react, chrome extension" className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800" />
        </div>

        <div className="space-y-1">
          <label htmlFor="clipper-terminology" className="text-xs font-medium text-zinc-500">Terminology</label>
          <textarea id="clipper-terminology" name="terminology" rows={2} placeholder="Term: Definition" className="w-full resize-none rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800" />
        </div>

        <Button type="submit" disabled={pending} className="mt-2 w-full gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "Saving..." : "Save Clip"}
        </Button>
      </form>
    </div>
  );
}
