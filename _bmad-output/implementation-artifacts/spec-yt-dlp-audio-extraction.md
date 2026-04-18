---
title: 'Server-side YouTube Audio Extraction (yt-dlp)'
type: 'feature'
created: '2026-04-18'
status: 'done'
baseline_commit: 'b2269ab6f7fff3de9d22387c0056e45a89914617'
context: []
---

<frozen-after-approval>

## Intent

**Problem:** Users cannot add YouTube videos strictly as background audio tracks. Currently, YouTube URLs can only be added to study mode (with a video player), and uploading audio requires downloading the file first. 
**Approach:** Move audio addition exclusively to the Music page. Allow users to paste a YouTube URL which will be added as an Audio document. On playback, the client will call a Next.js API route (`/api/audio/yt-stream`) that shells out to `yt-dlp` to get the direct `googlevideo.com` audio stream URL, which is then set as the `<audio src>`.

## Boundaries & Constraints

**Always:**
- Execute `yt-dlp -f bestaudio --get-url` in the API route using `child_process.exec`.
- Store the regular YouTube URL in the `DbDocument.url` field for the audio document.
- In `audio-engine.tsx`, intercept playback: if the URL is a YouTube URL, fetch the stream URL from the API before setting `audio.src`.
- Remove audio file upload from the central Add Document form (`add-document-form.tsx`).
- Introduce an "Add Track" feature on the Music library page (`/music`) that handles both audio file uploads and YouTube audio additions.

**Never:**
- Do not download the video/audio file to disk via yt-dlp. Only extract the stream URL.
- Do not store the extracted stream URL in MongoDB (it expires in ~6 hours).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Play YouTube audio track | Track has YouTube URL | Client calls `/api/audio/yt-stream`, gets stream URL, plays it | If yt-dlp fails, show toast "Failed to extract stream" and skip to next |
| Re-play same track later | Stream URL expired | Client calls API route again to get fresh stream URL | — |
| Add audio track | User pastes YouTube URL in `/music` | Metadata (title, thumbnail) fetched via oEmbed, added as Audio doc | — |

</frozen-after-approval>

## Code Map

- `src/app/api/audio/yt-stream/route.ts` -- NEW: API route to execute yt-dlp and return stream URL
- `src/components/features/audio-engine.tsx` -- UPDATE: intercept playback for YouTube URLs to fetch stream URL first
- `src/components/features/music-library-client.tsx` -- UPDATE: Add "Add Track" button and dialog
- `src/components/features/add-audio-form.tsx` -- NEW: form specifically for adding audio (file or YouTube link), placed inside the new dialog
- `src/components/features/add-document-form.tsx` -- UPDATE: remove audio file upload support; redirect users to `/music` for audio uploads
- `src/actions/youtube.ts` -- UPDATE: export `fetchYoutubeMetadata` if needed (already exported likely), handle adding audio doc

## Tasks & Acceptance

**Execution:**
- [x] `src/app/api/audio/yt-stream/route.ts` -- create GET handler that takes `?url=...`, calls `exec('yt-dlp -f bestaudio --get-url <url>')` directly, returning the stdout stream URL
- [x] `src/components/features/audio-engine.tsx` -- update `useEffect` for `currentTrack?.id` to check if `currentTrack.url` matches a YouTube regex. If so, `fetch('/api/audio/yt-stream?url=...')` before `audio.play()`, else play as normal.
- [x] `src/components/features/add-audio-form.tsx` -- extract and adapt the file upload logic from `add-document-form.tsx`, and add a YouTube URL input that uses `fetchYoutubeMetadata` and saves an Audio `DbDocument`.
- [x] `src/components/features/music-library-client.tsx` -- add an "Add Track" button next to "New Playlist" that opens a Dialog containing `<AddAudioForm>`.
- [x] `src/components/features/add-document-form.tsx` -- remove `audio/` mime types from `ACCEPTED_MIME_TYPES` and `validateFile`; if user tries to upload audio, instruct them to use the `/music` page.

**Acceptance Criteria:**
- Given a YouTube URL, when submitted in the Music page, then an Audio document is created and appears in the track list.
- Given a YouTube audio track, when played, then the `<audio>` element plays it without storing the file on the server.
- Given the central add form, when a user tries to upload an mp3, then it is rejected with a message to use the Music page.

## Verification

**Commands:**
- `npm run dev` -- manual check only

**Manual checks (if no CLI):**
- Verify adding YouTube link in `/music` works.
- Verify playing it plays the audio.
- Verify standard audio file upload in `/music` works.
- Verify uploading audio in `/dashboard` is prevented.

## Suggested Review Order

**Stream Extraction API**

- Server-side yt-dlp execution API endpoint.
  [`route.ts:15`](../../src/app/api/audio/yt-stream/route.ts#L15)

**Client Audio Engine**

- Intercepts playback for YouTube docs and fetches the transient stream URL.
  [`audio-engine.tsx:46`](../../src/components/features/audio-engine.tsx#L46)

**Audio Upload Forms**

- New dedicated Add Audio form natively handling both YouTube URLs and file uploads.
  [`add-audio-form.tsx:32`](../../src/components/features/add-audio-form.tsx#L32)

- Add Track action button and Dialog embedded within the Music Library.
  [`music-library-client.tsx:230`](../../src/components/features/music-library-client.tsx#L230)

- Generic document ingestion form stripped of audio upload responsibilities.
  [`add-document-form.tsx:616`](../../src/components/features/add-document-form.tsx#L616)

