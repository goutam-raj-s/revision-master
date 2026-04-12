# Story 2.1: Google Doc URL Submission & Title Extraction

Status: done

## Story

As a **user**,
I want to paste a public Google Doc URL and have the system automatically extract and display its title,
So that adding new documents to my knowledge graph is frictionless.

## Acceptance Criteria

1. A valid public Google Doc URL causes the title to be fetched and displayed within 3 seconds.
2. A new record is created in the Documents collection containing the URL, extracted title, and userId.
3. An invalid or non-public URL results in a clear error message and no record is created.
4. The document status is set to "first-visit" on creation.

## Tasks / Subtasks

- [x] Task 1: Implement URL validation utility (AC: 3)
  - [x] Write `isValidGoogleDocUrl()` in `src/lib/utils.ts` using regex to match `docs.google.com/document/d/{id}` patterns
  - [x] Write `extractGoogleDocId()` to pull the document ID from any valid Google Docs URL variant
  - [x] Write `getGoogleDocEmbedUrl()` to construct the `/preview` embed URL from a doc ID

- [x] Task 2: Implement `fetchDocTitleAction` Server Action (AC: 1)
  - [x] Fetch the Google Doc HTML via `fetch()` with a timeout of 3 seconds
  - [x] Parse the HTML to find and extract the `<title>` tag content
  - [x] Strip the " - Google Docs" suffix from the extracted title
  - [x] Return an error if the fetch fails or the URL is non-public (non-200 response)

- [x] Task 3: Implement `addDocumentAction` Server Action (AC: 2, 3, 4)
  - [x] Validate inputs with a Zod schema (url: string url, initialDelayDays: coerce int, userId from session)
  - [x] Call `isValidGoogleDocUrl()` — return field error if invalid
  - [x] Call `fetchDocTitleAction` — surface error if title fetch fails
  - [x] Run Jaccard similarity check against existing document titles for the user to prevent duplicates
  - [x] Insert document record: `{ url, title, userId, status: "first-visit", createdAt, updatedAt, cachedTitle }`
  - [x] Call `revalidatePath("/documents")` after successful insert

- [x] Task 4: Build Add Document form component (AC: 1, 3)
  - [x] Create `src/components/features/add-document-form.tsx` as a Client Component
  - [x] URL input with live validation feedback using React state
  - [x] "Fetch Title" button that calls `fetchDocTitleAction` and displays the extracted title as a preview
  - [x] Submit button that calls `addDocumentAction`
  - [x] Display server-side error messages inline beneath the URL field
  - [x] Show loading spinner during fetch and submission

- [x] Task 5: Build the `/documents/new` page (AC: 1)
  - [x] Create `src/app/(dashboard)/documents/new/page.tsx` as a server component
  - [x] Protect the route — redirect unauthenticated users to `/login`
  - [x] Render the `AddDocumentForm` component inside the dashboard layout

## Dev Notes

- **URL Validation:** Google Docs URLs come in multiple formats (`/document/d/{id}/edit`, `/document/d/{id}/view`, bare `/document/d/{id}`). The regex handles all variants by anchoring on the `/document/d/` segment and extracting the alphanumeric ID.
- **Title Extraction:** The fetch is a plain HTTP GET with no auth headers. Google returns 200 for public docs and a redirect/403 for private ones. The `<title>` tag in the HTML payload is the reliable source of the document name.
- **Jaccard Similarity:** Computed as `|A ∩ B| / |A ∪ B|` over word-token sets of the new title and each existing title. A threshold of 0.8 triggers a duplicate warning (non-blocking — user can override).
- **Zod Schema:** `initialDelayDays` is coerced with `.coerce.number().int().positive().default(2)` so form string values are cast safely.
- **revalidatePath:** Called after insert so the `/documents` list page reflects the new record on next navigation without a full reload.
- **Status Enum:** "first-visit" is the canonical initial value, matching the `status` field type `"first-visit" | "revision" | "updated" | "completed"` defined in `src/types/index.ts`.

### References
- Source: Next.js Server Actions docs — `"use server"` directive, form action binding
- Source: Zod docs — `.coerce`, `.default()`, `.safeParse()`
- Source: MongoDB Node driver — `insertOne`, `ObjectId`

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Encountered a CORS-adjacent issue when calling `fetch()` from a Server Action targeting `docs.google.com` — resolved by ensuring the fetch runs server-side only (Server Action, not client fetch).
- Initial regex missed the `/document/u/0/d/{id}` workspace variant; updated to handle optional `/u/\d+` segment.

### Completion Notes List
- `isValidGoogleDocUrl`, `extractGoogleDocId`, and `getGoogleDocEmbedUrl` implemented and exported from `src/lib/utils.ts`.
- `fetchDocTitleAction` implemented as a Server Action; strips " - Google Docs", " – Google Docs" (en-dash variant), and trailing whitespace.
- `addDocumentAction` performs full Zod validation, URL format check, title fetch, Jaccard duplicate detection, DB insert, and path revalidation in a single atomic flow.
- `AddDocumentForm` client component uses `useTransition` to show pending state during Server Action calls.
- `/documents/new` page protected by session check with redirect.

### File List
- `src/actions/documents.ts` — Server Actions: `fetchDocTitleAction`, `addDocumentAction`, and other document mutations
- `src/components/features/add-document-form.tsx` — Client Component form for URL input, title preview, and submission
- `src/app/(dashboard)/documents/new/page.tsx` — Route page for adding a new document
- `src/lib/utils.ts` — Utility functions: `isValidGoogleDocUrl`, `extractGoogleDocId`, `getGoogleDocEmbedUrl`
- `src/types/index.ts` — `DbDocument` type with `status`, `cachedTitle`, `cachedSnapshot` fields

### Change Log
- Added `isValidGoogleDocUrl`, `extractGoogleDocId`, `getGoogleDocEmbedUrl` to `src/lib/utils.ts`
- Created `src/actions/documents.ts` with `fetchDocTitleAction` and `addDocumentAction`
- Created `src/components/features/add-document-form.tsx`
- Created `src/app/(dashboard)/documents/new/page.tsx`
- Extended `DbDocument` type in `src/types/index.ts` with `status`, `cachedTitle`, `cachedSnapshot`

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification

- **AC1:** PASS — `fetchDocTitleAction` uses `fetch()` with a 3-second `AbortController` timeout; integration tests confirm title is returned well within the 3-second window for public docs on a standard connection.
- **AC2:** PASS — `addDocumentAction` calls `getDocumentsCollection().insertOne()` with `{ url, title, userId, status, createdAt, updatedAt, cachedTitle }`; record verified present in test DB after submission.
- **AC3:** PASS — `isValidGoogleDocUrl()` rejects malformed URLs before any fetch attempt; non-public docs return a non-200 and the action returns `{ error: "Could not access document. Ensure it is publicly shared." }` without creating a record.
- **AC4:** PASS — `status: "first-visit"` hardcoded in the `insertOne` payload of `addDocumentAction`; confirmed via DB read after insert.

### Review Outcome
PASS

### Review Notes
All four ACs verified. URL validation is robust across multiple Google Docs URL formats. Title extraction correctly handles both the hyphen and en-dash variants of the " - Google Docs" suffix. Jaccard duplicate check is a non-blocking UX safeguard. The Server Action architecture keeps sensitive DB operations entirely server-side. Build passes with no TypeScript errors.
