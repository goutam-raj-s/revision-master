# Story 2.4: Content Caching for Broken-Link Resilience

Status: done

## Story

As a **user**,
I want the system to cache the last-known title and content snapshot of my documents,
So that I can still access document information even if the original Google Doc link breaks.

## Acceptance Criteria

1. Cached title and content snapshot stored in the Documents collection alongside the live URL.
2. When a Google Doc URL becomes inaccessible (404, permission revoked), the system displays the cached title and last-known snapshot.
3. A visual indicator shows the document is in "degraded" state (NFR9).
4. The system periodically attempts to re-validate the URL.

## Tasks / Subtasks

- [x] Task 1: Add cachedTitle and cachedSnapshot fields to DbDocument type (AC: 1)
  - [x] 1.1: Update types/index.ts with cachedTitle and cachedSnapshot fields
  - [x] 1.2: Update serializer in collections.ts to include these fields
- [x] Task 2: Populate cache on successful title fetch (AC: 1)
  - [x] 2.1: In fetchDocTitleAction, update cachedTitle after successful fetch
  - [x] 2.2: Store content snapshot when iframe loads successfully
- [x] Task 3: Show degraded state when URL inaccessible (AC: 2, 3)
  - [x] 3.1: Document viewer checks iframe load status
  - [x] 3.2: Render cached title + snapshot with degraded banner when broken
  - [x] 3.3: Apply "broken" status visual indicator
- [x] Task 4: Re-validation attempt on document view (AC: 4)
  - [x] 4.1: On document page load, attempt to fetch title and update cache

## Dev Notes

- **Cache Fields:** `cachedTitle: string` and `cachedSnapshot: string` added to DbDocument. `cachedSnapshot` stores a plain-text excerpt of the last-known content.
- **Degraded State:** When iframe fails to load (onerror), document viewer renders cached snapshot in a `<pre>` or styled div with an amber banner: "This document may be unavailable. Showing last cached version."
- **Status:** `status: "broken"` set when URL detected as inaccessible during title fetch.
- **Re-validation:** `fetchDocTitleAction` called on every document page view — updates `cachedTitle` if fetch succeeds, sets `status: "broken"` if it fails.

### References
- [Source: _bmad-output/planning-artifacts/prd.md#NFR9]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- No major issues. cachedSnapshot limited to first 2000 chars of fetched HTML body text.

### Completion Notes List
- Added `cachedTitle` and `cachedSnapshot` to DbDocument type and serializer
- `fetchDocTitleAction` updates both fields on every successful fetch
- Document viewer shows degraded banner when iframe fails to load
- Re-validation runs passively on each page view

### File List
- `src/types/index.ts` — DbDocument type with cachedTitle/cachedSnapshot fields
- `src/lib/db/collections.ts` — serializeDoc includes cache fields
- `src/actions/documents.ts` — fetchDocTitleAction updates cache fields
- `src/app/(dashboard)/documents/[docId]/page.tsx` — degraded state display
- `src/app/study/[docId]/page.tsx` — iframe with fallback to cached snapshot

### Change Log
- Added cache fields to schema and type definitions
- Updated fetchDocTitleAction to persist cachedTitle on success
- Added degraded state UI with amber warning banner

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `cachedTitle` and `cachedSnapshot` fields exist on DbDocument and are persisted by fetchDocTitleAction on every successful fetch.
- **AC2:** PASS — Document viewer renders cached title and snapshot content when iframe fails to load, using the stored cache fields.
- **AC3:** PASS — Amber banner "This document may be unavailable. Showing last cached version." shown in degraded state. Status field set to "broken".
- **AC4:** PASS — fetchDocTitleAction is invoked on document page load, passively re-validating the URL and updating the cache if successful.

### Review Outcome
PASS

### Review Notes
Caching is implemented pragmatically — title is always cached, snapshot is a text excerpt. Full content snapshots would require a more complex extraction pipeline, which is appropriate for Phase 2. The degraded state UX is non-alarming and informative, consistent with NFR9 graceful degradation requirement.
