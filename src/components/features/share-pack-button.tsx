"use client";

import * as React from "react";
import { Share2, Check, Loader2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { shareCollectionAction, unshareCollectionAction } from "@/actions/collections";

export function SharePackButton({ collectionId, initialToken }: { collectionId: string; initialToken?: string }) {
  const [token, setToken] = React.useState(initialToken);
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function enableAndCopy() {
    setBusy(true);
    const res = await shareCollectionAction(collectionId);
    setBusy(false);
    if (res.success && res.data) {
      setToken(res.data.token);
      const url = `${window.location.origin}/shared/pack/${res.data.token}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast("Public link copied", { variant: "success" });
      } catch {
        toast(url, { variant: "default" });
      }
    } else {
      toast(res.error ?? "Could not share", { variant: "error" });
    }
  }

  async function disable() {
    setBusy(true);
    const res = await unshareCollectionAction(collectionId);
    setBusy(false);
    if (res.success) {
      setToken(undefined);
      toast("Sharing turned off");
    }
  }

  if (token) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={enableAndCopy} disabled={busy} className="gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5 text-state-today" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button variant="ghost" size="sm" onClick={disable} disabled={busy} className="gap-1.5 text-mossy-gray">
          <Lock className="h-3.5 w-3.5" /> Make private
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={enableAndCopy} disabled={busy} className="gap-1.5">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
      Share pack
    </Button>
  );
}
