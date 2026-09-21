"use client";

import * as React from "react";
import { AiAssistant } from "@/components/features/ai-assistant";
import { TerminologyClient } from "@/components/features/terminology-client";

export function TerminologyOfflinePage() {
  const [count, setCount] = React.useState(0);
  const [source, setSource] = React.useState<"indexeddb" | "server" | "loading">("loading");
  const handleTermsLoaded = React.useCallback((nextCount: number, nextSource: "indexeddb" | "server" | "loading") => {
    setCount(nextCount);
    setSource(nextSource);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-slate">Terminology</h1>
        <p className="mt-1 text-sm text-mossy-gray">
          {source === "loading" ? "Checking local glossary..." : `${count} term${count !== 1 ? "s" : ""} in your personal glossary`}
          {source === "indexeddb" && <span className="ml-2 text-state-today">from IndexedDB</span>}
        </p>
      </div>
      <TerminologyClient
        terms={[]}
        preferOffline
        onTermsLoaded={handleTermsLoaded}
      />
      {count > 0 && <AiAssistant kind="glossary" contextId="all" title="Your glossary" enableSummary={false} />}
    </div>
  );
}
