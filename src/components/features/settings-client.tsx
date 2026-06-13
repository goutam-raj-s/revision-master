"use client";

import * as React from "react";
import { useActionState } from "react";
import { DatabaseZap, Key, User, Eye, EyeOff, Loader2, Trash2, Check, Download, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { updateProfileAction, saveGeminiKeyAction, deleteGeminiKeyAction } from "@/actions/auth";
import { manualDatabaseSyncAction } from "@/actions/sync";
import { deleteAccountAction, exportAccountDataAction, setEmailRemindersAction } from "@/actions/account";
import { GoogleConnectionCard } from "@/components/features/google-connection-card";
import { CompletionCharacterPicker } from "@/components/features/completion-character-picker";
import type { User as UserType, ActionResult } from "@/types";

interface SettingsClientProps {
  user: UserType;
  maskedGeminiKey: string | null;
  emailReminders?: boolean;
}

const profileInitial: ActionResult<void> = { success: false };
const geminiInitial: ActionResult<{ maskedKey: string }> = { success: false };

export function SettingsClient({ user, maskedGeminiKey: initialMaskedKey, emailReminders: initialReminders = true }: SettingsClientProps) {
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [maskedKey, setMaskedKey] = React.useState(initialMaskedKey);
  const [deletingKey, setDeletingKey] = React.useState(false);
  const [syncingDb, setSyncingDb] = React.useState(false);
  const [lastSyncSummary, setLastSyncSummary] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [deleteEmail, setDeleteEmail] = React.useState("");
  const [deletingAccount, setDeletingAccount] = React.useState(false);
  const [reminders, setReminders] = React.useState(initialReminders);
  const [savingReminders, setSavingReminders] = React.useState(false);

  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, profileInitial);
  const [geminiState, geminiAction, geminiPending] = useActionState(saveGeminiKeyAction, geminiInitial);

  React.useEffect(() => {
    if (profileState.success) toast("Profile updated", { variant: "success" });
    if (profileState.error) toast(profileState.error, { variant: "error" });
  }, [profileState]);

  React.useEffect(() => {
    if (geminiState.success && geminiState.data) {
      setMaskedKey(geminiState.data.maskedKey);
      toast("Gemini API key saved securely", { variant: "success" });
    }
    if (geminiState.error) toast(geminiState.error, { variant: "error" });
  }, [geminiState]);

  async function handleDeleteKey() {
    setDeletingKey(true);
    await deleteGeminiKeyAction();
    setMaskedKey(null);
    toast("Gemini API key removed");
    setDeletingKey(false);
  }

  async function handleDatabaseSync() {
    setSyncingDb(true);
    setLastSyncSummary(null);

    const result = await manualDatabaseSyncAction();
    if (result.success && result.data) {
      const summary = `${result.data.copiedToBackup} to backup, ${result.data.copiedToPrimary} to primary, ${result.data.conflictsResolved} newer-version updates`;
      setLastSyncSummary(summary);
      toast("Backup database synced", { variant: "success" });
    } else {
      toast(result.error || "Backup database sync failed", { variant: "error" });
    }

    setSyncingDb(false);
  }

  async function handleExport() {
    setExporting(true);
    const res = await exportAccountDataAction();
    setExporting(false);

    if (res.success && res.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lostbae-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Export downloaded", { variant: "success" });
    } else {
      toast(res.error ?? "Export failed", { variant: "error" });
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    const res = await deleteAccountAction(deleteEmail);
    // On success the action redirects; we only get here on failure.
    setDeletingAccount(false);
    toast(res?.error ?? "Account deletion failed", { variant: "error" });
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-state-upcoming/10">
              <User className="h-4 w-4 text-state-upcoming" />
            </div>
            Profile
          </CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                placeholder="Your name"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-mossy-gray">Email cannot be changed.</p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={profilePending}>
                {profilePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Backup Database */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-state-today/10">
              <DatabaseZap className="h-4 w-4 text-state-today" />
            </div>
            Backup Database
          </CardTitle>
          <CardDescription>
            Manually sync your main MongoDB database with the backup configured in backup_db.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-mossy-gray">
              <p>Runs a two-way sync for missing and newer records.</p>
              <p className="mt-1 text-xs">Deletes are not mirrored yet.</p>
              {lastSyncSummary && (
                <p className="mt-2 text-xs font-medium text-state-today">
                  Last sync: {lastSyncSummary}
                </p>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleDatabaseSync}
              disabled={syncingDb}
              className="shrink-0 gap-1.5 self-start sm:self-auto"
            >
              {syncingDb ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DatabaseZap className="h-3.5 w-3.5" />}
              {syncingDb ? "Syncing…" : "Sync Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gemini API Key */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-state-stale/10">
              <Key className="h-4 w-4 text-state-stale" />
            </div>
            Gemini API Key
          </CardTitle>
          <CardDescription>
            Your API key is encrypted at rest and never exposed in client-side responses.
            Used for AI-powered terminology definitions (Phase 2).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {maskedKey ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-canvas">
                <span className="font-mono text-sm text-forest-slate">
                  {maskedKey}
                </span>
                <span className="text-xs text-state-today font-medium">Active</span>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteKey}
                  disabled={deletingKey}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                >
                  {deletingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Remove Key
                </Button>
              </div>
            </div>
          ) : (
            <form action={geminiAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="apiKey">Gemini API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    name="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="AIza…"
                    required
                    minLength={10}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mossy-gray hover:text-forest-slate transition-colors"
                    aria-label={showApiKey ? "Hide key" : "Show key"}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-mossy-gray">
                  Get your key from{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-state-today hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={geminiPending}>
                  {geminiPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                  Save Key Securely
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Completion companion */}
      <CompletionCharacterPicker />

      {/* Review reminders */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-state-today/10">
              <Bell className="h-4 w-4 text-state-today" />
            </div>
            Review Reminders
          </CardTitle>
          <CardDescription>
            Get a daily email digest when documents are due for review, so nothing slips.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            role="switch"
            aria-checked={reminders}
            disabled={savingReminders}
            onClick={async () => {
              const next = !reminders;
              setReminders(next);
              setSavingReminders(true);
              const res = await setEmailRemindersAction(next);
              setSavingReminders(false);
              if (res.success) {
                toast(next ? "Daily reminders on" : "Reminders off", { variant: "success" });
              } else {
                setReminders(!next);
                toast(res.error ?? "Could not save preference", { variant: "error" });
              }
            }}
            className="flex items-center gap-3 text-sm text-forest-slate"
          >
            <span
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                reminders ? "bg-state-today" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-surface shadow transition-transform ${
                  reminders ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
            {reminders ? "Email me when reviews are due" : "Reminders are off"}
          </button>
        </CardContent>
      </Card>

      {/* Google Docs connection */}
      <GoogleConnectionCard />

      {/* Export */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-state-upcoming/10">
              <Download className="h-4 w-4 text-state-upcoming" />
            </div>
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download everything you own — documents, notes, terms, revision history, and YouTube
            sessions — as a single JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download my data (JSON)
          </Button>
        </CardContent>
      </Card>

      {/* GDPR */}
      <Card className="shadow-card border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Data & Privacy</CardTitle>
          <CardDescription>
            You have the right to erasure of all your data under GDPR.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-mossy-gray mb-4">
            Deleting your account permanently removes all your documents, notes, terms, and revision
            history. This action cannot be undone — export your data first if you want a copy.
          </p>
          {!confirmingDelete ? (
            <Button variant="destructive" size="sm" onClick={() => setConfirmingDelete(true)}>
              Delete Account
            </Button>
          ) : (
            <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <Label htmlFor="delete-confirm-email" className="text-sm">
                Type your email <span className="font-mono">{user.email}</span> to confirm:
              </Label>
              <Input
                id="delete-confirm-email"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
                placeholder={user.email}
                autoComplete="off"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setConfirmingDelete(false); setDeleteEmail(""); }} disabled={deletingAccount}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteEmail.trim().toLowerCase() !== user.email.toLowerCase()}
                  className="gap-1.5"
                >
                  {deletingAccount ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Permanently delete everything
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
