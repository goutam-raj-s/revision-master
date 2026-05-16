"use client";

import { useState, useEffect, useRef } from "react";
import { X, Save } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { addDocumentAction } from "@/actions/documents";
import { useActionState } from "react";
import { toast } from "@/components/ui/toast";
import { ActionResult } from "@/types";

export function GlobalClipperWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, formAction] = useActionState(
    async (prev: any, formData: FormData) => {
      // Create a web clip document natively using existing actions
      // Wait, we can use addDocumentAction but it expects a Google Doc URL.
      // We should use the API we just created, or a native server action.
      // Let's use fetch to the API we just created since it handles it.
      
      const payload = {
        title: formData.get("title") as string,
        url: formData.get("url") as string,
        notes: formData.get("notes") as string,
        tags: formData.get("tags") as string,
        terminology: formData.get("terminology") as string,
        actionIfExists: formData.get("actionIfExists") as string,
      };

      try {
        const res = await fetch("/api/documents/clipper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "Failed to save" };
        }
        
        return { success: true, data: { docId: data.docId } };
      } catch (err) {
        return { success: false, error: "Network error" };
      }
    },
    { success: false } as ActionResult<any>
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Focus input when opened
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (state?.success) {
      toast("Saved to Revision Master", {
        description: "Your clip has been saved successfully.",
        variant: "success",
      });
      setIsOpen(false);
    } else if (state?.error) {
      toast("Error", {
        description: state.error,
        variant: "error",
      });
    }
  }, [state]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[320px] min-w-[300px] max-w-[90vw] max-h-[90vh] resize overflow-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Quick Clip</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form action={formAction} className="p-4 flex flex-col gap-3">
        <div className="space-y-1">
          <label htmlFor="clipper-title" className="text-xs font-medium text-zinc-500">Title</label>
          <input
            ref={inputRef}
            id="clipper-title"
            name="title"
            required
            placeholder="Document Title"
            className="w-full text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-transparent"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="clipper-url" className="text-xs font-medium text-zinc-500">URL</label>
          <input
            id="clipper-url"
            name="url"
            required
            type="url"
            placeholder="https://..."
            className="w-full text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-transparent"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="clipper-action" className="text-xs font-medium text-zinc-500">If URL already saved:</label>
          <select
            id="clipper-action"
            name="actionIfExists"
            className="w-full text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-transparent"
          >
            <option value="append">Append note to existing</option>
            <option value="create_new">Create new document</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="clipper-notes" className="text-xs font-medium text-zinc-500">Notes (Optional)</label>
          <textarea
            id="clipper-notes"
            name="notes"
            rows={2}
            placeholder="Add your notes..."
            className="w-full text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-transparent resize-none"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="clipper-tags" className="text-xs font-medium text-zinc-500">Tags</label>
          <input
            id="clipper-tags"
            name="tags"
            placeholder="e.g. react, chrome extension"
            className="w-full text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-transparent"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="clipper-terminology" className="text-xs font-medium text-zinc-500">Terminology</label>
          <textarea
            id="clipper-terminology"
            name="terminology"
            rows={2}
            placeholder="Term: Definition"
            className="w-full text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-transparent resize-none"
          />
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full mt-2 gap-2">
      <Save className="w-4 h-4" />
      {pending ? "Saving..." : "Save Clip"}
    </Button>
  );
}
