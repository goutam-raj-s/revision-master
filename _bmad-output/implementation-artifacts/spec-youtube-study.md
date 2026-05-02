---
title: 'YouTube Study Route — Watch & Annotate'
type: 'feature'
created: '2026-04-18'
status: 'done'
baseline_commit: '99da7610537c52351679718424c64565fb8cb982'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users watch YouTube tutorials and lectures as a core part of their learning but have no way to capture timestamped notes alongside the video inside lostbae, leaving that knowledge scattered in external tools and disconnected from the revision queue.

**Approach:** Add a `/study/youtube` route with a resizable split-pane layout: YouTube IFrame player on the left, note-taking panel with timestamp capture on the right. Notes (with clickable `[MM:SS]` markers) and metadata are stored in a new `youtube_sessions` MongoDB collection. The video itself is never stored. Sessions integrate into the spaced-repetition task queue identically to documents. Video metadata (title, thumbnail) fetched via YouTube oEmbed (no API key required).

## Boundaries & Constraints

**Always:**
- Video never stored in DB — only `videoId`, `videoTitle`, `thumbnailUrl`, `videoUrl`.
- Notes stored in `youtube_sessions.notes` (plain text with `[MM:SS]` markers).
- Session auto-saved on a 2-second debounce after last keystroke.
- Video metadata fetched via `https://www.youtube.com/oembed?url={videoUrl}&format=json` — zero API key.
- URL pattern `/study/youtube?v={videoId}` — shareable and bookmarkable.
- YouTube IFrame API loaded via `<script>` tag (standard embed, no key).
- On mobile (< 768 px): player stacks above notes panel (no side-by-side).
- Resizable divider uses the existing `ResizablePanelGroup` component from `src/components/ui/resizable-panel.tsx`.
- A `youtube_sessions` collection is added to MongoDB alongside existing collections.
- Sessions appear in the existing task queue (dashboard + `/documents`) with a YouTube icon, using the same `repetitions` collection for scheduling.

**Ask First:**
- If the user wants timestamps to link to specific comment threads or chapters, ask before implementing.

**Never:**
- Do not embed YouTube via any method that requires an API key.
- Do not store the video binary.
- Do not use `youtube-dl` or similar tools.
- Do not auto-play on page load.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Paste valid YouTube URL | Standard, shortened, or embed URL | Video loads in player; title + thumbnail shown in notes panel header | — |
| Paste invalid URL | Non-YouTube URL or broken ID | Error: "Please enter a valid YouTube URL" | Input stays focused |
| oEmbed fetch fails | Network error or video private/deleted | Title falls back to video ID; thumbnail hidden; player still loads | Graceful degradation |
| Timestamp capture | User presses T or clicks button while video playing | `[MM:SS]` inserted at cursor in notes textarea; video continues playing | If player not initialized, insert `[0:00]` |
| Click timestamp in notes | User clicks `[12:34]` in rendered notes | Player seeks to that position | If player not ready, queue seek |
| Auto-save | User stops typing for 2 seconds | Notes saved to DB silently; "Saved ✓" indicator shown for 2 seconds | On failure: "Save failed — retrying…" |
| Resume session | User navigates to `/study/youtube?v={videoId}` with existing session | Previous notes loaded; player loads video from start (no timestamp restore on load) | — |
| Add from dashboard | User pastes YouTube URL in main "Add Item" flow | Session created with empty notes + scheduled review; no player opened | — |

</frozen-after-approval>

## Code Map

- `src/types/index.ts` — add `DbYoutubeSession` interface and `YoutubeSession` serialized type
- `src/lib/db/collections.ts` — add `getYoutubeSessionsCollection()`, indexes, `serializeYoutubeSession()`
- `src/actions/youtube.ts` — NEW: `createOrGetYoutubeSession`, `updateYoutubeSessionNotes`, `deleteYoutubeSession`, `fetchYoutubeMetadata` (oEmbed)
- `src/app/study/youtube/page.tsx` — NEW: server component; reads `?v=` param, fetches/creates session, passes to client wrapper
- `src/components/features/youtube-study-client.tsx` — NEW: main client component; `ResizablePanelGroup` with player pane + notes pane
- `src/components/features/youtube-player.tsx` — NEW: YouTube IFrame API wrapper component; exposes `getCurrentTime()` and `seekTo(seconds)` via ref
- `src/components/features/youtube-notes-panel.tsx` — NEW: notes textarea, timestamp button, auto-save logic, rendered note display with clickable timestamps
- `src/components/features/add-document-form.tsx` — extend URL validation to also accept YouTube URLs; route to `createOrGetYoutubeSession` instead of `addDocumentAction`
- `src/components/features/task-row.tsx` — handle `source: "youtube"` items; link to `/study/youtube?v={videoId}` instead of `/study/{docId}`
- `src/components/features/sidebar.tsx` — optionally add "YouTube" nav item pointing to `/study/youtube`
- `src/app/(dashboard)/dashboard/page.tsx` — include youtube sessions in task queue query

## Tasks & Acceptance

**Execution:**
- [ ] `src/types/index.ts` -- add `DbYoutubeSession { _id, userId, videoId, videoTitle, thumbnailUrl, videoUrl, notes, tags, difficulty, createdAt, updatedAt }`; add serialized `YoutubeSession` -- new entity type
- [ ] `src/lib/db/collections.ts` -- add `getYoutubeSessionsCollection()`; indexes: `{ userId, createdAt }`, `{ userId, videoId }` (not unique — allow multiple sessions per video); `serializeYoutubeSession()` -- collection setup
- [ ] `src/actions/youtube.ts` -- `fetchYoutubeMetadata(url)`: calls oEmbed, returns `{ videoId, title, thumbnailUrl }`; `createOrGetYoutubeSession(videoId, metadata)`: upserts session + repetition record; `updateYoutubeSessionNotes(sessionId, notes)`: updates notes + `updatedAt`; `deleteYoutubeSession(sessionId)`: deletes session + repetition record -- full session lifecycle
- [ ] `src/components/features/youtube-player.tsx` -- load YouTube IFrame API via dynamic `<script>` tag on mount; expose `ref` with `{ getCurrentTime(): number, seekTo(s: number): void, getPlayerState(): number }`; render `<div id="yt-player">` as mount target; do not autoplay -- reusable player primitive
- [ ] `src/components/features/youtube-notes-panel.tsx` -- textarea for notes; "📍 Timestamp" button calls `ref.getCurrentTime()` and inserts `[MM:SS]` at cursor; debounced auto-save (2s) calls `updateYoutubeSessionNotes`; render a second read-only div with regex-converted `[MM:SS]` → `<button onClick={() => ref.seekTo(seconds)}>` for clickable timestamps; "Saved ✓" indicator -- notes UX
- [ ] `src/components/features/youtube-study-client.tsx` -- assemble `ResizablePanelGroup` (default 60/40 split): left panel = `YoutubePlayer`, right panel = `YoutubeNotesPanel` with video title + thumbnail at top; keyboard listener for `T` key triggers timestamp capture; responsive: below 768px switch to vertical stack -- main study layout
- [ ] `src/app/study/youtube/page.tsx` -- server component: read `?v=` query param; if present, call `fetchYoutubeMetadata` + `createOrGetYoutubeSession`; render `YoutubeStudyClient` with session data; if no `?v=`, render URL input form -- route entry point
- [ ] `src/components/features/add-document-form.tsx` -- extend URL validation: detect YouTube URL patterns (`youtube.com/watch`, `youtu.be/`, `youtube.com/embed/`); if YouTube URL, call `createOrGetYoutubeSession` and redirect to `/study/youtube?v={videoId}`; non-YouTube URLs keep existing flow -- unified add flow
- [ ] `src/components/features/task-row.tsx` -- add `source?: "youtube"` discriminator; if youtube, render YouTube icon and link to `/study/youtube?v={videoId}` -- task queue integration
- [ ] `src/app/(dashboard)/dashboard/page.tsx` -- include youtube sessions with due repetitions in the task queue fetch; merge + sort with document tasks by `nextReviewDate` -- unified queue

**Acceptance Criteria:**
- Given a user pastes a valid YouTube URL into `/study/youtube`, when the page loads, then the video renders in the left pane and the video title appears in the notes panel header.
- Given a playing video, when the user presses `T`, then a `[MM:SS]` marker is inserted at the cursor position in the notes textarea.
- Given notes containing `[2:30]`, when the user clicks that marker, then the video seeks to 2 minutes 30 seconds.
- Given the user stops typing for 2 seconds, when auto-save fires, then "Saved ✓" appears briefly and the notes are persisted in MongoDB.
- Given a YouTube session with a scheduled review, when the user opens the dashboard, then the session appears in the task queue with a YouTube icon linking to `/study/youtube?v={videoId}`.
- Given a user pastes a YouTube URL in the main "Add Item" form, when they submit, then a session is created and they are redirected to the YouTube study page.
- Given a mobile viewport (< 768 px), when the study page loads, then the player and notes stack vertically instead of side-by-side.

## Design Notes

**YouTube IFrame API loading:**
```ts
// One-time global load; subsequent YoutubePlayer mounts reuse window.YT
if (!window.YT) {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}
```
Player initialized inside `window.onYouTubeIframeAPIReady` or after polling `window.YT?.loaded`.

**Timestamp regex:**
`/\[(\d{1,2}):(\d{2})\]/g` → converts `[MM:SS]` to `<button>` with `onClick`. Render in a separate read-only `div` below the textarea, not inline inside the textarea.

## Verification

**Commands:**
- `npm run build` -- expected: no TypeScript errors, build succeeds

**Manual checks:**
- Paste `https://youtu.be/dQw4w9WgXcQ` — video loads, title populated from oEmbed
- Press T at 0:30 — `[0:30]` appears in notes
- Click `[0:30]` in rendered notes — player seeks to 30 seconds
- Stop typing — "Saved ✓" appears within 3 seconds
- Add same YouTube URL from dashboard add form — redirected to study page
- Task queue shows session with YouTube icon after scheduling
