"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  getGoogleConnectionStatusAction,
  syncGoogleDocsAction,
} from "@/actions/google-docs";
import { toast } from "@/components/ui/toast";

const STAMP_KEY = "lostbae-gdocs-last-sync";
const SYNC_INTERVAL_MS = 60 * 60 * 1000; // hourly

/**
 * Invisible component: silently re-syncs imported Google Docs at most once
 * per hour when the dashboard is opened, so users never need the manual
 * "Sync now" button to stay fresh.
 */
export function GoogleAutoSync() {
  const router = useRouter();
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const last = Number(localStorage.getItem(STAMP_KEY) ?? 0);
    if (Date.now() - last < SYNC_INTERVAL_MS) return;

    (async () => {
      const status = await getGoogleConnectionStatusAction();
      if (!status.success || !status.data?.connected) return;

      localStorage.setItem(STAMP_KEY, String(Date.now()));
      const res = await syncGoogleDocsAction();
      if (res.success && res.data && res.data.synced > 0) {
        toast(`Synced ${res.data.synced} Google Doc${res.data.synced !== 1 ? "s" : ""}`, {
          variant: "success",
        });
        router.refresh();
      }
    })().catch(() => {
      // background convenience — never surface errors
    });
  }, [router]);

  return null;
}
