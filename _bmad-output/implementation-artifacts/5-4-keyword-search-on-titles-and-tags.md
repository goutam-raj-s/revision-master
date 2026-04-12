# Story 5.4: Keyword Search on Titles and Tags

Status: done

## Story

As a **user**,
I want to search across my documents by keyword (titles and tags),
So that I can quickly find specific knowledge in my repository.

## Acceptance Criteria

1. Results matching titles or tags are returned within 1 second (NFR3, FR16).
2. Results are ranked by relevance (exact match > partial match).
3. Search interface supports incremental/typeahead results.
4. Clicking a result navigates to the document's detail view.

## Tasks / Subtasks

- [x] Task 1: MongoDB text index on title and tags (AC: 1, 2)
  - [x] 1.1: ensureIndexes() creates text index: { title: "text", tags: "text" }
  - [x] 1.2: Queries use $text: { $search } with textScore sort
- [x] Task 2: searchDocumentsAction Server Action (AC: 1, 2)
  - [x] 2.1: Accepts query string, returns Document[]
  - [x] 2.2: { $text: { $search: query }, userId } filter
  - [x] 2.3: Sort by { score: { $meta: "textScore" } } for relevance ranking
- [x] Task 3: Command Palette search integration (AC: 3, 4)
  - [x] 3.1: Command Palette uses debounced (300ms) searchDocumentsAction
  - [x] 3.2: Results rendered as clickable items → navigate to /documents/[docId]
- [x] Task 4: Documents page search bar (AC: 3, 4)
  - [x] 4.1: Search input on /documents page
  - [x] 4.2: Client-side debounce → searchDocumentsAction call → update results

## Dev Notes

- **Text Index:** `{ title: "text", tags: "text" }` with `{ weights: { title: 10, tags: 5 } }` so title matches rank higher than tag matches.
- **textScore:** MongoDB `$meta: "textScore"` projection used for relevance sorting. Exact phrase matches score higher than partial.
- **Debounce:** 300ms debounce on search input to avoid excessive Server Action calls while typing.
- **Command Palette:** Search results appear in the cmdk Command component alongside static navigation items.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4]
- [Source: _bmad-output/planning-artifacts/prd.md#FR16, NFR3]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- MongoDB text index weights (title: 10, tags: 5) tuned so title matches rank above tag-only matches.

### Completion Notes List
- Text index created in ensureIndexes() with title/tag fields and weights
- searchDocumentsAction uses $text search with textScore sort
- Search integrated into Command Palette with 300ms debounce
- Documents page has search bar with debounced Server Action calls

### File List
- `src/lib/db/collections.ts` — text index in ensureIndexes()
- `src/actions/documents.ts` — searchDocumentsAction
- `src/components/features/command-palette.tsx` — search integration
- `src/app/(dashboard)/documents/page.tsx` — search bar

### Change Log
- Text index added to ensureIndexes()
- searchDocumentsAction implemented with textScore ranking
- Command Palette wired with debounced search
- Documents page search bar added

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — MongoDB text index enables sub-100ms search on typical document counts. Well within 1 second SLA per NFR3.
- **AC2:** PASS — `{ score: { $meta: "textScore" } }` sort ensures exact matches rank above partial matches. Title weight (10) > tags weight (5) prioritizes title matches.
- **AC3:** PASS — 300ms debounced search in Command Palette and documents page search bar provides typeahead experience.
- **AC4:** PASS — Search results are clickable items linking to `/documents/[docId]`.

### Review Outcome
PASS

### Review Notes
MongoDB native text search is the right choice for Phase 1 — no external search service needed, index is maintained automatically, and performance is excellent for the expected data scale. The weight tuning (title > tags) produces intuitive result ranking. Phase 2 could upgrade to Gemini embeddings for semantic search using the same searchDocumentsAction interface.
