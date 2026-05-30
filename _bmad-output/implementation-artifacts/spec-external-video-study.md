---
title: 'External Video Study'
type: 'feature'
created: '2026-05-29'
status: 'done'
baseline_commit: 'cdcf1122deccc7ca2f45c0336d43a51b77cb63b1'
context: ['{project-root}/project-context.md']
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The YouTube study page only accepts YouTube video and playlist URLs, so paid course pages or other authenticated video pages cannot be opened inside the study workflow even when the user is legitimately logged in and has access on the original provider site.

**Approach:** Add a second URL path on the existing YouTube study page for arbitrary external video/course-page URLs. External sessions should reuse the existing study shell, timestamped notes, fullscreen layout, bookmark/open-original affordance where practical, and playlist-like navigation by storing the original URL and attempting browser-native playback or authenticated embedding without bypassing provider access controls.

## Boundaries & Constraints

**Always:** Preserve the existing YouTube video and playlist flows. External URLs must be saved per authenticated user as study sessions with notes and SRS repetition records. The original provider URL must remain available so the user can open it in the logged-in browser. The first implementation may rely on iframe embedding for protected course pages and direct `<video>` playback for direct media URLs.

**Ask First:** Any attempt to scrape credentials, bypass DRM, download paid media, proxy third-party authenticated content through the server, or automate login must be approved as a separate security/legal review and is not part of this change.

**Never:** Do not break YouTube iframe API controls. Do not claim the app can defeat `X-Frame-Options`, CSP `frame-ancestors`, DRM, CORS, or third-party cookie blocking. Do not store provider cookies or tokens.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| YouTube URL | Existing YouTube watch/short/embed URL | Current YouTube session behavior is unchanged | Existing validation remains |
| External course page | `https://www.airtribe.live/.../modules/...` | App creates/opens an external session and embeds the provider page so logged-in browser access can be tested | Show open-original fallback if the frame is blocked |
| Direct media URL | URL ending in `.mp4`, `.webm`, `.mov`, `.m3u8`, etc. | App uses an HTML video player with timestamp/seek support | Browser displays native media errors if unsupported |
| Invalid URL | Empty or malformed value | Form rejects without navigation | Inline validation message |

</frozen-after-approval>

## Code Map

- `src/app/study/youtube/page.tsx` -- routes YouTube query params to playlist/session views; will accept external URL/session params.
- `src/components/features/youtube-url-form.tsx` -- initial study URL entry form; will add external URL mode.
- `src/actions/youtube.ts` -- session creation and metadata lookup; will add external session creation keyed by URL.
- `src/components/features/youtube-study-client.tsx` -- split study layout; will choose YouTube/direct/embedded player.
- `src/components/features/youtube-player.tsx` -- current YouTube iframe API wrapper; keep unchanged except shared handle compatibility if needed.
- `src/components/features/youtube-notes-panel.tsx` -- timestamped notes rely on `YoutubePlayerHandle`; external players need the same methods.
- `src/types/index.ts` and `src/lib/db/collections.ts` -- session shape/serialization; will add optional source/player fields with backward compatibility.

## Tasks & Acceptance

**Execution:**
- [x] `src/types/index.ts` and `src/lib/db/collections.ts` -- add optional `sourceType` / `playerType` fields to YouTube sessions -- lets old sessions serialize safely while new external sessions declare playback mode.
- [x] `src/actions/youtube.ts` -- add external URL metadata/title fallback and create-or-get action keyed by normalized URL -- persists authenticated external study sessions.
- [x] `src/components/features/youtube-url-form.tsx` -- accept either YouTube or external URLs and route external URLs with an encoded param -- makes the feature discoverable on the existing page.
- [x] `src/app/study/youtube/page.tsx` -- handle external URL/session params, create external sessions, update breadcrumbs/actions -- connects server state to the client.
- [x] `src/components/features/youtube-study-client.tsx` -- render YouTube, direct video, or external iframe players behind the same notes UI -- preserves study features while testing protected page playback.

**Acceptance Criteria:**
- Given a YouTube video URL, when the user starts a session, then the existing YouTube player, notes, bookmark, and open-on-YouTube behavior still work.
- Given an Airtribe course module URL, when the user starts a session, then the study page opens an external session and attempts to render the course page in the player area with notes available.
- Given a direct video URL, when the user inserts or clicks a timestamp, then the HTML video player's current time is used for timestamping and seeking.
- Given a provider blocks embedding, when the external player area loads, then the user still sees the original URL action and can open it in the logged-in browser.

## Design Notes

This is a legitimate-access integration, not a paywall bypass. The app can try browser-side embedding because the user's browser may already have valid provider cookies. If the provider denies framing or media access, the fallback must be honest and preserve the user's ability to open the source site.

## Verification

**Commands:**
- `npm run lint` -- expected: no new lint/type issues in touched files
- `npm run build` -- expected: Next.js build completes

**Manual checks:**
- Open `/study/youtube`, paste the provided Airtribe module URL, and confirm whether the provider permits playback in the embedded area while notes remain usable.

## Suggested Review Order

**Entry Point**

- External URLs branch into the same study shell.
  [`page.tsx:74`](../../src/app/study/youtube/page.tsx#L74)

**Session Model**

- External sessions are keyed deterministically by normalized URL.
  [`youtube.ts:150`](../../src/actions/youtube.ts#L150)

- Backward-compatible player metadata keeps existing YouTube sessions valid.
  [`collections.ts:243`](../../src/lib/db/collections.ts#L243)

**Playback**

- The study client swaps player implementations while preserving notes.
  [`youtube-study-client.tsx:53`](../../src/components/features/youtube-study-client.tsx#L53)

- Direct videos get real timestamp and seek support.
  [`external-video-player.tsx:30`](../../src/components/features/external-video-player.tsx#L30)

- Course pages embed with reload and open-original controls.
  [`external-video-player.tsx:63`](../../src/components/features/external-video-player.tsx#L63)

**Input**

- The form routes YouTube URLs unchanged and external URLs via `u`.
  [`youtube-url-form.tsx:16`](../../src/components/features/youtube-url-form.tsx#L16)

**Types**

- Session types expose source/player modes to client components.
  [`index.ts:189`](../../src/types/index.ts#L189)
