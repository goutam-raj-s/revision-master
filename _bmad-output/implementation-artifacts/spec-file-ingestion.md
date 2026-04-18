---
title: 'Universal File Ingestion — Audio, Video & Documents'
type: 'feature'
created: '2026-04-18'
status: 'done'
baseline_commit: '99da7610537c52351679718424c64565fb8cb982'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app only queues Google Doc URLs for revision; users accumulate knowledge in audio files, recorded lectures, PDFs, videos, and other formats that cannot be added to the revision system today.

**Approach:** Extend the ingestion pipeline with two paths: (1) file upload for audio (≤5 MB), documents, and images — stored on Cloudinary; (2) URL link entry for videos (stored as a URL reference only, no file upload). The existing `documents` collection is extended with optional media fields so all items share one collection, one task queue, and one set of server actions.

## Boundaries & Constraints

**Always:**
- Upload-supported types (stored on Cloudinary): PDF, DOCX, TXT, MD, PPTX, MP3, M4A, WAV, OGG, PNG, JPG, JPEG, GIF, WEBP.
- Audio files: max **5 MB** per file, enforced client-side and server-side.
- Non-audio uploadable files (PDF, DOCX, images etc.): max 50 MB per file.
- Video entries: stored as a **URL link only** (e.g. a direct video URL or any web-hosted video). No video file is uploaded or stored. `mediaType: "video"` uses the existing URL field, just like Google Docs.
- Files uploaded to Cloudinary under `revision-master/{userId}/` resource path; unsigned upload preset used.
- All metadata (filename, cloudinaryPublicId, fileUrl, fileSize, mimeType, mediaType) stored in the existing `documents` MongoDB collection as new optional fields.
- `url` field on a file document stores the Cloudinary delivery URL (for uploads) or the video link (for video URL entries); `mediaType` discriminates between `"google-doc"`, `"pdf"`, `"audio"`, `"video"`, `"image"`, `"document"`.
- All existing spaced-repetition scheduling, notes, tags, difficulty, and task queue logic applies unchanged to all entry types.
- `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` (unsigned) stored as env vars.

**Ask First:**
- If Cloudinary free tier quota is approached (25 GB), ask before switching storage provider.

**Never:**
- Do not allow video file uploads — video entries are URL-only.
- Do not allow audio files larger than 5 MB to upload.
- Do not store binary file content in MongoDB.
- Do not require a Cloudinary API secret for uploads — use unsigned upload preset.
- Do not break existing Google Doc entry behavior; `mediaType` defaults to `"google-doc"` for all existing records.
- Do not add a separate collection; extend `documents`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Upload valid PDF | User selects a 10 MB PDF | File uploaded to Cloudinary, document record created, appears in task queue | — |
| Upload valid audio | User selects a 3 MB MP3 | File uploaded to Cloudinary, `mediaType: "audio"`, appears in queue with audio icon | — |
| Audio exceeds 5 MB | User selects a 7 MB MP3 | Client-side error: "Audio files must be under 5 MB" | Upload never initiates |
| Upload oversized non-audio | File > 50 MB selected | Client-side error: "File exceeds 50 MB limit" | Upload never initiates |
| Upload unsupported type | `.exe` or `.zip` selected | Client-side error: "Unsupported file type" | File rejected in input `accept` attribute |
| Add video URL | User pastes a direct video link (MP4 URL, Vimeo, etc.) | Document record created with `mediaType: "video"`, URL stored, no file uploaded | — |
| Upload while offline | Network drops mid-upload | Progress indicator freezes; error: "Upload failed. Try again." | Retry button shown |
| Delete upload entry | User deletes a Cloudinary-backed document | Cloudinary asset deleted + MongoDB record removed | If Cloudinary delete fails, log error but still delete MongoDB record |
| Delete video URL entry | User deletes a video URL document | Only MongoDB record removed (no Cloudinary asset to clean up) | — |
| Existing Google Doc | Any pre-existing document | Renders/behaves exactly as before; `mediaType` treated as `"google-doc"` | — |

</frozen-after-approval>

## Code Map

- `src/types/index.ts` — extend `DbDocument` with `mediaType?`, `cloudinaryPublicId?`, `fileUrl?`, `fileSize?`, `mimeType?`; add `MediaType` union type; extend `Document` serialized type
- `src/lib/cloudinary.ts` — NEW: Cloudinary client helpers: `deleteCloudinaryAsset(publicId)` using `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` (delete requires signed request)
- `src/actions/documents.ts` — extend `addDocumentAction` to accept file metadata; add `deleteCloudinaryAsset` call in `deleteDocumentAction`; add `addFileDocumentAction` for file-specific creation path
- `src/components/features/add-document-form.tsx` — add file upload tab alongside existing URL tab; file input with drag-and-drop, progress bar, type/size validation; on upload complete, call `addFileDocumentAction` with Cloudinary response
- `src/components/features/task-row.tsx` — add media type icon (FileAudio, FileVideo, FileText, Image icons from lucide) next to document title
- `src/components/features/document-list-client.tsx` — no change needed (works generically)
- `src/app/study/[docId]/page.tsx` — add conditional rendering: if `mediaType === "audio"`, render HTML5 `<audio>` player; if `"video"`, render `<video>` player with speed controls; if `"pdf"`, render `<iframe src={fileUrl}>` or `<embed>`; if `"image"`, render `<img>`; default stays Google Doc iframe

## Tasks & Acceptance

**Execution:**
- [ ] `src/types/index.ts` -- add `MediaType = "google-doc" | "pdf" | "audio" | "video" | "image" | "document"` union; extend `DbDocument` with optional `mediaType`, `cloudinaryPublicId`, `fileUrl`, `fileSize`, `mimeType`; extend serialized `Document` type -- all items share one type system
- [ ] `src/lib/db/collections.ts` -- add `mediaType` to `serializeDoc`; ensure existing docs without `mediaType` serialize as `"google-doc"` -- backwards compat
- [ ] `src/lib/cloudinary.ts` -- create module exporting `deleteCloudinaryAsset(publicId: string): Promise<void>` using Cloudinary REST API with `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`/`CLOUDINARY_CLOUD_NAME` -- server-side only for deletes
- [ ] `src/actions/documents.ts` -- add `addFileDocumentAction(data: { title: string, cloudinaryPublicId: string, fileUrl: string, fileSize: number, mimeType: string, mediaType: MediaType, tags: string[], difficulty: Difficulty, delayDays: number })` that creates a document + repetition record; extend `deleteDocumentAction` to call `deleteCloudinaryAsset` if `cloudinaryPublicId` present -- file lifecycle management
- [ ] `src/components/features/add-document-form.tsx` -- add tab switcher: "Link" (existing, now also accepts video URLs) | "File Upload"; file tab: drag-and-drop zone + click-to-browse, `accept` covers all uploadable MIME types (no video), per-type size check (audio ≤5 MB, others ≤50 MB), uploads to Cloudinary unsigned endpoint, shows upload progress via `XMLHttpRequest`, on success calls `addFileDocumentAction`; Link tab: detect video URL patterns (direct `.mp4`, Vimeo, etc.) and route to `addFileDocumentAction` with `mediaType: "video"` and no Cloudinary fields -- complete upload + link UX
- [ ] `src/components/features/task-row.tsx` -- show media type icon (lucide: `FileAudio` for audio, `FileVideo` for video, `FileText` for pdf/doc, `Image` for image, `Link` for google-doc) before title -- visual discrimination in task queue
- [ ] `src/app/study/[docId]/page.tsx` -- in left-pane area, switch on `doc.mediaType`: audio → `<audio controls>` with speed selector (Cloudinary URL); video → `<video controls>` or `<iframe>` with speed selector using `doc.url` (the stored video link, no Cloudinary); pdf → `<iframe>` with Cloudinary PDF viewer URL; image → `<img className="max-w-full">`; default → existing Google Doc iframe -- per-type study experience

**Acceptance Criteria:**
- Given a user uploads a 3 MB MP3, when the upload completes, then a document record with `mediaType: "audio"` exists in MongoDB and the file appears in the task queue with an audio icon.
- Given a user uploads a 7 MB MP3, when the file is selected, then an error "Audio files must be under 5 MB" is shown before any upload is attempted.
- Given a user uploads a PDF, when they open the study page, then the PDF is rendered inline (not as a download link).
- Given a user adds a video URL (not a file upload), when they open the study page, then a video player using that URL is shown — no Cloudinary asset is created.
- Given a Cloudinary-backed file entry is deleted, then both the Cloudinary asset and MongoDB record are removed.
- Given a video URL entry is deleted, then only the MongoDB record is removed.
- Given a 60 MB non-audio file is selected, when the file input fires, then an error is shown before any upload is attempted.
- Given an existing Google Doc entry, when it appears in the task queue or study page, then behavior is exactly unchanged.

## Design Notes

**Cloudinary unsigned upload:**
Client POSTs directly to `https://api.cloudinary.com/v1_1/{CLOUD_NAME}/auto/upload` with `upload_preset` field. No API secret exposed to the browser. The unsigned preset is configured in Cloudinary dashboard to restrict to `revision-master/` folder prefix. The `public_id` and `secure_url` returned in the JSON response are passed to `addFileDocumentAction`.

**Speed control:**
`<select>` with options [0.5, 0.75, 1, 1.25, 1.5, 2] × speed, wired to `mediaElement.playbackRate`. Persisted in `localStorage` per media type.

## Verification

**Commands:**
- `npm run build` -- expected: no TypeScript errors, build succeeds

**Manual checks:**
- Upload MP3 ≤5 MB — Cloudinary asset created, audio player shown in study page
- Upload MP3 >5 MB — client error, no network request made
- Add a video URL — no Cloudinary asset created, video player shown in study page using the URL
- Upload PDF — rendered inline in study page
- Delete an uploaded file — Cloudinary asset removed
- Delete a video URL entry — only MongoDB record removed
- Existing Google Doc entries unaffected
