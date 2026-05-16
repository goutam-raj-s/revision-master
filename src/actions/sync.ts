"use server";

import { syncPrimaryAndBackupDatabases } from "@/lib/db/sync";
import { requireAuth } from "@/lib/auth/session";
import type { ActionResult } from "@/types";

interface ManualSyncSummary {
  copiedToBackup: number;
  copiedToPrimary: number;
  conflictsResolved: number;
}

export async function manualDatabaseSyncAction(): Promise<ActionResult<ManualSyncSummary>> {
  await requireAuth();

  const result = await syncPrimaryAndBackupDatabases();

  if (!result.ok) {
    return {
      success: false,
      error: result.warning || "Backup database sync is not available.",
    };
  }

  const summary = result.collections.reduce(
    (acc, collection) => ({
      copiedToBackup: acc.copiedToBackup + collection.copiedToBackup,
      copiedToPrimary: acc.copiedToPrimary + collection.copiedToPrimary,
      conflictsResolved: acc.conflictsResolved + collection.conflictsResolved,
    }),
    { copiedToBackup: 0, copiedToPrimary: 0, conflictsResolved: 0 }
  );

  return {
    success: true,
    data: summary,
  };
}
