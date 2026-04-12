# Story 5.3: Merge Overlapping Documents into Topic Trees

Status: done

## Story

As a **user**,
I want to explicitly merge logically overlapping URLs into unified topic trees,
So that related knowledge is consolidated rather than fragmented.

## Acceptance Criteria

1. Clicking "Merge" attaches the new document as a child node to the existing matched document.
2. Merged group is visually displayed as a topic tree in the document list.
3. Tags from both documents are combined (union).
4. The merge is reversible — user can "unlink" a merged document.
5. Merged documents share the parent's review schedule unless independently overridden.

## Tasks / Subtasks

- [x] Task 1: Implement mergeDocumentAction (AC: 1, 3, 5)
  - [x] 1.1: Accept newDocData + parentDocId
  - [x] 1.2: Insert new document with parentDocId field set
  - [x] 1.3: Merge tags: $addToSet tags from new doc onto parent doc
  - [x] 1.4: Child Repetitions record inherits parent's nextReviewDate
- [x] Task 2: Topic tree display in document list (AC: 2)
  - [x] 2.1: Query groups documents by parentDocId
  - [x] 2.2: Parent shown with expand indicator, children indented with connector
  - [x] 2.3: Tree structure rendered in /documents page
- [x] Task 3: Unlink action (AC: 4)
  - [x] 3.1: unlinkDocumentAction removes parentDocId from child doc
  - [x] 3.2: Child becomes independent document again
- [x] Task 4: Wire Merge button in similarity banner (AC: 1)
  - [x] 4.1: Merge button in similarity banner calls mergeDocumentAction
  - [x] 4.2: On merge success, navigate to /documents

## Dev Notes

- **parentDocId Field:** `parentDocId?: ObjectId` on DbDocument. Null = top-level document.
- **Tree Query:** Fetch all docs, group client-side by parentDocId. Parents first, children nested.
- **Tag Union:** `{ $addToSet: { tags: { $each: newTags } } }` on parent document.
- **Inherited Schedule:** Child's Repetitions.nextReviewDate = parent's nextReviewDate on merge. Subsequent reschedules are independent per doc.
- **Unlink:** `{ $unset: { parentDocId: "" } }` on child document.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- No issues. Tree grouping done client-side (simple groupBy on parentDocId) to avoid complex DB aggregation.

### Completion Notes List
- mergeDocumentAction inserts child doc with parentDocId and merges tags on parent
- unlinkDocumentAction removes parentDocId from child
- Document list shows tree structure with indented children
- Merge button in similarity banner wired to mergeDocumentAction

### File List
- `src/actions/documents.ts` — mergeDocumentAction, unlinkDocumentAction
- `src/app/(dashboard)/documents/page.tsx` — tree grouping and display
- `src/types/index.ts` — parentDocId on DbDocument

### Change Log
- Added parentDocId to DbDocument type and schema
- mergeDocumentAction and unlinkDocumentAction implemented
- Document list refactored to render topic trees
- Merge button wired in similarity warning banner

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `mergeDocumentAction` inserts new document with `parentDocId` set to the matched document's ID.
- **AC2:** PASS — `/documents` page groups documents by parentDocId and renders children indented under their parent with a connector line.
- **AC3:** PASS — Parent document's tags updated with `$addToSet` to union in new document's tags.
- **AC4:** PASS — `unlinkDocumentAction` removes `parentDocId` from the child document, making it a top-level independent document.
- **AC5:** PASS — Child Repetitions record is initialized with parent's `nextReviewDate`. Subsequent reschedules operate independently.

### Review Outcome
PASS

### Review Notes
Topic tree implementation is pragmatic — parent/child via a single parentDocId field rather than a recursive tree structure. This is appropriate for Phase 1 where merge depth is likely shallow (1-2 levels). Deep merge trees would require a recursive query strategy, which is a Phase 2 concern.
