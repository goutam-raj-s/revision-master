"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  Camera,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Heart,
  Image as ImageIcon,
  Link2,
  Loader2,
  MessageCircle,
  MessageSquare as Twitter,
  PenLine,
  Rocket,
  Send,
  Share2 as Linkedin,
  Trash2,
  Unplug,
  UserRound,
  X,
} from "lucide-react";
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
import {
  createLinkedInCommentAction,
  createLinkedInReactionAction,
  deleteLinkedInCommentAction,
  deleteLinkedInReactionAction,
  disconnectSocialAction,
  editLinkedInCommentAction,
  listLinkedInPostsAction,
  publishPostAction,
} from "@/actions/social";
import type { PostDraft, PostPlatform, SocialConnection, SocialProvider } from "@/types";
import type { LinkedInReactionType } from "@/lib/social";
import type { LinkedInPostSummary } from "@/lib/social";

const PLATFORMS: { id: PostPlatform; label: string; icon: typeof Linkedin; max?: number }[] = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, max: 3000 },
  { id: "twitter", label: "X / Twitter", icon: Twitter, max: 280 },
  { id: "instagram", label: "Instagram", icon: Camera },
  { id: "other", label: "Other", icon: FileText },
];

const DIRECT: Record<string, SocialProvider> = { linkedin: "linkedin", twitter: "twitter" };
type LinkedInActivity = "posts" | "comments" | "reactions" | "profile";

const LINKEDIN_ACTIVITIES: { id: LinkedInActivity; label: string; icon: typeof PenLine }[] = [
  { id: "posts", label: "Posts", icon: PenLine },
  { id: "comments", label: "Comments", icon: MessageCircle },
  { id: "reactions", label: "Reactions", icon: Heart },
  { id: "profile", label: "Profile", icon: UserRound },
];

const REACTIONS: { id: LinkedInReactionType; label: string }[] = [
  { id: "LIKE", label: "Like" },
  { id: "PRAISE", label: "Celebrate" },
  { id: "EMPATHY", label: "Love" },
  { id: "INTEREST", label: "Insightful" },
  { id: "APPRECIATION", label: "Support" },
  { id: "ENTERTAINMENT", label: "Funny" },
];

function openToPost(platform: PostPlatform, body: string) {
  navigator.clipboard.writeText(body).catch(() => {});
  if (platform === "twitter") {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(body)}`, "_blank", "noopener");
  } else if (platform === "linkedin") {
    window.open("https://www.linkedin.com/feed/?shareActive=true", "_blank", "noopener");
    toast("Text copied - paste it into LinkedIn", { variant: "default" });
  } else {
    toast("Text copied to clipboard", { variant: "default" });
  }
}

function readImageFile(file: File): Promise<{ imageDataUrl: string; imageName: string; imageMimeType: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose an image file."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Keep LinkedIn image attachments under 5 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve({ imageDataUrl: reader.result, imageName: file.name, imageMimeType: file.type });
      } else {
        reject(new Error("Could not read image."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
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
  const [account, setAccount] = React.useState<PostPlatform>("linkedin");
  const [linkedinActivity, setLinkedinActivity] = React.useState<LinkedInActivity>("posts");

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
  const activeProvider = DIRECT[account];
  const activeConnection = activeProvider ? connByProvider.get(activeProvider) : undefined;
  const activeDrafts = initial.filter((d) => d.platform === account);

  async function patch(id: string, p: Parameters<typeof updatePostDraftAction>[1]) {
    const res = await updatePostDraftAction(id, p);
    if (res.success) router.refresh();
    else toast(res.error ?? "Could not update", { variant: "error" });
  }

  async function remove(id: string) {
    const res = await deletePostDraftAction(id);
    if (res.success) router.refresh();
    else toast(res.error ?? "Could not delete", { variant: "error" });
  }

  return (
    <div className="space-y-6">
      <ConnectionsBar
        connections={connByProvider}
        configured={configured}
        onChange={() => router.refresh()}
      />

      <Card className="p-3 shadow-card sm:p-4">
        <div className="grid gap-2 sm:grid-cols-4">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            const provider = DIRECT[p.id];
            const conn = provider ? connByProvider.get(provider) : undefined;
            const active = account === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setAccount(p.id);
                  if (p.id !== "linkedin") setLinkedinActivity("posts");
                }}
                className={`flex min-h-16 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                  active
                    ? "border-state-today bg-state-today/10 text-forest-slate"
                    : "border-border bg-canvas text-mossy-gray hover:border-state-today/60"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{p.label}</span>
                  <span className="block truncate text-xs">
                    {conn ? conn.displayName ?? "Connected" : provider ? "Connect to publish" : "Draft and track"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {account === "linkedin" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {LINKEDIN_ACTIVITIES.map((activity) => {
              const Icon = activity.icon;
              const active = linkedinActivity === activity.id;
              return (
                <button
                  key={activity.id}
                  onClick={() => setLinkedinActivity(activity.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-state-today/10 text-state-today"
                      : "text-mossy-gray hover:bg-canvas"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {activity.label}
                </button>
              );
            })}
          </div>

          {linkedinActivity === "posts" && (
            <PostsActivity
              platform="linkedin"
              drafts={activeDrafts}
              connected={Boolean(activeConnection && !activeConnection.expired)}
              onPatch={patch}
              onRemove={remove}
              onPublished={() => router.refresh()}
            />
          )}
          {linkedinActivity === "comments" && (
            <LinkedInComments connected={Boolean(activeConnection && !activeConnection.expired)} />
          )}
          {linkedinActivity === "reactions" && (
            <LinkedInReactions connected={Boolean(activeConnection && !activeConnection.expired)} />
          )}
          {linkedinActivity === "profile" && (
            <LinkedInProfile connection={activeConnection} configured={configured.includes("linkedin")} />
          )}
        </div>
      ) : (
        <PostsActivity
          platform={account}
          drafts={activeDrafts}
          connected={Boolean(activeConnection && !activeConnection.expired)}
          onPatch={patch}
          onRemove={remove}
          onPublished={() => router.refresh()}
        />
      )}
    </div>
  );
}

function PostsActivity({
  platform,
  drafts,
  connected,
  onPatch,
  onRemove,
  onPublished,
}: {
  platform: PostPlatform;
  drafts: PostDraft[];
  connected: boolean;
  onPatch: (id: string, p: Parameters<typeof updatePostDraftAction>[1]) => void;
  onRemove: (id: string) => void;
  onPublished: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [image, setImage] = React.useState<{
    imageDataUrl: string;
    imageName: string;
    imageMimeType: string;
  } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const activeMax = PLATFORMS.find((p) => p.id === platform)?.max;
  const overLimit = activeMax !== undefined && body.length > activeMax;
  const label = PLATFORMS.find((p) => p.id === platform)?.label ?? "Social";

  async function create() {
    if (!body.trim() && !image) return;
    setSaving(true);
    const res = await createPostDraftAction(body, platform, image ?? undefined);
    setSaving(false);
    if (res.success) {
      setBody("");
      setImage(null);
      toast("Draft saved", { variant: "success" });
      router.refresh();
    } else {
      toast(res.error ?? "Could not save", { variant: "error" });
    }
  }

  const groups: { key: PostDraft["status"]; label: string }[] = [
    { key: "draft", label: "Drafts" },
    { key: "scheduled", label: "Scheduled" },
    { key: "published", label: "Published" },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-5 shadow-card">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Draft a ${label} post about what you learned...`}
          className="min-h-[140px] resize-none text-sm"
        />
        {image && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-canvas p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.imageDataUrl} alt="" className="h-16 w-16 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-forest-slate">{image.imageName}</div>
              <div className="text-[11px] text-mossy-gray">LinkedIn image attachment</div>
            </div>
            <button type="button" onClick={() => setImage(null)} className="rounded-md p-1.5 text-mossy-gray hover:text-destructive" title="Remove image">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className={`text-xs ${overLimit ? "text-destructive" : "text-mossy-gray"}`}>
            {body.length}{activeMax ? ` / ${activeMax}` : ""} characters
          </span>
          <div className="flex items-center gap-2">
            {platform === "linkedin" && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-forest-slate hover:border-state-today hover:bg-state-today/5">
                <ImageIcon className="h-4 w-4" />
                Image
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    try {
                      setImage(await readImageFile(file));
                    } catch (err) {
                      toast(err instanceof Error ? err.message : "Could not attach image", { variant: "error" });
                    }
                  }}
                />
              </label>
            )}
            <Button onClick={create} disabled={saving || (!body.trim() && !image) || overLimit} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Save draft
            </Button>
          </div>
        </div>
      </Card>

      {groups.map((g) => {
        const items = drafts.filter((d) => d.status === g.key);
        if (items.length === 0) return null;
        return (
          <div key={g.key}>
            <h2 className="mb-2 text-sm font-semibold text-forest-slate">
              {g.label} <span className="text-mossy-gray">({items.length})</span>
            </h2>
            <div className="space-y-2">
              {items.map((d) => (
                <PostCard
                  key={d.id}
                  draft={d}
                  connected={connected}
                  onPatch={onPatch}
                  onRemove={onRemove}
                  onPublished={onPublished}
                />
              ))}
            </div>
          </div>
        );
      })}

      {drafts.length === 0 && (
        <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-xs text-mossy-gray">
          No {label} activity yet. Save a draft to start building the queue.
        </p>
      )}
    </div>
  );
}

function LinkedInComments({ connected }: { connected: boolean }) {
  const [target, setTarget] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [commentId, setCommentId] = React.useState("");
  const [editText, setEditText] = React.useState("");
  const [busy, setBusy] = React.useState<"create" | "edit" | "delete" | null>(null);
  const disabled = !connected;

  async function run(kind: "create" | "edit" | "delete") {
    setBusy(kind);
    const res =
      kind === "create"
        ? await createLinkedInCommentAction(target, comment)
        : kind === "edit"
          ? await editLinkedInCommentAction(target, commentId, editText)
          : await deleteLinkedInCommentAction(target, commentId);
    setBusy(null);
    if (res.success) {
      toast(
        kind === "create"
          ? `Comment posted${res.data?.id ? ` (${res.data.id})` : ""}`
          : kind === "edit"
            ? "Comment updated"
            : "Comment deleted",
        { variant: "success" }
      );
      if (kind === "create") {
        setComment("");
        if (res.data?.id) setCommentId(res.data.id);
      }
    } else {
      toast(res.error ?? "LinkedIn comment action failed", { variant: "error" });
    }
  }

  return (
    <Card className="space-y-4 p-5 shadow-card">
      <LinkedInPostTargetPicker
        value={target}
        onChange={setTarget}
        placeholder="LinkedIn post URL or URN"
        disabled={disabled}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[112px] resize-none text-sm"
            disabled={disabled}
          />
          <Button onClick={() => run("create")} disabled={disabled || busy !== null || !target.trim() || !comment.trim()} className="gap-1.5">
            {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            Post comment
          </Button>
        </div>
        <div className="space-y-3">
          <Input
            value={commentId}
            onChange={(e) => setCommentId(e.target.value)}
            placeholder="Comment ID or comment URN"
            disabled={disabled}
          />
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Updated comment text..."
            className="min-h-[72px] resize-none text-sm"
            disabled={disabled}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => run("edit")} disabled={disabled || busy !== null || !target.trim() || !commentId.trim() || !editText.trim()} className="gap-1.5">
              {busy === "edit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
              Edit comment
            </Button>
            <Button variant="ghost" onClick={() => run("delete")} disabled={disabled || busy !== null || !target.trim() || !commentId.trim()} className="gap-1.5 text-destructive hover:text-destructive">
              {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </Button>
          </div>
        </div>
      </div>
      {!connected && <ConnectNotice />}
    </Card>
  );
}

function LinkedInReactions({ connected }: { connected: boolean }) {
  const [target, setTarget] = React.useState("");
  const [reaction, setReaction] = React.useState<LinkedInReactionType>("LIKE");
  const [busy, setBusy] = React.useState<"create" | "delete" | null>(null);
  const disabled = !connected;

  async function react() {
    setBusy("create");
    const res = await createLinkedInReactionAction(target, reaction);
    setBusy(null);
    if (res.success) toast("Reaction added", { variant: "success" });
    else toast(res.error ?? "Reaction failed", { variant: "error" });
  }

  async function remove() {
    setBusy("delete");
    const res = await deleteLinkedInReactionAction(target);
    setBusy(null);
    if (res.success) toast("Reaction removed", { variant: "success" });
    else toast(res.error ?? "Reaction delete failed", { variant: "error" });
  }

  return (
    <Card className="space-y-4 p-5 shadow-card">
      <LinkedInPostTargetPicker
        value={target}
        onChange={setTarget}
        placeholder="LinkedIn post, comment URL, or URN"
        disabled={disabled}
      />
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((r) => (
          <button
            key={r.id}
            onClick={() => setReaction(r.id)}
            disabled={disabled}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              reaction === r.id
                ? "border-state-today bg-state-today/10 text-state-today"
                : "border-border text-mossy-gray hover:bg-canvas"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={react} disabled={disabled || busy !== null || !target.trim()} className="gap-1.5">
          {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
          Add reaction
        </Button>
        <Button variant="outline" onClick={remove} disabled={disabled || busy !== null || !target.trim()} className="gap-1.5">
          {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Remove my reaction
        </Button>
      </div>
      {!connected && <ConnectNotice />}
    </Card>
  );
}

function LinkedInPostTargetPicker({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  const [posts, setPosts] = React.useState<LinkedInPostSummary[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  async function loadPosts() {
    setLoading(true);
    setLoadError(null);
    const res = await listLinkedInPostsAction();
    setLoading(false);
    setLoaded(true);
    if (res.success) {
      setPosts(res.data ?? []);
      if (!res.data?.length) toast("No recent LinkedIn posts found");
    } else {
      setPosts([]);
      setLoadError(res.error ?? "Could not load LinkedIn posts");
      toast(res.error ?? "Could not load LinkedIn posts", { variant: "error" });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="min-w-0 flex-1"
        />
        <Button variant="outline" onClick={loadPosts} disabled={disabled || loading} className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Load my posts
        </Button>
      </div>
      {posts.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => onChange(post.id)}
              className={`min-h-20 rounded-lg border p-3 text-left transition-colors ${
                value === post.id
                  ? "border-state-today bg-state-today/10"
                  : "border-border bg-canvas hover:border-state-today/60"
              }`}
            >
              <span className="line-clamp-2 block text-sm text-forest-slate">
                {post.commentary || "LinkedIn post"}
              </span>
              <span className="mt-2 block text-[11px] text-mossy-gray">
                {post.publishedAt || post.lastModifiedAt
                  ? new Date(post.publishedAt ?? post.lastModifiedAt ?? 0).toLocaleString()
                  : "Date unavailable"}
                {post.source === "lostbae" ? " - tracked in lostbae" : ""}
              </span>
            </button>
          ))}
        </div>
      )}
      {loaded && posts.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-xs text-mossy-gray">
          {loadError ?? "No authored LinkedIn posts came back. Posts published or marked posted in lostbae will appear here."}
        </p>
      )}
    </div>
  );
}

function LinkedInProfile({
  connection,
  configured,
}: {
  connection?: SocialConnection;
  configured: boolean;
}) {
  return (
    <Card className="space-y-4 p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-forest-slate">
            {connection?.displayName ?? "LinkedIn identity"}
          </div>
          <div className="text-xs text-mossy-gray">
            {connection
              ? `Connected ${new Date(connection.connectedAt).toLocaleString()}`
              : "Connect LinkedIn to use profile identity for social actions."}
          </div>
        </div>
        {!connection && (
          <a
            href={configured ? "/api/social/linkedin/connect" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              configured
                ? "bg-state-today text-white hover:bg-state-today/90"
                : "cursor-not-allowed bg-canvas text-mossy-gray"
            }`}
            onClick={configured ? undefined : (e) => e.preventDefault()}
          >
            Connect LinkedIn
          </a>
        )}
      </div>
      {connection?.expired && (
        <p className="flex items-start gap-1.5 rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          Session expired. Reconnect LinkedIn before publishing, commenting, or reacting.
        </p>
      )}
      <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-xs text-mossy-gray">
        This account is used as the actor for LinkedIn posts, comments, and reactions. LinkedIn profile editing is not exposed by the current OAuth permission.
      </p>
    </Card>
  );
}

function ConnectNotice() {
  return (
    <p className="flex items-start gap-1.5 rounded-lg bg-state-today/5 px-3 py-2 text-xs text-mossy-gray">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-state-today" />
      Connect or reconnect LinkedIn above before running this activity.
    </p>
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
                    {conn.expired ? <span className="text-destructive">Session expired - reconnect</span> : (conn.displayName ?? "Connected")}
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
      toast("Published", { variant: "success" });
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

      {draft.imageDataUrl && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-canvas p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={draft.imageDataUrl} alt="" className="h-20 w-20 rounded-md object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-forest-slate">{draft.imageName ?? "Image attachment"}</div>
            <div className="text-[11px] text-mossy-gray">Publishes with this LinkedIn post</div>
          </div>
          {draft.status !== "published" && (
            <button
              onClick={() => onPatch(draft.id, { imageDataUrl: null, imageName: null, imageMimeType: null })}
              className="rounded-md p-1.5 text-mossy-gray hover:text-destructive"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
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
            <ExternalLink className="h-3.5 w-3.5" /> Open {PLATFORMS.find((p) => p.id === draft.platform)?.label}
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
