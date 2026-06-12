"use client";

import * as React from "react";
import {
  Loader2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Unplug,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import {
  getGoogleConnectionStatusAction,
  getPickerAccessTokenAction,
  importSelectedGoogleDocsAction,
  syncGoogleDocsAction,
  disconnectGoogleDocsAction,
} from "@/actions/google-docs";
import type { Difficulty } from "@/types";
import type { ImportResult, PickerFile } from "@/actions/google-docs";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gapi: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

interface GoogleDocsTabProps {
  onSuccess: (docId: string) => void;
  initialStatus?: "connected" | "error" | null;
}

type Phase =
  | "loading"
  | "disconnected"
  | "connected"
  | "picking"
  | "importing"
  | "result"
  | "error";

interface MetaState {
  difficulty: Difficulty;
  tags: string[];
  tagInput: string;
  delay: string;
}

export function GoogleDocsTab({ onSuccess, initialStatus }: GoogleDocsTabProps) {
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [meta, setMeta] = React.useState<MetaState>({
    difficulty: "medium",
    tags: [],
    tagInput: "",
    delay: "2",
  });
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const [syncing, setSyncing] = React.useState(false);
  const [disconnecting, setDisconnecting] = React.useState(false);

  const pickerApiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY ?? "";

  // Check connection on mount
  React.useEffect(() => {
    async function check() {
      if (initialStatus === "connected") {
        setPhase("connected");
        return;
      }
      if (initialStatus === "error") {
        setPhase("disconnected");
        toast("Google Docs connection failed. Please try again.", { variant: "error" });
        return;
      }

      const res = await getGoogleConnectionStatusAction();
      if (res.success && res.data) {
        if (res.data.connected) {
          setPhase("connected");
        } else if (res.data.needsReconnect) {
          setPhase("disconnected");
        } else {
          setPhase("disconnected");
        }
      } else {
        setPhase("error");
      }
    }
    check();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleConnect() {
    window.location.href = "/api/google-docs/auth";
  }

  async function openPicker() {
    setPhase("picking");

    const tokenRes = await getPickerAccessTokenAction();
    if (!tokenRes.success || !tokenRes.data) {
      setPhase("connected");
      toast("Could not get Google access. Please reconnect.", { variant: "error" });
      return;
    }

    const { accessToken } = tokenRes.data;

    // Load Google API script if not already loaded
    await loadGapiScript();

    try {
      await new Promise<void>((resolve) =>
        window.gapi.load("picker", { callback: resolve })
      );

      const pickerBuilder = new window.google.picker.PickerBuilder()
        .addView(
          new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
            .setMimeTypes("application/vnd.google-apps.document")
            .setMode(window.google.picker.DocsViewMode.LIST)
        )
        .setOAuthToken(accessToken)
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .setCallback((data: { action: string; docs?: Array<{ id: string; name: string }> }) => {
          if (data.action === window.google.picker.Action.PICKED && data.docs) {
            handlePickerSelection(data.docs.map((d) => ({ id: d.id, name: d.name })));
          } else if (
            data.action === window.google.picker.Action.CANCEL ||
            data.action === window.google.picker.Action.LOADED
          ) {
            if (data.action === window.google.picker.Action.CANCEL) {
              setPhase("connected");
            }
          }
        });

      if (pickerApiKey) {
        pickerBuilder.setDeveloperKey(pickerApiKey);
      }

      pickerBuilder.build().setVisible(true);
    } catch {
      setPhase("connected");
      toast("Could not load Google Picker. Please try again.", { variant: "error" });
    }
  }

  async function handlePickerSelection(files: PickerFile[]) {
    if (!files.length) {
      setPhase("connected");
      return;
    }

    setPhase("importing");

    const res = await importSelectedGoogleDocsAction(files, {
      difficulty: meta.difficulty,
      tags: meta.tags,
      initialDelayDays: parseInt(meta.delay),
    });

    if (res.success && res.data) {
      setImportResult(res.data);
      setPhase("result");
    } else {
      setPhase("connected");
      toast(res.error ?? "Import failed. Please try again.", { variant: "error" });
    }
  }

  async function handleSync() {
    setSyncing(true);
    const res = await syncGoogleDocsAction();
    setSyncing(false);

    if (res.success && res.data) {
      const { synced, failed, needsReconnect } = res.data;
      if (needsReconnect) {
        setPhase("disconnected");
        toast("Google access expired. Please reconnect.", { variant: "error" });
      } else {
        toast(
          `Synced ${synced} doc${synced !== 1 ? "s" : ""}${failed ? ` · ${failed} failed` : ""}`,
          { variant: synced > 0 ? "success" : "default" }
        );
      }
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    const res = await disconnectGoogleDocsAction();
    setDisconnecting(false);

    if (res.success) {
      setPhase("disconnected");
      toast("Disconnected from Google Docs.", { variant: "default" });
    }
  }

  function addTag() {
    const t = meta.tagInput.trim().toLowerCase();
    if (t && !meta.tags.includes(t)) {
      setMeta((m) => ({ ...m, tags: [...m.tags, t], tagInput: "" }));
    } else {
      setMeta((m) => ({ ...m, tagInput: "" }));
    }
  }

  if (phase === "loading") {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-state-today" />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-4 text-sm text-destructive">
        <AlertTriangle className="inline h-4 w-4 mr-2" />
        Something went wrong. Please refresh the page.
      </div>
    );
  }

  if (phase === "disconnected") {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-canvas px-5 py-5 space-y-3">
          <div className="flex items-center gap-2 text-forest-slate font-medium text-sm">
            <FileText className="h-4 w-4 text-state-today shrink-0" />
            Import Google Docs
          </div>
          <p className="text-xs text-mossy-gray leading-relaxed">
            Choose the Google Docs you want to study. Revision Master only imports docs you select here — no full Drive access.
          </p>
          <Button onClick={handleConnect} className="w-full mt-1">
            Import Google Docs
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "importing") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <Loader2 className="h-8 w-8 animate-spin text-state-today" />
        <p className="text-sm text-mossy-gray">Importing selected docs…</p>
      </div>
    );
  }

  if (phase === "result" && importResult) {
    return (
      <div className="space-y-5">
        {/* Summary */}
        <div className="rounded-xl border border-border bg-canvas px-5 py-4 space-y-2">
          <div className="text-sm font-medium text-forest-slate">Import complete</div>
          <div className="flex flex-wrap gap-3 text-xs text-mossy-gray">
            {importResult.imported > 0 && (
              <span className="flex items-center gap-1 text-state-today font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {importResult.imported} imported
              </span>
            )}
            {importResult.alreadyImported > 0 && (
              <span>{importResult.alreadyImported} already in library</span>
            )}
            {importResult.failed > 0 && (
              <span className="text-destructive">{importResult.failed} failed</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { setPhase("connected"); setImportResult(null); }}
          >
            Choose more Google Docs
          </Button>
          {importResult.docs.length > 0 && (
            <Button
              className="flex-1"
              onClick={() => onSuccess(importResult.docs[0].id)}
            >
              View Documents
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Phase: connected
  return (
    <div className="space-y-5">
      {/* Connection badge */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-canvas px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-state-today shrink-0" />
          <span className="text-forest-slate font-medium">Google Docs connected</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1 text-xs text-mossy-gray hover:text-forest-slate transition-colors disabled:opacity-50"
            title="Sync imported docs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync now
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-1 text-xs text-mossy-gray hover:text-destructive transition-colors disabled:opacity-50"
            title="Disconnect Google Docs"
          >
            <Unplug className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      </div>

      {/* Metadata fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="gdocs-difficulty">Difficulty</Label>
          <Select
            value={meta.difficulty}
            onValueChange={(v) => setMeta((m) => ({ ...m, difficulty: v as Difficulty }))}
          >
            <SelectTrigger id="gdocs-difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gdocs-delay">First Review</Label>
          <Select
            value={meta.delay}
            onValueChange={(v) => setMeta((m) => ({ ...m, delay: v }))}
          >
            <SelectTrigger id="gdocs-delay">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 5, 7, 14, 21, 30].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  +{d} days{d === 2 ? " (default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gdocs-tag-input">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="gdocs-tag-input"
            value={meta.tagInput}
            onChange={(e) => setMeta((m) => ({ ...m, tagInput: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag and press Enter"
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon" onClick={addTag} aria-label="Add tag">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {meta.tags.map((tag) => (
              <Badge key={tag} variant="tag" className="gap-1.5 cursor-default">
                #{tag}
                <button
                  type="button"
                  onClick={() => setMeta((m) => ({ ...m, tags: m.tags.filter((t) => t !== tag) }))}
                  className="hover:text-destructive transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={openPicker}
        disabled={phase === "picking"}
        className="w-full"
      >
        {phase === "picking" ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening picker…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Choose Google Docs
          </span>
        )}
      </Button>
    </div>
  );
}

// Loads https://apis.google.com/js/api.js once
function loadGapiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google API script"));
    document.head.appendChild(script);
  });
}
