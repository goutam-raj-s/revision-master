# Story 4.1: Create Notes & Tags per Document

Status: done

## Story

As a **user**,
I want to create independent notes and custom tags for any document,
So that I can capture insights and organize my knowledge by topic.

## Acceptance Criteria

1. Note written and saved is persisted to the database, linked to the document and user.
2. Multiple notes can be created per document.
3. Custom tag added is associated with the document and available for filtering.
4. Existing tags are auto-suggested during input to maintain consistency.
5. Tags are displayed as interactive badges on the document.

## Tasks / Subtasks

- [x] Task 1: Implement createNoteAction Server Action (AC: 1, 2)
  - [x] 1.1: Zod schema: content (string min 1), docId (string)
  - [x] 1.2: Insert into notes collection with docId, userId, content, createdAt, status: "active"
  - [x] 1.3: Fix useActionState type: _prev: ActionResult<Note> matches return type
  - [x] 1.4: revalidatePath after insert
- [x] Task 2: Tag input with suggestions (AC: 3, 4)
  - [x] 2.1: Tag input field in add-document-form and glass-modal
  - [x] 2.2: Enter/comma keystroke adds tag to local array
  - [x] 2.3: Tags stored on documents.tags string[] field via addTagAction
  - [x] 2.4: Existing user tags fetched server-side for datalist suggestions
- [x] Task 3: Tag badge display (AC: 5)
  - [x] 3.1: Tag badges as interactive pill elements in task row, doc list, and glass modal
  - [x] 3.2: Clicking tag filters document list by that tag

## Dev Notes

- **Notes Collection:** `{ _id, docId, userId, content, createdAt, updatedAt, status: "active" | "done", nextReviewDate }`.
- **useActionState Fix:** `createNoteAction(_prev: ActionResult<Note>, formData: FormData): Promise<ActionResult<Note>>` — _prev type must match return type generic exactly for React 19 compatibility.
- **Tag Storage:** Tags stored directly on the Document record as `tags: string[]`. `addTagAction` uses `$addToSet` to avoid duplicates.
- **Suggestions:** All unique tags across user's documents fetched in dashboard layout, passed to components as props for `<datalist>` suggestions.
- **Badge Colors:** Tags render as small pills with emerald border + light emerald background.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- useActionState type mismatch: initial implementation used `_prev: ActionResult` (= ActionResult<void>) but return type was `ActionResult<Note>`. Fixed by updating action signature and initialState in components.

### Completion Notes List
- createNoteAction implemented with correct useActionState-compatible types
- Notes stored in dedicated `notes` collection
- Tag input with Enter/comma to add, datalist suggestions from existing tags
- Tag badges render in task row, doc list, glass modal

### File List
- `src/actions/notes.ts` — createNoteAction, addTagAction
- `src/components/features/glass-modal.tsx` — note form + note list in sidebar
- `src/components/features/add-document-form.tsx` — tag input with suggestions
- `src/app/(dashboard)/documents/page.tsx` — tag badges in document list
- `src/types/index.ts` — DbNote, Note types

### Change Log
- Implemented createNoteAction with proper ActionResult<Note> typing
- Tag input added to add-document-form with Enter/comma handling
- Note creation form in glass-modal right sidebar
- Tag badges added across document views

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `createNoteAction` inserts note into `notes` collection with docId and userId. Persisted via MongoDB insert.
- **AC2:** PASS — Notes collection supports multiple notes per document. No unique constraint on (docId, content).
- **AC3:** PASS — Tags stored on `documents.tags` via `$addToSet`. Available for filtering via tag query param.
- **AC4:** PASS — All user tags fetched server-side and provided as datalist suggestions in tag input fields.
- **AC5:** PASS — Tag badges rendered as interactive pill elements with emerald styling. Click navigates to filtered document list.

### Review Outcome
PASS

### Review Notes
Notes and tags are cleanly separated concerns — notes in their own collection for full CRUD lifecycle, tags as a string array on the document for fast query filtering. The useActionState type fix was a non-trivial issue; the solution (exact type matching between _prev and return generic) is correctly documented for future reference.
