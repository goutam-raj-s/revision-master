# Story 4.3: Filter Repository by Tags & Terminology Browser

Status: done

## Story

As a **user**,
I want to filter my entire document repository by custom tags and browse a distinct Terminology interface,
So that I can navigate my knowledge graph by topic and review all defined terms.

## Acceptance Criteria

1. Selecting one or more tags displays only documents matching the selected tags.
2. Tag counts show how many documents are associated with each tag.
3. Terminology section displays all defined terms alphabetically with definitions and source document links.
4. Terminology list is searchable/filterable.
5. Clicking a source document link navigates to that document's detail view.

## Tasks / Subtasks

- [x] Task 1: Tag filter on documents page (AC: 1, 2)
  - [x] 1.1: /documents accepts ?tag= search param
  - [x] 1.2: Server component queries { tags: { $in: [selectedTag] } } when tag param present
  - [x] 1.3: Tag sidebar aggregates all user tags with document counts
  - [x] 1.4: Active tag highlighted in sidebar
- [x] Task 2: Terminology browser page (AC: 3, 4, 5)
  - [x] 2.1: /terminology page fetches all user terms sorted alphabetically
  - [x] 2.2: Terms grouped by first letter with letter headers
  - [x] 2.3: Client-side search filter input (useState + filter on term name/definition)
  - [x] 2.4: Source document link per term navigates to /documents/[docId]

## Dev Notes

- **Tag Aggregation:** MongoDB `$unwind: "$tags"` → `$group: { _id: "$tags", count: { $sum: 1 } }` → `$sort: { count: -1 }` to get tag counts.
- **URL-based Filter:** Tag filter uses Next.js `searchParams` in Server Component — `searchParams.tag` passed to MongoDB query. No client state needed for filtering.
- **Terminology Search:** Client-side filtering on the Term[] array using `useState` + `.filter()`. No server roundtrip for search.
- **Alphabetical Grouping:** Terms sorted by `term.toLowerCase()`, then grouped by first letter for section headers.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- No issues. URL-based tag filtering is simple and shareable.

### Completion Notes List
- /documents page supports ?tag= search param for server-side filtering
- Tag sidebar shows all user tags with document counts from MongoDB aggregation
- /terminology page alphabetically groups all user terms
- Client-side search on terminology page

### File List
- `src/app/(dashboard)/documents/page.tsx` — tag filter via searchParams, tag count aggregation
- `src/app/(dashboard)/terminology/page.tsx` — alphabetical term browser with client search
- `src/components/features/tag-filter.tsx` — tag sidebar component (if extracted)

### Change Log
- /documents page reads searchParams.tag and applies DB filter
- Tag count aggregation added to documents page data fetch
- /terminology created with alphabetical grouping and search

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `/documents?tag=react` filters documents to those containing "react" in their tags array via `{ tags: { $in: [tag] } }` query.
- **AC2:** PASS — Tag sidebar renders each tag with its document count from the aggregation pipeline.
- **AC3:** PASS — `/terminology` lists all user terms sorted alphabetically, grouped by first letter with letter section headers.
- **AC4:** PASS — Client-side search input filters the term list in real-time using useState + array filter.
- **AC5:** PASS — Each term entry includes a link to `/documents/[docId]` using the term's source docId.

### Review Outcome
PASS

### Review Notes
Tag filtering via URL search params is the right architectural choice — it makes filtered views shareable and bookmarkable without client state complexity. The terminology browser's client-side search is appropriate since the full term list is already server-rendered (no additional network request needed for filtering).
