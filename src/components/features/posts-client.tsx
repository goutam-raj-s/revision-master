"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, Trash2, Calendar, ExternalLink, Check, Loader2, Copy, Share2 as Linkedin, MessageSquare as Twitter, Camera as Instagram, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  createPostDraftAction,
  updatePostDraftAction,
  deletePostDraftAction,
} from "@/actions/posts";
import type { PostDraft, PostPlatform } from "@/types";

const PLATFORMS: { id: PostPlatform; label: string; icon: typeof Linkedin }[] = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "twitter", label: "X / Twitter", icon: Twitter },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "other", label: "Other", icon: FileText },
];

function openToPost(platform: PostPlatform, body: string) {
  navigator.clipboard.writeText(body).catch(() => {});
  if (platform === "twitter") {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(body)}`, "_blank", "noopener");
  } else if (platform === "linkedin") {
    window.open("https://www.linkedin.com/feed/?shareActive=true", "_blank", "noopener");
    toast("Text copied — paste it into LinkedIn", { variant: "default" });
  } else {
    toast("Text copied to clipboard", { variant: "default" });
  }
}

export function PostsClient({ initial }: { initial: PostDraft[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = React.useState(initial);
  const [body, setBody] = React.useState("");
  const [platform, setPlatform] = React.useState<PostPlatform>("linkedin");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setDrafts(initial), [initial]);

  async function create() {
    if (!body.trim()) return;
    setSaving(true);
    const res = await createPostDraftAction(body, platform);
    setSaving(false);
    if (res.success) {
      setBody("");
      toast("Draft saved", { variant: "success" });
      router.refresh();
    } else {
      toast(res.error ?? "Could not save", { variant: "error" });
    }
  }

  async function patch(id: string, p: Parameters<typeof updatePostDraftAction>[1]) {
    const res = await updatePostDraftAction(id, p);
    if (res.success) router.refresh();
    else toast(res.error ?? "Could not update", { variant: "error" });
  }

  async function remove(id: string) {
    const res = await deletePostDraftAction(id);
    if (res.success) router.refresh();
  }

  const groups: { key: PostDraft["status"]; label: string }[] = [
    { key: "draft", label: "Drafts" },
    { key: "scheduled", label: "Scheduled" },
    { key: "published", label: "Published" },
  ];

  return (
    <div className="space-y-6">
      {/* Composer */}
      <Card className="p-5 shadow-card">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                platform === p.id ? "bg-state-today/10 text-state-today" : "text-mossy-gray hover:bg-canvas"
              }`}
            >
              <p.icon className="h-3.5 w-3.5" /> {p.label}
            </button>
          ))}
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Draft a post about what you learned…"
          className="min-h-[120px] resize-none text-sm"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-mossy-gray">{body.length} characters</span>
          <Button onClick={create} disabled={saving || !body.trim()} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Save draft
          </Button>
        </div>
      </Card>

      {groups.map((g) => {
        const items = drafts.filter((d) => d.status === g.key);
        if (items.length === 0) return null;
        return (
          <div key={g.key}>
            <h2 className="mb-2 text-sm font-semibold text-forest-slate">{g.label} <span className="text-mossy-gray">({items.length})</span></h2>
            <div className="space-y-2">
              {items.map((d) => (
                <PostCard key={d.id} draft={d} onPatch={patch} onRemove={remove} />
              ))}
            </div>
          </div>
        );
      })}

      <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-xs text-mossy-gray">
        Posting is manual today: compose here, then <strong>open the platform</strong> to publish and paste the link back.
        Automatic publishing (LinkedIn / Instagram APIs) can be enabled once you connect a developer app.
      </p>
    </div>
  );
}

function PostCard({
  draft,
  onPatch,
  onRemove,
}: {
  draft: PostDraft;
  onPatch: (id: string, p: Parameters<typeof updatePostDraftAction>[1]) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [body, setBody] = React.useState(draft.body);
  const [url, setUrl] = React.useState(draft.publishedUrl ?? "");
  const Icon = PLATFORMS.find((p) => p.id === draft.platform)?.icon ?? FileText;

  return (
    <Card className="p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-mossy-gray">
          <Icon className="h-3.5 w-3.5" /> {PLATFORMS.find((p) => p.id === draft.platform)?.label}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => navigator.clipboard.writeText(draft.body).then(() => toast("Copied"))} className="p-1.5 text-mossy-gray hover:text-forest-slate" title="Copy">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onRemove(draft.id)} className="p-1.5 text-mossy-gray hover:text-destructive" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[90px] resize-none text-sm" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setBody(draft.body); }}>Cancel</Button>
            <Button size="sm" onClick={() => { onPatch(draft.id, { body }); setEditing(false); }}>Save</Button>
          </div>
        </div>
      ) : (
        <p onClick={() => setEditing(true)} className="cursor-text whitespace-pre-wrap text-sm text-forest-slate">{draft.body}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        {draft.status !== "published" && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openToPost(draft.platform, draft.body)}>
            <ExternalLink className="h-3.5 w-3.5" /> Open {PLATFORMS.find((p) => p.id === draft.platform)?.label} to post
          </Button>
        )}
        {draft.status === "draft" && (
          <label className="flex items-center gap-1.5 text-xs text-mossy-gray">
            <Calendar className="h-3.5 w-3.5" />
            <input
              type="datetime-local"
              className="rounded-md border border-border bg-canvas px-2 py-1 text-xs"
              onChange={(e) => onPatch(draft.id, { status: "scheduled", scheduledFor: e.target.value })}
            />
          </label>
        )}
        {draft.status === "scheduled" && draft.scheduledFor && (
          <span className="text-xs text-state-upcoming">Scheduled {new Date(draft.scheduledFor).toLocaleString()}</span>
        )}
        {draft.status !== "published" ? (
          <div className="ml-auto flex items-center gap-1.5">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Published URL" className="h-8 w-40 text-xs" />
            <Button size="sm" className="gap-1.5" onClick={() => onPatch(draft.id, { status: "published", publishedUrl: url })} disabled={!url.trim()}>
              <Check className="h-3.5 w-3.5" /> Mark posted
            </Button>
          </div>
        ) : (
          draft.publishedUrl && (
            <a href={draft.publishedUrl} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-xs text-state-today hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> View post
            </a>
          )
        )}
      </div>
    </Card>
  );
}
