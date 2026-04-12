# Story 4.4: Edit, Complete & Reschedule Notes and Terms

Status: done

## Story

As a **user**,
I want to edit, mark as done, or reschedule my notes and terminology entries independently,
So that I can refine my knowledge artifacts and control when they resurface for review.

## Acceptance Criteria

1. Editing note/term content and saving persists immediately.
2. Marking a note/term as "done" visually archives it and excludes it from active review.
3. Rescheduling a note/term (+N days) makes it reappear in the review queue on the scheduled date.
4. Inline editing is supported without opening a separate form/modal.

## Tasks / Subtasks

- [x] Task 1: Implement updateNoteAction and updateTermAction (AC: 1)
  - [x] 1.1: Zod schema: noteId/termId + content fields
  - [x] 1.2: $set { content, updatedAt } update
  - [x] 1.3: revalidatePath after update
- [x] Task 2: Implement completeNoteAction and completeTermAction (AC: 2)
  - [x] 2.1: $set { status: "done" } update
  - [x] 2.2: Done items styled with strikethrough + muted color
  - [x] 2.3: Exclude status: "done" items from default note list view
- [x] Task 3: Implement rescheduleNoteAction and rescheduleTermAction (AC: 3)
  - [x] 3.1: $set { nextReviewDate: addDays(new Date(), N) }
  - [x] 3.2: Rescheduled items surface on nextReviewDate
- [x] Task 4: Inline editing UI (AC: 4)
  - [x] 4.1: Click note content → textarea appears in place
  - [x] 4.2: onBlur or Enter → triggers updateNoteAction
  - [x] 4.3: Cancel on Escape

## Dev Notes

- **Actions in notes.ts:** `updateNoteAction`, `completeNoteAction`, `rescheduleNoteAction`, `updateTermAction`, `completeTermAction`, `rescheduleTermAction`.
- **Inline Edit:** Note items switch to textarea on click. `contentEditable` approach considered but textarea is more reliable cross-browser. onBlur triggers save.
- **Done State:** `status: "done"` items shown with `line-through opacity-50`. Toggle to re-activate is supported (`status: "active"`).
- **Reschedule:** Notes with `nextReviewDate > today` are surfaced in a "Upcoming Notes" section on the document detail page.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- No major issues. onBlur auto-save pattern works well for inline editing.

### Completion Notes List
- Full CRUD Server Actions for notes and terms (update, complete, reschedule)
- Inline editing via textarea swap on click
- Done items visually archived with strikethrough
- Reschedule updates nextReviewDate on note/term record

### File List
- `src/actions/notes.ts` — updateNoteAction, completeNoteAction, rescheduleNoteAction, updateTermAction, completeTermAction, rescheduleTermAction
- `src/components/features/glass-modal.tsx` — inline editing UI in notes/terms tabs
- `src/app/(dashboard)/terminology/page.tsx` — inline editing for terms

### Change Log
- Added full CRUD action set for notes and terms in notes.ts
- Inline editing textarea swap implemented in glass-modal
- Done/reschedule UI added to note and term list items

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `updateNoteAction` and `updateTermAction` perform `$set { content, updatedAt }` and revalidatePath immediately.
- **AC2:** PASS — `completeNoteAction` sets `status: "done"`. Done items render with `line-through opacity-50` and are excluded from active list by default.
- **AC3:** PASS — `rescheduleNoteAction` sets `nextReviewDate = addDays(new Date(), N)`. Items with future nextReviewDate appear in upcoming notes section.
- **AC4:** PASS — Click on note content triggers textarea swap. onBlur fires updateNoteAction. Esc cancels edit, reverts to original content.

### Review Outcome
PASS

### Review Notes
Full note and term lifecycle is implemented — create, read, update, complete, reschedule. The inline editing UX avoids unnecessary modal nesting. The done/active toggle allows users to re-engage with archived notes if needed, which was not in the original ACs but is a sensible extension.
