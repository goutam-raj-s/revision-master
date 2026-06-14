"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye, X, Keyboard } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { toggleHiddenRevealAction, getHiddenRevealAction } from "@/actions/hidden";

const GUIDE_SEEN_KEY = "lostbae_hidden_guide_seen";
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** ⌘/Ctrl + ⇧ + ⌥/Alt + R */
function isRevealCombo(e: KeyboardEvent): boolean {
  return (
    (e.metaKey || e.ctrlKey) &&
    e.shiftKey &&
    e.altKey &&
    (e.key === "r" || e.key === "R" || e.code === "KeyR")
  );
}

export function HiddenDocsController() {
  const router = useRouter();
  const [revealed, setRevealed] = React.useState(false);
  const [guideOpen, setGuideOpen] = React.useState(false);
  const busy = React.useRef(false);

  React.useEffect(() => {
    getHiddenRevealAction().then(setRevealed).catch(() => {});
  }, []);

  const toggle = React.useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const { revealed: next } = await toggleHiddenRevealAction();
      setRevealed(next);
      router.refresh();
      toast(next ? "Private documents revealed" : "Private documents hidden", {
        variant: "default",
      });
    } finally {
      busy.current = false;
    }
  }, [router]);

  // Global shortcut + cross-component events.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isRevealCombo(e)) {
        e.preventDefault();
        void toggle();
      }
    };
    const onToggle = () => void toggle();
    const onFirstTime = () => {
      if (typeof window === "undefined") return;
      if (localStorage.getItem(GUIDE_SEEN_KEY) === "1") return;
      localStorage.setItem(GUIDE_SEEN_KEY, "1");
      setGuideOpen(true);
    };
    const onShowGuide = () => setGuideOpen(true);

    window.addEventListener("keydown", onKey);
    window.addEventListener("lostbae:toggle-hidden", onToggle);
    window.addEventListener("lostbae:hidden-first-time", onFirstTime);
    window.addEventListener("lostbae:show-hidden-guide", onShowGuide);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("lostbae:toggle-hidden", onToggle);
      window.removeEventListener("lostbae:hidden-first-time", onFirstTime);
      window.removeEventListener("lostbae:show-hidden-guide", onShowGuide);
    };
  }, [toggle]);

  const combo = isMac ? "⌘ + ⇧ + ⌥ + R" : "Ctrl + Shift + Alt + R";

  return (
    <>
      {/* Subtle reveal-state pill — only appears while revealed, so private docs
          are never advertised in the normal UI. */}
      {revealed && (
        <button
          onClick={() => void toggle()}
          className="fixed left-1/2 top-2 z-[70] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-state-upcoming/40 bg-state-upcoming/10 px-3 py-1 text-[11px] font-medium text-state-upcoming shadow-soft print:hidden"
          title="Hide private documents again"
        >
          <Eye className="h-3 w-3" /> Private documents visible — click or press {combo} to hide
        </button>
      )}

      {guideOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-forest-slate/30 backdrop-blur-sm p-4 print:hidden"
          onClick={() => setGuideOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-base font-semibold text-forest-slate">
                <EyeOff className="h-5 w-5 text-state-today" /> Private documents
              </span>
              <button onClick={() => setGuideOpen(false)} className="p-1 text-mossy-gray hover:text-forest-slate" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-mossy-gray">
              Hidden documents disappear from your library, dashboard and search — as if
              they aren&apos;t there. They stay private until you reveal them.
            </p>
            <div className="mt-4 space-y-2.5 text-sm text-forest-slate">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-mossy-gray shrink-0" />
                <span>Press <kbd className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs">{combo}</kbd> to reveal or hide them.</span>
              </div>
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-mossy-gray shrink-0" />
                <span>Or click the small <EyeOff className="inline h-3 w-3" /> icon at the bottom of the sidebar.</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-mossy-gray shrink-0" />
                <span>While revealed, use each document&apos;s eye toggle to hide or unhide it.</span>
              </div>
            </div>
            <button
              onClick={() => setGuideOpen(false)}
              className="mt-5 w-full rounded-xl bg-state-today px-4 py-2 text-sm font-medium text-white hover:bg-state-today/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
