"use client";

import * as React from "react";
import { Share2, Check, Copy, Globe, Mail, Trash2, Loader2, Eye, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  createYoutubeShareAction,
  revokeYoutubeShareAction,
  getYoutubeShareAction,
} from "@/actions/youtube-shares";
import type { YoutubeShare } from "@/types";

interface YoutubeShareButtonProps {
  resourceType: "session" | "playlist";
  resourceId: string;
  title: string;
}

type Tab = "public" | "email";

export function YoutubeShareButton({ resourceType, resourceId, title }: YoutubeShareButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("public");
  const [accessLevel, setAccessLevel] = React.useState<"read" | "write">("read");
  const [emailInput, setEmailInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [existingShare, setExistingShare] = React.useState<YoutubeShare | null | undefined>(undefined);

  React.useEffect(() => {
    if (!open) return;
    setExistingShare(undefined);
    getYoutubeShareAction(resourceType, resourceId).then((res) => {
      const share = res.success ? (res.data ?? null) : null;
      setExistingShare(share);
      if (share) setAccessLevel(share.accessLevel);
    });
  }, [open, resourceType, resourceId]);

  const shareUrl = existingShare
    ? `${window.location.origin}/shared/youtube/${existingShare.token}`
    : null;

  async function handleCopyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast("Link copied", { variant: "success" });
    setTimeout(() => setCopied(false), 1400);
  }

  async function handleCreatePublic() {
    setLoading(true);
    const res = await createYoutubeShareAction(resourceType, resourceId, title, "public", undefined, accessLevel);
    setLoading(false);
    if (!res.success) { toast(res.error ?? "Failed", { variant: "error" }); return; }
    const url = `${window.location.origin}/shared/youtube/${res.data!.token}`;
    await navigator.clipboard.writeText(url);
    toast("Share link created and copied!", { variant: "success" });
    setExistingShare({ id: "", token: res.data!.token, ownerId: "", resourceType, resourceId, accessLevel, shareType: "public", title, createdAt: new Date().toISOString() });
  }

  async function handleSendEmail() {
    const emails = emailInput.split(/[\s,;]+/).map((e) => e.trim()).filter((e) => e.includes("@"));
    if (emails.length === 0) { toast("Enter at least one valid email", { variant: "error" }); return; }
    setLoading(true);
    const res = await createYoutubeShareAction(resourceType, resourceId, title, "email", emails, accessLevel);
    setLoading(false);
    if (!res.success) { toast(res.error ?? "Failed", { variant: "error" }); return; }
    toast(`Invite sent to ${emails.length} address${emails.length > 1 ? "es" : ""}`, { variant: "success" });
    setEmailInput("");
    setExistingShare({ id: "", token: res.data!.token, ownerId: "", resourceType, resourceId, accessLevel, shareType: "email", emails, title, createdAt: new Date().toISOString() });
  }

  async function handleRevoke() {
    if (!existingShare) return;
    setLoading(true);
    const res = await revokeYoutubeShareAction(existingShare.token);
    setLoading(false);
    if (!res.success) { toast(res.error ?? "Failed to revoke", { variant: "error" }); return; }
    toast("Share link revoked", { variant: "success" });
    setExistingShare(null);
  }

  const isLoading = existingShare === undefined || loading;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs"
        aria-label={`Share ${title}`}
        title={`Share ${title}`}
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Share &ldquo;{title}&rdquo;</DialogTitle>
          </DialogHeader>

          {/* Access level */}
          <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
            <button onClick={() => setAccessLevel("read")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${accessLevel === "read" ? "bg-surface shadow-sm text-forest-slate" : "text-mossy-gray hover:text-forest-slate"}`}>
              <Eye className="h-3.5 w-3.5" /> Read only
            </button>
            <button onClick={() => setAccessLevel("write")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${accessLevel === "write" ? "bg-surface shadow-sm text-forest-slate" : "text-mossy-gray hover:text-forest-slate"}`}>
              <Pencil className="h-3.5 w-3.5" /> Can edit
            </button>
          </div>

          {/* Share type tabs */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button onClick={() => setTab("public")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "public" ? "bg-surface shadow-sm text-forest-slate" : "text-mossy-gray hover:text-forest-slate"}`}>
              <Globe className="h-3.5 w-3.5" /> Public Link
            </button>
            <button onClick={() => setTab("email")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "email" ? "bg-surface shadow-sm text-forest-slate" : "text-mossy-gray hover:text-forest-slate"}`}>
              <Mail className="h-3.5 w-3.5" /> Email Invite
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-mossy-gray" /></div>
          ) : (
            <div className="space-y-4 pt-1">
              {existingShare && shareUrl && (
                <div className="flex items-center gap-2">
                  <Input readOnly value={shareUrl} className="font-mono text-xs bg-muted text-mossy-gray" />
                  <Button variant="outline" size="icon-sm" onClick={handleCopyLink} title="Copy link">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}
              {tab === "public" && (
                <div className="space-y-3">
                  <p className="text-sm text-mossy-gray">Anyone with the link can access this {resourceType}.</p>
                  {!existingShare ? (
                    <Button className="w-full" onClick={handleCreatePublic} disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                      Create &amp; Copy Link
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleRevoke} disabled={loading}>
                      <Trash2 className="h-3.5 w-3.5" /> Revoke Link
                    </Button>
                  )}
                </div>
              )}
              {tab === "email" && (
                <div className="space-y-3">
                  <Input placeholder="alice@example.com, bob@example.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendEmail()} />
                  <div className="flex items-center gap-2">
                    <Button className="flex-1" onClick={handleSendEmail} disabled={loading || !emailInput.trim()}>
                      {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                      Send Invite
                    </Button>
                    {existingShare && (
                      <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleRevoke} disabled={loading}>
                        <Trash2 className="h-3.5 w-3.5" /> Revoke
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
