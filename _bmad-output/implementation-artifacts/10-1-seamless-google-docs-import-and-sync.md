---
title: "Seamless Google Docs Import and Sync"
type: "feature-story"
created: "2026-05-30"
status: "review"
epic: "10 - Google Docs Import Experience"
context:
  - "_bmad-output/implementation-artifacts/2-1-google-doc-url-submission-and-title-extraction.md"
  - "_bmad-output/implementation-artifacts/spec-file-ingestion.md"
  - "src/actions/documents.ts"
  - "src/components/features/add-document-form.tsx"
  - "src/app/api/auth/[provider]/route.ts"
  - "src/app/api/auth/[provider]/callback/route.ts"
---

# Story 10.1: Seamless Google Docs Import and Sync

Status: review

## Story

As a **learner with many Google Docs**,
I want to choose Google Docs directly from my account and import them in bulk,
So that I do not have to paste document URLs one by one before using Revision Master.

## Product Intent

The current document ingestion flow asks users to manually paste a Google Docs URL in the document section. This is too much friction for users who already have many learning docs in Google Docs.

The desired experience is:

1. User opens Documents.
2. User clicks **Import Google Docs**.
3. A Google Docs-only picker opens.
4. User selects one or many docs.
5. Revision Master imports every selected doc, creates normal revision records, and keeps those selected docs syncable.

Important product language: the app should feel like it imports all the user's study docs in one flow, but the first implementation must not request unrestricted Google Drive access. It should use user-selected Google Docs access through Google Picker and the `drive.file` OAuth scope.

## Scope Decision

### In Scope

- Add a seamless **Import Google Docs** flow to the existing Add Document experience.
- Use Google Picker configured for Google Docs only.
- Allow multi-select import so users can bring many docs in one session.
- Request the narrow `https://www.googleapis.com/auth/drive.file` scope for user-selected files.
- Persist encrypted Google OAuth refresh tokens only if needed for continued sync of selected docs.
- Store Google file metadata on imported document records.
- Add **Sync now** behavior for previously selected/imported Google Docs.
- Prevent duplicates by `userId + googleDriveFileId`.
- Preserve the existing manual URL path.

### Out of Scope for This Story

- Do not implement silent account-wide discovery of every Google Doc in a user's Drive.
- Do not request `drive.readonly` or `drive` by default.
- Do not import photos, videos, folders, Sheets, Slides, PDFs, or arbitrary Drive files.
- Do not mutate the user's Google Docs content.
- Do not delete, rename, move, or share files in Google Drive.

### Product Note on "Import All"

A true one-click "import every Google Doc in my account" requires broad Drive discovery, normally `drive.readonly`, which Google classifies as a restricted scope. That has a heavier consent screen and may require restricted-scope verification/security assessment.

For the first seamless version, "all" means all docs the user selects in the Google Docs picker during the import session. The UX should make multi-select fast enough that this still feels like a bulk import, not manual URL entry.

## Acceptance Criteria

1. Given an authenticated user is on the Documents page, when they choose Add Document, then they can select a **Google Docs** import option alongside the existing Link and File flows.
2. Given the user clicks **Import Google Docs**, when authorization is needed, then the app requests the narrow `drive.file` scope rather than `drive.readonly` or `drive`.
3. Given the Google Picker opens, when the user sees selectable files, then the picker is filtered to Google Docs only using MIME type `application/vnd.google-apps.document`.
4. Given the user selects multiple Google Docs, when they confirm selection, then the app imports all selected docs in one operation.
5. Given an imported Google Doc, when the document record is created, then it includes title, Google Docs URL, `googleDriveFileId`, `googleDriveModifiedTime`, `source: "google-picker"`, `mediaType: "google-doc"`, default status `first_visit`, selected/default difficulty, tags, and an initial repetition schedule.
6. Given the user selects a Google Doc that is already imported, when the import completes, then no duplicate document is created and the UI reports it as already imported.
7. Given a selected doc is private but accessible to the authenticated Google account, when imported, then the app can create a document record without requiring the doc to be publicly shared.
8. Given a user imported selected Google Docs earlier, when they click **Sync now**, then the app checks only those stored Google file IDs and updates title/content metadata for changed docs.
9. Given Google access expires or is revoked, when sync runs, then the app marks sync as needing reconnection and shows a clear reconnect action.
10. Given existing manually pasted Google Docs, uploaded files, videos, native docs, notes, terms, repetitions, and task queues exist, when this story is implemented, then existing behavior remains unchanged.

## UX Requirements

- Primary CTA text: **Import Google Docs**.
- Avoid primary UI language like "Connect Google Drive" because users may think photos, videos, and folders are being accessed.
- Pre-permission reassurance copy should be short and visible before OAuth/Picker:

```text
Choose the Google Docs you want to study. Revision Master only imports docs you select here.
```

- Import result should summarize:
  - Imported count
  - Already imported count
  - Failed count, if any
- After successful import, keep the user in the Documents flow and show the imported docs immediately.
- The Google Docs tab should use the existing visual language in `src/components/features/add-document-form.tsx`: compact controls, lucide icons, inline loading, toast feedback, and no oversized marketing panel.
- If the user wants to import more later, the action should be **Choose more Google Docs**.
- Provide a per-document sync indicator in document detail or list metadata only if it can be done without clutter.

## Technical Requirements

### OAuth and Picker

- Keep login OAuth separate from Google Docs import authorization.
- Existing Google login currently requests only `openid email profile` in `src/app/api/auth/[provider]/route.ts`; do not expand login scopes for all users.
- Add a dedicated import authorization endpoint, for example:
  - `src/app/api/google-docs/auth/route.ts`
  - `src/app/api/google-docs/callback/route.ts`
- Request:
  - `https://www.googleapis.com/auth/drive.file`
  - `access_type=offline`
  - `prompt=consent` only when a refresh token is needed and no stored token exists.
- Store refresh tokens encrypted using the existing AES-GCM helpers in `src/lib/crypto/index.ts`.
- Add CSRF/state validation similar to the existing OAuth state cookie pattern.
- Use Google Picker on the client with multi-select enabled and a Google Docs MIME filter.
- Picker must not allow arbitrary Drive file imports.

### Data Model

Extend `DbDocument` and serialized `Document` in `src/types/index.ts` with optional Google sync fields:

```ts
source?: "manual" | "google-picker" | "upload" | "native";
googleDriveFileId?: string;
googleDriveModifiedTime?: Date;
googleDriveVersion?: string;
googleDriveWebViewLink?: string;
googleDriveExportMimeType?: string;
googleDriveSyncStatus?: "synced" | "needs_sync" | "needs_reconnect" | "error";
googleDriveSyncError?: string;
lastSyncedAt?: Date;
```

Add an encrypted token storage model. Prefer a separate collection over bloating `users`:

```ts
interface DbGoogleIntegration {
  _id: ObjectId;
  userId: ObjectId;
  provider: "google";
  scopes: string[];
  refreshTokenEncrypted?: string;
  accessTokenExpiresAt?: Date;
  connectedAt: Date;
  updatedAt: Date;
}
```

Add collection helper and indexes in `src/lib/db/collections.ts`:

- `getGoogleIntegrationsCollection()`
- Unique index: `{ userId: 1, provider: 1 }`
- Documents unique sparse index: `{ userId: 1, googleDriveFileId: 1 }`

### Server Actions and API Routes

Add server-side Google Docs import/sync actions, keeping Drive tokens server-only:

- `src/lib/google/drive.ts` new helper module:
  - exchange auth code for tokens
  - refresh access token
  - get file metadata by ID
  - export Google Doc content
  - normalize Google Docs URL
- `src/actions/google-docs.ts` new Server Actions:
  - `importSelectedGoogleDocsAction(files, options)`
  - `syncGoogleDocsAction(docIds?: string[])`
  - `disconnectGoogleDocsAction()`

Import action input from client should be minimal:

```ts
{
  files: Array<{
    id: string;
    name?: string;
    url?: string;
  }>;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  initialDelayDays: number;
}
```

Server must re-fetch metadata for each file ID using the user's token rather than trusting client-provided names/URLs.

For each imported doc:

1. Validate user session with `requireAuth()`.
2. Fetch metadata from Drive API with fields: `id`, `name`, `mimeType`, `modifiedTime`, `version`, `webViewLink`.
3. Reject non-Google-Docs MIME types.
4. Upsert by `userId + googleDriveFileId`.
5. Create a repetition record for newly inserted docs using existing SRS helpers.
6. Revalidate `/documents`, `/dashboard`, and relevant study routes.

### Content and Sync Behavior

- For display, keep the existing Google Docs URL/embed behavior where possible.
- If caching content is needed for resilience or future AI features, use Drive `files.export` to export Google Workspace docs. Prefer `text/html` for rich document cache or `text/plain` for lightweight search/summarization.
- Respect Google's export limit: exported content is limited to 10 MB.
- Sync should update:
  - `title`
  - `googleDriveModifiedTime`
  - `googleDriveVersion`
  - optional cached `content`
  - `googleDriveSyncStatus`
  - `lastSyncedAt`
- Sync must only touch documents owned by the current app user and only records with a stored `googleDriveFileId`.

### Existing Files to Update

- `src/types/index.ts`
  - Extend `DbDocument`, `Document`, and add `DbGoogleIntegration`.
- `src/lib/db/collections.ts`
  - Add collection accessor, indexes, serializer fields.
- `src/components/features/add-document-form.tsx`
  - Add Google Docs import tab or mode without breaking Link/File behavior.
- `src/actions/documents.ts`
  - Reuse document creation logic where practical; avoid duplicating repetition creation bugs.
- `src/app/(dashboard)/documents/page.tsx`
  - Surface imported docs immediately; no major layout rewrite required.
- `src/app/api/auth/[provider]/route.ts`
  - Do not add Drive scopes to normal login.
- `src/app/api/auth/[provider]/callback/route.ts`
  - Do not store Drive tokens here unless explicitly refactored into shared OAuth helpers.
- `.env.example`
  - Add `GOOGLE_PICKER_API_KEY` if Picker requires a browser API key for this implementation.
  - Confirm existing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are sufficient for OAuth.

### New Files Expected

- `src/lib/google/drive.ts`
- `src/actions/google-docs.ts`
- `src/app/api/google-docs/auth/route.ts`
- `src/app/api/google-docs/callback/route.ts`
- Optional: `src/components/features/google-docs-importer.tsx`

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| User cancels Picker | No import, no error toast; keep them in Add Document |
| User selects 0 docs | Disable confirm or show inline "Choose at least one doc" |
| User selects already imported docs | Do not duplicate; summarize as already imported |
| User selects non-Doc file somehow | Server rejects with unsupported type; continue importing valid docs |
| Refresh token missing | Show reconnect action before sync |
| Google token revoked | Mark integration/doc sync status as `needs_reconnect` |
| Drive API rate limit | Partial success summary; failed docs can retry |
| Large exported doc over 10 MB | Keep metadata/link imported; mark content cache skipped |
| Existing public URL doc later selected in Picker | Prefer merge/upsert by extracted Google Doc ID if detectable; do not duplicate |
| User disconnects Google Docs | Stop sync and remove stored token; keep imported document records unless user deletes them |

## Security and Privacy Requirements

- Never expose Google access tokens or refresh tokens to the client.
- Encrypt refresh tokens at rest using existing `encrypt()` helper.
- Do not log tokens, auth codes, raw OAuth responses, or exported document content.
- Use the narrowest scope in this story: `drive.file`.
- Do not use restricted scopes (`drive`, `drive.readonly`, `drive.metadata.readonly`) for this implementation.
- Only import Docs explicitly selected in Picker.
- Add UI copy that says selected Google Docs only, not full Drive access.

## Implementation Tasks

- [x] Add Google integration types, collection helper, and indexes.
- [x] Add dedicated Google Docs OAuth routes with `drive.file`, state cookie validation, token exchange, and encrypted refresh-token storage.
- [x] Add Google Drive helper module for token refresh, file metadata fetch, doc export, and URL normalization.
- [x] Add `importSelectedGoogleDocsAction` with server-side metadata validation, duplicate handling, document insert/upsert, repetition creation, and path revalidation.
- [x] Add `syncGoogleDocsAction` for selected/imported docs only.
- [x] Add Google Docs import UI to `AddDocumentForm` or a child component, using Picker with Docs-only filter and multi-select.
- [x] Add import result summary and reconnect/sync error states.
- [x] Add `.env.example` entries and setup notes for Google Picker/API key if required.
- [x] Add tests or focused verification for duplicate import, non-Doc rejection, missing token, and repetition creation.
- [x] Run `npm run build` and fix TypeScript/lint regressions.

## Verification

### Automated

- `npm run build` should pass.
- Add focused unit tests if a local test harness exists for:
  - Google Docs MIME validation
  - Duplicate `googleDriveFileId` handling
  - Token missing/reconnect state
  - Document plus repetition creation

### Manual

- Import one private Google Doc that is not publicly shared.
- Import multiple Google Docs in one Picker session.
- Re-import the same docs and confirm no duplicates.
- Confirm Link and File flows still work.
- Confirm existing Google Doc URL records still open in study view.
- Revoke Google access, run sync, and confirm reconnect state.
- Disconnect Google Docs and confirm imported records remain while sync stops.

## Latest API Notes

- Google recommends narrow scopes and states that `drive.file` gives per-file access for files opened by or shared with the app through Google Picker.
- Google Picker is a file-open dialog for Drive content and is separate from the Drive API.
- Drive `files.export` supports `drive.file` and exports Google Workspace documents, but exported content is limited to 10 MB.

References:

- https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- https://developers.google.com/workspace/drive/api/guides/picker
- https://developers.google.com/workspace/drive/api/reference/rest/v3/files/export

## Dev Agent Guardrails

- Do not silently broaden OAuth scopes to make implementation easier.
- Do not put Drive scopes on ordinary Google login.
- Do not trust Picker-provided metadata without server verification.
- Do not create a separate "google docs" collection; imported docs must live in the existing `documents` collection so SRS, notes, terms, search, and dashboard behavior continue to work.
- Do not break `mediaType` behavior introduced by file ingestion.
- Do not store binary files in MongoDB.
- Keep UI compact and workflow-first.

## Completion Note

This story is ready for dev. It gives the developer the exact product experience, privacy boundary, Google API constraints, app integration points, and verification checklist needed to build a seamless Google Docs bulk import without asking for broad Drive access.

## Dev Agent Record

### Implementation Notes

- Added `DbGoogleIntegration` type and Google sync fields (`source`, `googleDriveFileId`, `googleDriveModifiedTime`, `googleDriveVersion`, `googleDriveWebViewLink`, `googleDriveSyncStatus`, `googleDriveSyncError`, `lastSyncedAt`) to `DbDocument`/`Document` in `src/types/index.ts`.
- Added `getGoogleIntegrationsCollection()` accessor and corresponding unique index `{ userId, provider }` in `src/lib/db/collections.ts`. Also added unique sparse index `{ userId, googleDriveFileId }` on documents collection.
- `serializeDoc` updated to pass through all Google sync fields.
- `src/lib/google/drive.ts` — token exchange, refresh, file metadata, content export, URL normalization, `getValidAccessToken` (auto-refresh with 1-min buffer), `storeGoogleIntegration`.
- `src/app/api/google-docs/auth/route.ts` — dedicated OAuth route for `drive.file` scope only; does not touch the normal login OAuth; sets `gdocs_oauth_state` cookie for CSRF.
- `src/app/api/google-docs/callback/route.ts` — validates state, exchanges code for tokens, stores encrypted refresh token, redirects to `/documents/new?tab=google&status=connected` or `?status=error`.
- `src/actions/google-docs.ts` — `getGoogleConnectionStatusAction`, `getPickerAccessTokenAction` (returns short-lived access token for Picker), `importSelectedGoogleDocsAction` (server-side metadata verification, MIME validation, duplicate guard by `googleDriveFileId`, repetition creation), `syncGoogleDocsAction`, `disconnectGoogleDocsAction`.
- `src/components/features/google-docs-importer.tsx` — `GoogleDocsTab` client component; handles all phases (loading, disconnected, picking, importing, result); loads Google Picker SDK dynamically; shows sync/disconnect controls when connected.
- `src/components/features/add-document-form.tsx` — added "Google Docs" third tab; accepts `initialTab` and `googleStatus` props for OAuth return redirect.
- `src/app/(dashboard)/documents/new/page.tsx` — reads `tab` and `status` searchParams to initialize the form tab post-OAuth.
- `.env.example` — added `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY` with setup notes.
- `npm run build` passes with zero TypeScript errors.

### File List

- `src/types/index.ts` — modified
- `src/lib/db/collections.ts` — modified
- `src/lib/google/drive.ts` — new
- `src/actions/google-docs.ts` — new
- `src/app/api/google-docs/auth/route.ts` — new
- `src/app/api/google-docs/callback/route.ts` — new
- `src/components/features/google-docs-importer.tsx` — new
- `src/components/features/add-document-form.tsx` — modified
- `src/app/(dashboard)/documents/new/page.tsx` — modified
- `.env.example` — modified

### Change Log

- 2026-06-01: Implemented story 10.1 — seamless Google Docs import and sync feature.
