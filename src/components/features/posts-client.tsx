"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Trash2, Calendar, ExternalLink, Check, Loader2, Copy, Share2 as Linkedin, MessageSquare as Twitter, Camera as Instagram, FileText, Rocket, Link2, Unplug, AlertCircle } from "lucide-react";
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
import { publishPostAction, disconnectSocialAction } from "@/actions/social";
import type { PostDraft, PostPlatform, SocialConnection, SocialProvider } from "@/types";

const PLATFORMS: { id: PostPlatform; label: string; icon: typeof Linkedin; max?: number }[] = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, max: 3000 },
  { id: "twitter", label: "X / Twitter", icon: Twitter, max: 280 },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "other", label: "Other", icon: FileText },
];

/** Platforms we can publish to directly via API. */
const DIRECT: Record<string, SocialProvider> = { linkedin: "linkedin", twitter: "twitter" };

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

export function PostsClient({
  initial,
  connections,
  configured,
}: {
  initial: PostDraft[];
  connections: SocialConnection[];
  configured: SocialProvider[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [drafts, setDrafts] = React.useState(initial);
  const [body, setBody] = React.useState("");
  const [platform, setPlatform] = React.useState<PostPlatform>("linkedin");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setDrafts(initial), [initial]);

  // Surface OAuth callback results (?social=…&status=…)
  React.useEffect(() => {
    const status = params.get("status");
    const social = params.get("social");
    if (!status || !social) return;
    if (status === "connected") toast(`${social} connected`, { variant: "success" });
    else if (status === "not_configured") toast(`${social} isn't configured on the server yet`, { variant: "error" });
    else toast(`Couldn't connect ${social}${params.get("reason") ? ` (${params.get("reason")})` : ""}`, { variant: "error" });
    router.replace("/posts");
  }, [params, router]);

  const connByProvider = React.useMemo(
    () => new Map(connections.map((c) => [c.provider, c])),
    [connections]
  );

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

  const activeMax = PLATFORMS.find((p) => p.id === platform)?.max;
  const overLimit = activeMax !== undefined && body.length > activeMax;

  return (
    <div className="space-y-6">
      {/* Connected accounts */}
      <ConnectionsBar
        connections={connByProvider}
        configured={configured}
        onChange={() => router.refresh()}
      />

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
          <span className={`text-xs ${overLimit ? "text-destructive" : "text-mossy-gray"}`}>
            {body.length}{activeMax ? ` / ${activeMax}` : ""} characters
          </span>
          <Button onClick={create} disabled={saving || !body.trim() || overLimit} className="gap-1.5">
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
                <PostCard
                  key={d.id}
                  draft={d}
                  connected={DIRECT[d.platform] ? connByProvider.has(DIRECT[d.platform]) : false}
                  onPatch={patch}
                  onRemove={remove}
                  onPublished={() => router.refresh()}
                />
              ))}
            </div>
          </div>
        );
      })}

      <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-xs text-mossy-gray">
        <strong>LinkedIn</strong> and <strong>X</strong> publish directly once connected above — including scheduled posts (auto-published in the background).
        Instagram has no text-only posting API, so it stays copy-and-open.
      </p>
    </div>
  );
}

function ConnectionsBar({
  connections,
  configured,
  onChange,
}: {
  connections: Map<SocialProvider, SocialConnection>;
  configured: SocialProvider[];
  onChange: () => void;
}) {
  const meta: Record<SocialProvider, { label: string; icon: typeof Linkedin }> = {
    linkedin: { label: "LinkedIn", icon: Linkedin },
    twitter: { label: "X (Twitter)", icon: Twitter },
  };
  const providers: SocialProvider[] = ["linkedin", "twitter"];

  async function disconnect(p: SocialProvider) {
    const res = await disconnectSocialAction(p);
    if (res.success) {
      toast(`${meta[p].label} disconnected`);
      onChange();
    }
  }

  return (
    <Card className="p-4 shadow-card">
      <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-forest-slate">
        <Link2 className="h-4 w-4 text-state-today" /> Connected accounts
      </div>
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => {
          const Icon = meta[p].icon;
          const conn = connections.get(p);
          const isConfigured = configured.includes(p);
          if (conn) {
            return (
              <div key={p} className="flex items-center gap-2 rounded-xl border border-border bg-canvas px-3 py-2">
                <Icon className="h-4 w-4 text-state-today" />
                <div className="leading-tight">
                  <div className="text-xs font-medium text-forest-slate">{meta[p].label}</div>
                  <div className="text-[11px] text-mossy-gray">
                    {conn.expired ? <span className="text-destructive">Session expired — reconnect</span> : (conn.displayName ?? "Connected")}
                  </div>
                </div>
                {conn.expired ? (
                  <a href={`/api/social/${p}/connect`} className="ml-1 rounded-lg bg-state-today/10 px-2 py-1 text-[11px] font-medium text-state-today hover:bg-state-today/20">Reconnect</a>
                ) : (
                  <button onClick={() => disconnect(p)} className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-mossy-gray hover:text-destructive" title="Disconnect">
                    <Unplug className="h-3 w-3" /> Disconnect
                  </button>
                )}
              </div>
            );
          }
          return (
            <a
              key={p}
              href={isConfigured ? `/api/social/${p}/connect` : undefined}
              onClick={isConfigured ? undefined : (e) => { e.preventDefault(); toast(`${meta[p].label} isn't configured on the server yet`, { variant: "error" }); }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                isConfigured
                  ? "border-border text-forest-slate hover:border-state-today hover:bg-state-today/5 cursor-pointer"
                  : "border-dashed border-border text-mossy-gray cursor-not-allowed"
              }`}
            >
              <Icon className="h-4 w-4" />
              Connect {meta[p].label}
              {!isConfigured && <span className="text-[10px] uppercase tracking-wide">(keys needed)</span>}
            </a>
          );
        })}
      </div>
    </Card>
  );
}

function PostCard({
  draft,
  connected,
  onPatch,
  onRemove,
  onPublished,
}: {
  draft: PostDraft;
  connected: boolean;
  onPatch: (id: string, p: Parameters<typeof updatePostDraftAction>[1]) => void;
  onRemove: (id: string) => void;
  onPublished: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [body, setBody] = React.useState(draft.body);
  const [url, setUrl] = React.useState(draft.publishedUrl ?? "");
  const [publishing, setPublishing] = React.useState(false);
  const Icon = PLATFORMS.find((p) => p.id === draft.platform)?.icon ?? FileText;
  const canDirect = Boolean(DIRECT[draft.platform]);

  async function publishNow() {
    setPublishing(true);
    const res = await publishPostAction(draft.id);
    setPublishing(false);
    if (res.success) {
      toast("Published 🎉", { variant: "success" });
      onPublished();
    } else {
      toast(res.error ?? "Publish failed", { variant: "error" });
    }
  }

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

      {draft.publishError && draft.status !== "published" && (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-destructive/5 px-2.5 py-1.5 text-[11px] text-destructive">
          <AlertCircle className="mt-px h-3 w-3 shrink-0" /> {draft.publishError}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        {draft.status !== "published" && canDirect && (
          <Button size="sm" className="gap-1.5" onClick={publishNow} disabled={publishing || !connected} title={connected ? undefined : "Connect the account above first"}>
            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
            {connected ? "Publish now" : "Connect to publish"}
          </Button>
        )}
        {draft.status !== "published" && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openToPost(draft.platform, draft.body)}>
            <ExternalLink className="h-3.5 w-3.5" /> Open {PLATFORMS.find((p) => p.id === draft.platform)?.label} to post
          </Button>
        )}
        {draft.status === "draft" && (
          <label className="flex items-center gap-1.5 text-xs text-mossy-gray" title={canDirect && connected ? "Scheduled posts auto-publish" : "Set a reminder time"}>
            <Calendar className="h-3.5 w-3.5" />
            <input
              type="datetime-local"
              className="rounded-md border border-border bg-canvas px-2 py-1 text-xs"
              onChange={(e) => onPatch(draft.id, { status: "scheduled", scheduledFor: e.target.value })}
            />
          </label>
        )}
        {draft.status === "scheduled" && draft.scheduledFor && (
          <span className="text-xs text-state-upcoming">
            {canDirect && connected ? "Auto-publishing" : "Scheduled"} {new Date(draft.scheduledFor).toLocaleString()}
          </span>
        )}
        {draft.status !== "published" ? (
          <div className="ml-auto flex items-center gap-1.5">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Or paste URL" className="h-8 w-36 text-xs" />
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onPatch(draft.id, { status: "published", publishedUrl: url })} disabled={!url.trim()}>
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
