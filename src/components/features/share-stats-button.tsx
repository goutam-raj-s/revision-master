"use client";

import * as React from "react";
import { Share2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { createStatShareAction } from "@/actions/stat-share";

export function ShareStatsButton() {
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function share() {
    setBusy(true);
    const res = await createStatShareAction();
    setBusy(false);
    if (res.success && res.data) {
      const url = `${window.location.origin}/shared/stats/${res.data.token}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast("Stats link copied — share your streak!", { variant: "success" });
      } catch {
        toast(url, { variant: "default" });
      }
    } else {
      toast(res.error ?? "Could not create share link", { variant: "error" });
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={share} disabled={busy} className="gap-1.5">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Share my stats"}
    </Button>
  );
}
