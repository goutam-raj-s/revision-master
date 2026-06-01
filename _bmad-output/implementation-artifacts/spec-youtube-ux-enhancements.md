---
title: 'YouTube & Editor UX Enhancements'
type: 'feature'
created: '2026-06-01'
status: 'ready-for-dev'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The YouTube study notes panel uses a plain textarea (no formatting, no image support), images require a double-click to expand, the YouTube notes panel and fullscreen overlay have no collapse control, there is no per-page shortcut reference, and the video player has no skip-forward/back controls.

**Approach:** (1) Replace the YouTube notes textarea with the full Tiptap rich editor (same extensions as the document editor). (2) Change CollapsibleImage expand from double-click to single-click. (3) Add a collapse toggle to the YouTube notes panel (normal + fullscreen). (4) Add a `QuickGuideButton` component wired into every page's `DashboardHeader`. (5) Expose `skipForward`/`skipBack` on `YoutubePlayerHandle` and render ±10 s buttons in the video player UI.

## Boundaries & Constraints

**Always:**
- Tiptap notes in YouTube must reuse `RichTextEditorDynamic` (same import pattern as the document study page).
- Timestamp insertion (`T` key / Timestamp button) must use Tiptap's `insertContent` command, not textarea cursor manipulation.
- Notes are stored as HTML strings — the existing `updateYoutubeSessionNotes` action is unchanged.
- Collapsible state of YouTube notes panel is persisted in `localStorage` key `lostbae_yt_notes_open`.
- QuickGuide content is page-specific; each page passes its own `shortcuts` array to `<QuickGuideButton>`.
- Skip buttons use ±10 s increments. `skipForward`/`skipBack` are added to `YoutubePlayerHandle` and implemented in both `YoutubePlayer` and `ExternalVideoPlayer`.

**Ask First:**
- If user wants the notes format migration (plain text → HTML) to back-fill existing sessions, ask before adding a migration script.

**Never:**
- Do not change the DB schema or actions layer — only the notes string format changes (plain text → HTML).
- Do not remove the existing timestamp button or `T`-key shortcut.
- Do not add focus-mode or export-PDF to the YouTube Tiptap instance — those are document-editor-only features.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Load YouTube session with legacy plain-text notes | `session.notes = "hello [1:30]"` | Tiptap renders it as a plain paragraph; timestamps are not clickable in editor (only in the rendered preview below) | No crash |
| Collapse YouTube notes (normal view) | Click chevron toggle in notes panel header | Right panel collapses; toggle button remains visible | State persisted in localStorage |
| Collapse YouTube notes (fullscreen) | Click chevron in fullscreen notes drawer header | Drawer closes; FAB stays | Same as non-fullscreen |
| T key with Tiptap focused | User presses T while Tiptap editor content-editable is focused | `[MM:SS]` inserted at cursor via `insertContent` | Falls back to `[0:00]` if player not ready |
| Skip forward past end | Player near end, user clicks +10 s | Seeks to end; YouTube IFrame handles gracefully | No error thrown |
| Image single-click | Click badge | Image expands inline | — |

</frozen-after-approval>

## Code Map

- `src/components/features/editor/extensions/CollapsibleImage.tsx` — change `onDoubleClick` → `onClick` to expand; update tooltip hint
- `src/components/features/youtube-player.tsx` — add `skipForward(s)` / `skipBack(s)` to `YoutubePlayerHandle` interface + `useImperativeHandle`
- `src/components/features/external-video-player.tsx` — implement `skipForward`/`skipBack` on the forwarded ref (direct player uses `videoRef.currentTime`, iframe is no-op)
- `src/components/features/youtube-notes-panel.tsx` — replace `<textarea>` with `RichTextEditorDynamic`; adapt timestamp insertion to Tiptap `insertContent`; add collapse chevron to panel header; accept `isCollapsed`/`onToggleCollapse` props
- `src/components/features/youtube-study-client.tsx` — add `isNotesOpen` state (localStorage-persisted); pass collapse props to `YoutubeNotesPanel`; collapse the ResizablePanelGroup right pane when collapsed; add skip buttons below player
- `src/components/features/youtube-fullscreen-overlay.tsx` — thread collapse state into the notes drawer header so drawer can be dismissed with the same chevron
- `src/components/ui/quick-guide-button.tsx` — NEW: `<QuickGuideButton shortcuts={[]} />` renders a small `?` icon button opening a Popover listing shortcut rows
- `src/app/study/youtube/page.tsx` — add `<QuickGuideButton>` to `rightActions` of `DashboardHeader` with YouTube-specific shortcuts
- `src/app/study/[docId]/page.tsx` — add `<QuickGuideButton>` to `rightActions` of `DashboardHeader` with document study shortcuts
- `src/app/(dashboard)/dashboard/page.tsx` — add `<QuickGuideButton>` to header with dashboard shortcuts
- `src/app/(dashboard)/documents/page.tsx` — add `<QuickGuideButton>` with documents shortcuts

## Tasks & Acceptance

**Execution:**

- [ ] `src/components/features/editor/extensions/CollapsibleImage.tsx` — change `onDoubleClick={() => setIsOpen(true)}` to `onClick={() => setIsOpen(true)}` on the badge wrapper div; update tooltip footer text from "Double-click badge to expand" to "Click to expand"
- [ ] `src/components/features/youtube-player.tsx` — add `skipForward(seconds: number): void` and `skipBack(seconds: number): void` to `YoutubePlayerHandle` interface; implement both in `useImperativeHandle` using `playerRef.current?.seekTo(getCurrentTime() ± seconds, true)`
- [ ] `src/components/features/external-video-player.tsx` — add `skipForward`/`skipBack` to the forwarded ref; for `direct` player use `videoRef.current.currentTime += seconds`; for `iframe` player these are no-ops
- [ ] `src/components/features/youtube-notes-panel.tsx` — (a) replace `<textarea>` + timestamp cursor logic with `RichTextEditorDynamic` configured with no `docId` and an `onSave` callback wired to the existing debounced save; (b) expose a Tiptap ref via `useImperativeHandle` or `editorRef` so timestamp insertion calls `editor.chain().focus().insertContent(ts).run()`; (c) add `isCollapsed` + `onToggleCollapse` props; render a `ChevronLeft`/`ChevronRight` toggle button in the panel header
- [ ] `src/components/features/youtube-study-client.tsx` — (a) add `isNotesOpen` state defaulting `true`, read/write `lostbae_yt_notes_open` in localStorage; (b) when `!isNotesOpen` pass `split={100}` to `ResizablePanelGroup` and hide the right pane; (c) add a floating re-open button (chevron) at the right edge when collapsed; (d) add `<SkipControls playerRef={playerRef} />` row below the player (inline, not a separate file)
- [ ] `src/components/ui/quick-guide-button.tsx` — NEW file: accepts `shortcuts: { keys: string; label: string }[]` and optional `title?: string`; renders a small `HelpCircle` icon button; on click opens a `Popover` with a two-column table of shortcut rows; styled with existing Tailwind tokens
- [ ] `src/app/study/youtube/page.tsx` — import and render `<QuickGuideButton>` inside the `rightActions` of each `DashboardHeader` call with YouTube shortcuts: `T → Timestamp`, `Fullscreen + Notes button`, `←/→ 10 s skip`
- [ ] `src/app/study/[docId]/page.tsx` — import and render `<QuickGuideButton>` in `rightActions` with document study shortcuts: `Cmd+] → toggle panel`, `Cmd+S → save`, `Cmd+Shift+H → highlight`, `Cmd+Shift+F → focus mode`
- [ ] `src/app/(dashboard)/dashboard/page.tsx` — add `<QuickGuideButton>` with dashboard shortcuts; make the dashboard header accept `rightActions` or render the button directly in the existing header area
- [ ] `src/app/(dashboard)/documents/page.tsx` — add `<QuickGuideButton>` with document list shortcuts

**Acceptance Criteria:**
- Given the CollapsibleImage badge is visible, when the user single-clicks it, then the image expands inline without requiring a double-click.
- Given the YouTube study page in normal view, when the user clicks the collapse chevron in the notes panel header, then the notes panel collapses and a re-open chevron appears at the right edge; state persists on reload.
- Given the YouTube study page in fullscreen, when the user clicks the collapse button in the notes drawer header, then the drawer closes; the FAB remains visible.
- Given a playing YouTube video, when the user clicks +10 s, then the player seeks forward 10 seconds; clicking −10 s seeks back 10 seconds.
- Given the YouTube notes panel, when the user types rich text (bold, lists, headings), then formatting is preserved and saved as HTML.
- Given YouTube notes containing `[1:30]`, when the user presses T, then `[MM:SS]` is inserted at the Tiptap cursor position.
- Given any page with a `DashboardHeader`, when the user clicks the `?` guide button, then a popover lists page-relevant keyboard shortcuts.

## Design Notes

**Tiptap in YouTube notes — stripped-down config:**
Reuse `RichTextEditorDynamic` but the YouTube notes instance should hide focus-mode toggle, PDF export, and word-count footer. Pass `compact={true}` prop (add it to `RichTextEditor`) that suppresses those three UI elements.

**Timestamp insertion with Tiptap:**
```ts
// Inside YoutubeNotesPanel — replaces textarea cursor logic
editorInstance.chain().focus().insertContent(ts).run();
```
The `yt-insert-timestamp` event listener calls this instead of the textarea manipulation.

**Skip controls placement:**
Render inline in `youtube-study-client.tsx` below the player element, alongside the existing `FullscreenButton`:
```tsx
<div className="flex items-center justify-between pr-1">
  <div className="flex gap-1">
    <SkipBtn seconds={-10} playerRef={playerRef} />
    <SkipBtn seconds={10} playerRef={playerRef} />
  </div>
  <FullscreenButton targetRef={containerRef} />
</div>
```

## Verification

**Commands:**
- `npm run build` -- expected: no TypeScript errors, build succeeds

**Manual checks:**
- Click CollapsibleImage badge once → image expands
- Open YouTube study page, collapse notes, reload → stays collapsed
- Click +10s / -10s during playback → player seeks correctly
- Type bold/italic text in YouTube notes → saved as HTML, persists on reload
- Press T while video plays → `[MM:SS]` appears in Tiptap editor at cursor
- Click `?` on YouTube study page → popover shows YouTube shortcuts
- Click `?` on document study page → popover shows document shortcuts
