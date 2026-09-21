"use client";

import * as React from "react";
import { scheduleOfflineSync } from "@/lib/offline/indexed-db";

export function OfflineSyncBootstrap() {
  React.useEffect(() => {
    let timeoutId: number | undefined;

    const startAfterPageLoad = () => {
      timeoutId = window.setTimeout(() => {
        scheduleOfflineSync({ quiet: true });
      }, 1200);
    };

    if (document.readyState === "complete") {
      startAfterPageLoad();
    } else {
      window.addEventListener("load", startAfterPageLoad, { once: true });
    }

    const onOnline = () => scheduleOfflineSync({ quiet: true });
    window.addEventListener("online", onOnline);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener("load", startAfterPageLoad);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
