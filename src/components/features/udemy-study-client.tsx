"use client";

import * as React from "react";
import { ExternalLink, MonitorPlay, RefreshCw, CheckCircle2, Maximize2 } from "lucide-react";
import { UdemyNotesPanel } from "./udemy-notes-panel";
import type { UdemySession } from "@/types";

interface UdemyStudyClientProps {
  session: UdemySession;
}

type WindowState = "launching" | "open" | "blocked" | "closed";

export function UdemyStudyClient({ session }: UdemyStudyClientProps) {
  const [windowState, setWindowState] = React.useState<WindowState>("launching");
  const udemyWinRef = React.useRef<Window | null>(null);

  const lectureUrl = session.lectureId
    ? `${session.courseUrl}learn/lecture/${session.lectureId}/`
    : session.courseUrl;

  /**
   * Open Udemy in a precisely-positioned popup window sized to the left
   * portion of the screen, then shrink + move THIS window to the right portion.
   *
   * Result: user sees Udemy on the left, notes on the right — feels like a
   * native split-screen even though it's two windows.
   */
  function launchSplitScreen() {
    const sw = window.screen.availWidth;
    const sh = window.screen.availHeight;
    const udemyW = Math.floor(sw * 0.60);
    const notesW = sw - udemyW;

    // Open Udemy pinned to the left half
    const win = window.open(
      lectureUrl,
      "udemy-study-window",
      [
        `width=${udemyW}`,
        `height=${sh}`,
        `left=0`,
        `top=0`,
        "menubar=no",
        "toolbar=no",
        "location=yes",
        "status=no",
      ].join(",")
    );

    if (!win) {
      setWindowState("blocked");
      return;
    }

    udemyWinRef.current = win;
    setWindowState("open");

    // Shrink + move this window to the right portion
    try {
      window.resizeTo(notesW, sh);
      window.moveTo(udemyW, 0);
    } catch {
      // Some browsers disallow programmatic resize of non-popup windows — fine
    }
  }

  // Auto-launch on mount
  React.useEffect(() => {
    launchSplitScreen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll to detect if the Udemy window was closed by the user
  React.useEffect(() => {
    if (windowState !== "open") return;
    const id = setInterval(() => {
      if (udemyWinRef.current?.closed) {
        setWindowState("closed");
        clearInterval(id);
      }
    }, 1500);
    return () => clearInterval(id);
  }, [windowState]);

  function handleReopen() {
    setWindowState("launching");
    launchSplitScreen();
  }

  function handleSnapBack() {
    // Restore this window to full screen so the user can use it normally
    try {
      const sw = window.screen.availWidth;
      const sh = window.screen.availHeight;
      window.resizeTo(sw, sh);
      window.moveTo(0, 0);
    } catch {
      // ignore
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Status bar */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2 border-b border-border/50 bg-canvas text-sm">
        {windowState === "launching" && (
          <span className="flex items-center gap-2 text-mossy-gray">
            <MonitorPlay className="h-4 w-4 animate-pulse" />
            Opening Udemy…
          </span>
        )}

        {windowState === "open" && (
          <>
            <CheckCircle2 className="h-4 w-4 text-state-today shrink-0" />
            <span className="text-forest-slate text-xs flex-1">
              Udemy is open in a side window — notes auto-save as you type.
            </span>
            <button
              onClick={handleSnapBack}
              className="inline-flex items-center gap-1 text-xs text-mossy-gray hover:text-forest-slate transition-colors"
              title="Restore this window to full screen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Full screen
            </button>
          </>
        )}

        {windowState === "blocked" && (
          <>
            <MonitorPlay className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-forest-slate text-xs flex-1">
              Popup was blocked. Allow popups for this site, then reopen.
            </span>
            <button
              onClick={handleReopen}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-state-today text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="h-3 w-3" />
              Reopen
            </button>
            <a
              href={lectureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-mossy-gray hover:text-forest-slate transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open tab
            </a>
          </>
        )}

        {windowState === "closed" && (
          <>
            <MonitorPlay className="h-4 w-4 text-mossy-gray shrink-0" />
            <span className="text-forest-slate text-xs flex-1">
              Udemy window was closed.
            </span>
            <button
              onClick={handleReopen}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-state-today text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="h-3 w-3" />
              Reopen Udemy
            </button>
          </>
        )}
      </div>

      {/* Notes panel — full width */}
      <div className="flex-1 min-h-0">
        <UdemyNotesPanel
          sessionId={session.id}
          initialNotes={session.notes}
          courseTitle={session.courseTitle}
          lectureTitle={session.lectureTitle}
          courseUrl={session.courseUrl}
          lectureId={session.lectureId}
        />
      </div>
    </div>
  );
}
