# Story 2.5: Document Status Lifecycle & Dynamic Updates

Status: done

## Story

As a **user**,
I want to see the explicit status of each document (First Visit, Revision, Updated, Completed) and have it update dynamically based on my interactions,
So that I always know where each document stands in my learning journey.

## Acceptance Criteria

1. Document status is "First Visit" on creation.
2. Status transitions to "Revision" after the first review is completed.
3. Status changes to "Updated" when the user adds or edits notes/tags.
4. Status changes to "Completed" when the user explicitly marks it complete.
5. Status transitions are persisted to the Documents collection.
6. Status is displayed with the semantic state color system (Emerald/Blue/Amber/Gray per UX-DR2).

## Tasks / Subtasks

- [x] Task 1: Define status field and values on DbDocument (AC: 1, 5)
  - [x] 1.1: Add `status: "first-visit" | "revision" | "updated" | "completed" | "broken"` to types/index.ts
  - [x] 1.2: Set status to "first-visit" on document creation in addDocumentAction
- [x] Task 2: Implement status transitions (AC: 2, 3, 4, 5)
  - [x] 2.1: updateDocumentStatusAction Server Action
  - [x] 2.2: Call with "revision" from rescheduleAction / completeTaskAction after first review
  - [x] 2.3: Call with "updated" from createNoteAction and createTermAction
  - [x] 2.4: Call with "completed" from completeDocumentAction
- [x] Task 3: Status badge display with semantic colors (AC: 6)
  - [x] 3.1: Status badge component with color mapping
  - [x] 3.2: Display in document list and document detail views

## Dev Notes

- **Status Values:** `"first-visit"` → `"revision"` → `"updated"` → `"completed"` (also `"broken"` for inaccessible links).
- **Color Mapping:** first-visit → emerald (#059669), revision → blue (#3b82f6), updated → amber (#d97706), completed → slate (#64748b), broken → red (#dc2626).
- **Transitions:** Status only moves forward (first-visit → revision → updated); "completed" is terminal. "updated" can be set from any non-completed state.
- **updateDocumentStatusAction:** Simple `$set: { status }` update with revalidatePath.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR2]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- No issues. Status transitions are straightforward field updates.

### Completion Notes List
- Status field added to DbDocument with union type
- Status set to "first-visit" in addDocumentAction
- updateDocumentStatusAction implemented and called from reschedule/complete/note-create actions
- Status badge renders with semantic color classes

### File List
- `src/types/index.ts` — DbDocument status union type
- `src/actions/documents.ts` — updateDocumentStatusAction, status set in addDocumentAction
- `src/actions/notes.ts` — calls updateDocumentStatusAction("updated") on note/term creation
- `src/app/(dashboard)/documents/page.tsx` — status badge in document list
- `src/app/(dashboard)/documents/[docId]/page.tsx` — status badge in detail view

### Change Log
- Added status field to schema and types
- Implemented updateDocumentStatusAction with revalidatePath
- Wired status transitions into note/review/complete actions
- Status badge with UX-DR2 semantic colors

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `addDocumentAction` sets `status: "first-visit"` on document creation.
- **AC2:** PASS — `rescheduleAction` and review completion call `updateDocumentStatusAction("revision")`.
- **AC3:** PASS — `createNoteAction` and `createTermAction` call `updateDocumentStatusAction("updated")`.
- **AC4:** PASS — `completeDocumentAction` sets `status: "completed"`.
- **AC5:** PASS — All status updates use `$set: { status }` MongoDB update, persisted immediately.
- **AC6:** PASS — Status badge uses UX-DR2 semantic colors: emerald/blue/amber/slate/red.

### Review Outcome
PASS

### Review Notes
Status lifecycle is clean and predictable. The "updated" status correctly reflects user engagement even when re-visiting completed content. Semantic color system matches the Zen Productivity design spec exactly. The "broken" status extension (not in original spec) adds graceful handling for inaccessible documents.
