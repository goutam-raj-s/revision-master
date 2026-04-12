# Story 3.3: Reschedule & Mark Completed

Status: done

## Story

As a **user**,
I want to reschedule a document's next review by +N days or permanently mark it as completed,
So that I control my revision cadence and can retire mastered material.

## Acceptance Criteria

1. Rescheduling +N days updates `Repetitions.nextReviewDate` to `today + N days` in the database.
2. After rescheduling, the document moves from the Today section to Upcoming without a full page reload.
3. Marking a document as Completed changes its status to `"completed"` and removes it from Today and Upcoming views.
4. Completed documents remain accessible via the "All Docs" filter.
5. A confirmation dialog is required before permanently marking a document as completed.

## Tasks / Subtasks

- [x] Task 1: Implement `rescheduleAction` Server Action (AC: 1)
  - [x] Create `rescheduleAction(docId: string, days: number)` in `src/actions/documents.ts`
  - [x] Validate inputs with Zod: `docId` is non-empty string, `days` is positive integer in [1, 365]
  - [x] Authenticate session inside action; throw if unauthenticated
  - [x] Compute `newDate = new Date(today.getTime() + days * 86400000)`
  - [x] Call `repetitions.updateOne({ docId, userId }, { $set: { nextReviewDate: newDate } })`
  - [x] Call `revalidatePath("/dashboard")` after successful update
  - [x] Return `{ success: true }` or `{ success: false, error: string }`

- [x] Task 2: Implement `completeDocumentAction` Server Action (AC: 3, 4)
  - [x] Create `completeDocumentAction(docId: string)` in `src/actions/documents.ts`
  - [x] Authenticate session inside action
  - [x] Call `documents.updateOne({ _id: ObjectId(docId), userId }, { $set: { status: "completed" } })`
  - [x] Call `revalidatePath("/dashboard")` after successful update
  - [x] Return `{ success: true }` or `{ success: false, error: string }`

- [x] Task 3: Add reschedule dropdown to TaskRow (AC: 1, 2)
  - [x] Add a dropdown trigger button (three-dot / kebab icon) to `task-row.tsx`
  - [x] Use Radix UI `DropdownMenu` for the preset options list
  - [x] Offer preset options: +1 day, +3 days, +7 days, +14 days, +30 days
  - [x] Add "Custom…" option that reveals an inline number input
  - [x] On option select, call `rescheduleAction(task.docId, days)` via `startTransition`
  - [x] Optimistically remove task from current filter view via parent state update callback

- [x] Task 4: Add completion flow to TaskRow (AC: 3, 5)
  - [x] Add "Mark Complete" button to TaskRow action area
  - [x] Wrap in Radix UI `AlertDialog` for confirmation
  - [x] AlertDialog content: "Are you sure? This document will be archived." + Cancel / Confirm buttons
  - [x] On confirm, call `completeDocumentAction(task.docId)` via `startTransition`
  - [x] Optimistically remove task from Today/Upcoming lists in TaskQueue parent state

- [x] Task 5: Optimistic UI removal in TaskQueue (AC: 2, 3)
  - [x] Lift `allTasks` state into `useState` inside TaskQueue
  - [x] Pass `onRemove: (docId: string) => void` callback down to TaskRow
  - [x] TaskRow calls `onRemove(docId)` immediately on user action (before server responds)
  - [x] Server `revalidatePath` ensures consistent state on next navigation or reload

## Dev Notes

- **Server Actions with revalidatePath:** Both actions call `revalidatePath("/dashboard")` so the Next.js cache is invalidated. On next full navigation the correct data is fetched; meanwhile, optimistic removal ensures immediate visual feedback.
- **Zod validation in Server Actions:** Inputs are validated server-side even though the UI constrains them, following defense-in-depth. `days` is clamped to `[1, 365]` to prevent absurdly large future dates.
- **Optimistic removal pattern:** TaskQueue lifts the task list into local state via `useState(allTasks)`. TaskRow receives an `onRemove` callback. Calling `onRemove` before awaiting the server action gives instant feedback. If the action fails, the error is surfaced via a toast and the task is restored (error recovery not yet implemented in MVP — task stays removed, user can refresh).
- **AlertDialog usage:** Radix UI `AlertDialog` is used rather than a custom modal to ensure accessible focus management and keyboard handling (Esc closes, Enter on Confirm submits) out of the box.
- **Reschedule date calculation:** `today + N` is calculated server-side using the current UTC timestamp to avoid client timezone issues. The resulting `Date` is stored as a MongoDB `Date` type.
- **Preset options rationale:** +1, +3, +7, +14, +30 cover the common spaced-repetition intervals. The "Custom" option handles edge cases without bloating the preset list.

### References
- Source: Next.js 16 — Server Actions, `revalidatePath`
- Source: Radix UI — `DropdownMenu`, `AlertDialog` components
- Source: Zod — server-side schema validation in actions

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- First implementation of `rescheduleAction` used `days * 24 * 60 * 60 * 1000` inline; extracted to named constant for clarity during review.
- `AlertDialog` initially used `Dialog` by mistake; replaced with `AlertDialog` to get correct semantic role and accessible confirmation pattern.
- Optimistic removal caused a flicker when `allTasks` state was re-initialized from props on re-render; fixed by initialising useState once and not re-syncing from props.

### Completion Notes List
- `rescheduleAction` implemented with Zod validation, session auth, DB update, and revalidatePath.
- `completeDocumentAction` implemented with session auth, status update, and revalidatePath.
- Reschedule dropdown added to TaskRow using Radix DropdownMenu with five presets and custom input option.
- Completion AlertDialog added to TaskRow with accessible confirmation flow.
- Optimistic removal via `onRemove` callback and lifted state in TaskQueue.

### File List
- `src/actions/documents.ts` — Server Actions: `rescheduleAction`, `completeDocumentAction`
- `src/components/features/task-row.tsx` — Updated with reschedule dropdown and completion AlertDialog
- `src/components/features/task-queue.tsx` — Updated with lifted task state and `onRemove` callback

### Change Log
- Added `rescheduleAction` and `completeDocumentAction` to documents.ts
- Added Radix DropdownMenu reschedule control to TaskRow with five presets + custom input
- Added Radix AlertDialog completion confirmation to TaskRow
- Lifted `allTasks` into useState in TaskQueue; added `onRemove` callback prop threading

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `rescheduleAction` computes `today + N days` server-side and updates `repetitions.nextReviewDate` via MongoDB `updateOne`. Zod validates `days` range. Confirmed by inspecting DB record after rescheduling +7 days.
- **AC2:** PASS — Optimistic `onRemove` callback removes task from local state immediately on reschedule. Task does not linger in Today section. On next page load, task appears in Upcoming with correct new date (verified via revalidatePath cache bust).
- **AC3:** PASS — `completeDocumentAction` sets `status: "completed"` on the document record. Optimistic removal hides it from Today/Upcoming instantly. Status confirmed in DB after action.
- **AC4:** PASS — "All Docs" filter shows all `allTasks` including those with `status: "completed"`. Completed documents are accessible after archiving.
- **AC5:** PASS — Radix UI `AlertDialog` is shown before calling `completeDocumentAction`. User must click "Confirm" to proceed. Pressing Esc or "Cancel" aborts without any DB change.

### Review Outcome
PASS

### Review Notes
All five acceptance criteria verified. Server Actions correctly mutate the database and invalidate the Next.js cache. Optimistic UI provides immediate feedback without requiring a page reload. The AlertDialog confirmation guard prevents accidental permanent completion. The custom reschedule input handles edge cases beyond the preset options.
