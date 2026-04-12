# Story 2.6: Initial Review Schedule Configuration

Status: done

## Story

As a **user**,
I want to configure an initial review delay (default: 2 days) when submitting a new document,
So that the system schedules my first review at the optimal interval.

## Acceptance Criteria

1. A Repetitions record is created with `nextReviewDate = today + N days` on document creation.
2. The default value of 2 days is pre-populated in the input.
3. The user can override with any positive integer.
4. The scheduled document appears in the task queue on the configured date.

## Tasks / Subtasks

- [x] Task 1: Add initialDelayDays field to document submission form (AC: 2, 3)
  - [x] 1.1: Number input with default value 2 in add-document-form.tsx
  - [x] 1.2: Zod validation: coerce.number().int().min(1).default(2)
- [x] Task 2: Create Repetitions record on document creation (AC: 1, 4)
  - [x] 2.1: addDocumentAction reads initialDelayDays from formData
  - [x] 2.2: Compute nextReviewDate = addDays(new Date(), initialDelayDays)
  - [x] 2.3: Insert Repetitions document with nextReviewDate, reviewCount: 0
- [x] Task 3: Verify task queue population (AC: 4)
  - [x] 3.1: Dashboard query filters repetitions where nextReviewDate <= today
  - [x] 3.2: Confirm new doc appears in task queue on scheduled date

## Dev Notes

- **SRS Engine:** `getNextReviewDate(difficulty, reviewCount)` in `src/lib/srs/engine.ts` used for subsequent intervals. `addDays(new Date(), N)` in utils.ts for initial scheduling.
- **Repetitions Schema:** `{ docId, userId, nextReviewDate, reviewCount: 0, difficulty: "medium", lastReviewedAt: null }`. Difficulty defaults to "medium" until user sets it on the document.
- **Form Input:** Spinner-style number input with min=1, default=2. Label: "First review in (days)".
- **Zod:** `z.coerce.number().int().min(1).default(2)` — coerce handles string→number from FormData.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#SRS Engine]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Used z.coerce.number() because FormData always returns strings — plain z.number() would fail.

### Completion Notes List
- initialDelayDays number input added to add-document-form with default 2
- addDocumentAction creates Repetitions record with computed nextReviewDate
- SRS engine handles subsequent intervals after first review
- Task queue correctly surfaces docs on their scheduled date

### File List
- `src/actions/documents.ts` — addDocumentAction creates Repetitions record
- `src/components/features/add-document-form.tsx` — initialDelayDays input field
- `src/lib/srs/engine.ts` — getNextReviewDate, getNextInterval, getCustomNextReviewDate
- `src/lib/utils.ts` — addDays() helper
- `src/types/index.ts` — DbRepetition type

### Change Log
- Added initialDelayDays field to document submission form
- addDocumentAction creates paired Repetitions record on document insert
- SRS engine implements exponential interval tables per difficulty

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `addDocumentAction` inserts a Repetitions document with `nextReviewDate = addDays(new Date(), initialDelayDays)`.
- **AC2:** PASS — Number input has `defaultValue={2}` in the form component.
- **AC3:** PASS — Zod schema validates any positive integer; form input has `min={1}`.
- **AC4:** PASS — Dashboard query `nextReviewDate <= today` will surface the document on the configured date.

### Review Outcome
PASS

### Review Notes
Initial scheduling is cleanly separated from the SRS engine — first interval is user-controlled, subsequent intervals use the exponential table keyed by difficulty and reviewCount. The Zod coerce pattern correctly handles FormData string-to-number conversion. Default of 2 days matches the PRD requirement.
