"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseUdemyUrl } from "@/lib/udemy-utils";

export function UdemyUrlForm() {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = url.trim();
    const parsed = parseUdemyUrl(trimmed);

    if (!parsed) {
      setError("Please enter a valid Udemy course URL");
      return;
    }

    const params = new URLSearchParams({ course: parsed.courseSlug });
    if (parsed.lectureId) params.set("lecture", parsed.lectureId);

    router.push(`/study/udemy?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-state-today/10">
          <GraduationCap className="h-6 w-6 text-state-today" />
        </div>
        <h2 className="text-xl font-bold text-forest-slate">Udemy Study Session</h2>
        <p className="text-sm text-mossy-gray">
          Paste a Udemy course or lecture URL — Udemy will open alongside your notes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="udemy-url">Udemy Course URL</Label>
          <Input
            id="udemy-url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            placeholder="https://www.udemy.com/course/your-course/"
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button type="submit" disabled={!url.trim()} className="w-full gap-2">
          Start Session
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="rounded-xl border border-border/60 bg-canvas p-3 text-xs text-mossy-gray space-y-1.5">
        <p className="font-medium text-forest-slate">How it works</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>You must be logged into Udemy in this browser</li>
          <li>The course video opens in a side panel</li>
          <li>Take notes alongside — use timestamps to mark moments</li>
          <li>Notes auto-save as you type</li>
        </ul>
        <a
          href="https://www.udemy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-state-today hover:underline mt-1"
        >
          Open Udemy to log in <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <p className="text-xs text-mossy-gray text-center">
        Supports udemy.com/course/ and /learn/lecture/ URLs
      </p>
    </div>
  );
}
