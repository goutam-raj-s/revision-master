"use client";

import * as React from "react";
import { FileText, RefreshCw, Unplug, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  getGoogleConnectionStatusAction,
  syncGoogleDocsAction,
  disconnectGoogleDocsAction,
} from "@/actions/google-docs";

type Status = "loading" | "connected" | "disconnected";

/** Settings card surfacing the Google Docs connection (status, sync, disconnect)
 *  so it isn't buried inside the Add Document flow. */
export function GoogleConnectionCard() {
  const [status, setStatus] = React.useState<Status>("loading");
  const [busy, setBusy] = React.useState<"sync" | "disconnect" | null>(null);

  React.useEffect(() => {
    getGoogleConnectionStatusAction().then((res) => {
      setStatus(res.success && res.data?.connected ? "connected" : "disconnected");
    });
  }, []);

  async function handleSync() {
    setBusy("sync");
    const res = await syncGoogleDocsAction();
    setBusy(null);
    if (res.success && res.data) {
      if (res.data.needsReconnect) {
        setStatus("disconnected");
        toast("Google access expired. Please reconnect.", { variant: "error" });
      } else {
        toast(`Synced ${res.data.synced} doc${res.data.synced !== 1 ? "s" : ""}${res.data.failed ? ` · ${res.data.failed} failed` : ""}`, {
          variant: "success",
        });
      }
    } else {
      toast(res.error ?? "Sync failed", { variant: "error" });
    }
  }

  async function handleDisconnect() {
    setBusy("disconnect");
    const res = await disconnectGoogleDocsAction();
    setBusy(null);
    if (res.success) {
      setStatus("disconnected");
      toast("Disconnected from Google Docs");
    }
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-state-today/10">
            <FileText className="h-4 w-4 text-state-today" />
          </div>
          Google Docs
        </CardTitle>
        <CardDescription>
          Imported docs auto-sync hourly when you open the dashboard. You can also sync manually
          or disconnect here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin text-mossy-gray" />
        ) : status === "connected" ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-state-today" />
              <span className="text-forest-slate font-medium">Connected</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSync} disabled={busy !== null} className="gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${busy === "sync" ? "animate-spin" : ""}`} />
                Sync now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={busy !== null}
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Unplug className="h-3.5 w-3.5" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-mossy-gray">Not connected</span>
            <Button size="sm" onClick={() => (window.location.href = "/api/google-docs/auth")}>
              Connect Google Docs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
