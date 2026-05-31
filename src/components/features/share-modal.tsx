"use client";

import * as React from "react";
import { Check, Copy, Globe, Mail, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { createShareAction, revokeShareAction, getDocShareAction } from "@/actions/shares";
import type { DocumentShare } from "@/types";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docId: string;
  docTitle: string;
}

type Tab = "public" | "email";

export function ShareModal({ open, onOpenChange, docId, docTitle }: ShareModalProps) {
  const [tab, setTab] = React.useState<Tab>("public");
  const [emailInput, setEmailInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [existingShare, setExistingShare] = React.useState<DocumentShare | null | undefined>(undefined);

  // Load existing share when modal opens
  React.useEffect(() => {
    if (!open) return;
    setExistingShare(undefined);
    getDocShareAction(docId).then((res) => {
      setExistingShare(res.success ? (res.data ?? null) : null);
    });
  }, [open, docId]);

  const shareUrl = existingShare
    ? `${window.location.origin}/shared/${existingShare.token}`
    : null;

  async function handleCopyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast("Link copied to clipboard", { variant: "success" });
    setTimeout(() => setCopied(false), 1400);
  }

  async function handleCreatePublic() {
    setLoading(true);
    const res = await createShareAction(docId, "public");
    setLoading(false);
    if (!res.success) {
      toast(res.error ?? "Failed to create share link", { variant: "error" });
      return;
    }
    const url = `${window.location.origin}/shared/${res.data!.token}`;
    await navigator.clipboard.writeText(url);
    toast("Share link created and copied!", { variant: "success" });
    setExistingShare({ id: "", token: res.data!.token, docId, ownerId: "", shareType: "public", createdAt: new Date().toISOString() });
  }

  async function handleSendEmail() {
    const emails = emailInput
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (emails.length === 0) {
      toast("Enter at least one valid email address", { variant: "error" });
      return;
    }
    setLoading(true);
    const res = await createShareAction(docId, "email", emails);
    setLoading(false);
    if (!res.success) {
      toast(res.error ?? "Failed to send invite", { variant: "error" });
      return;
    }
    toast(`Invite sent to ${emails.length} address${emails.length > 1 ? "es" : ""}`, { variant: "success" });
    setEmailInput("");
    setExistingShare({ id: "", token: res.data!.token, docId, ownerId: "", shareType: "email", emails, createdAt: new Date().toISOString() });
  }

  async function handleRevoke() {
    if (!existingShare) return;
    setLoading(true);
    const res = await revokeShareAction(existingShare.token);
    setLoading(false);
    if (!res.success) {
      toast(res.error ?? "Failed to revoke share", { variant: "error" });
      return;
    }
    toast("Share link revoked", { variant: "success" });
    setExistingShare(null);
  }

  const isLoading = existingShare === undefined || loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Share &ldquo;{docTitle}&rdquo;</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setTab("public")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "public" ? "bg-white shadow-sm text-forest-slate" : "text-mossy-gray hover:text-forest-slate"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Public Link
          </button>
          <button
            onClick={() => setTab("email")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "email" ? "bg-white shadow-sm text-forest-slate" : "text-mossy-gray hover:text-forest-slate"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email Invite
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-mossy-gray" />
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Existing share link display */}
            {existingShare && shareUrl && (
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-xs bg-muted text-mossy-gray"
                />
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            )}

            {tab === "public" && (
              <div className="space-y-3">
                <p className="text-sm text-mossy-gray">
                  Anyone with the link can view this document and all its sub-pages. No account required.
                </p>
                {!existingShare ? (
                  <Button
                    className="w-full"
                    onClick={handleCreatePublic}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Create & Copy Link
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={handleRevoke}
                    disabled={loading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Revoke Link
                  </Button>
                )}
              </div>
            )}

            {tab === "email" && (
              <div className="space-y-3">
                <p className="text-sm text-mossy-gray">
                  Enter email addresses (comma or space separated). Recipients get a link — no account needed to view.
                </p>
                <Input
                  placeholder="alice@example.com, bob@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
                />
                <div className="flex items-center gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleSendEmail}
                    disabled={loading || !emailInput.trim()}
                  >
                    {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Send Invite
                  </Button>
                  {existingShare && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={handleRevoke}
                      disabled={loading}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
