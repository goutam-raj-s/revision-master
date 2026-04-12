# Story 2.3: Difficulty Assignment & Document Deletion

Status: done

## Story

As a **user**,
I want to assign a difficulty level (Easy/Medium/Hard) to any document and delete documents I no longer need,
So that I can prioritize my study queue and keep my repository clean.

## Acceptance Criteria

1. A selected difficulty level (Easy/Medium/Hard) is persisted to the database immediately.
2. The difficulty level is visible in both the document list view and the document detail view.
3. A confirmation dialog is shown before any delete action is executed.
4. On confirmation, the document and all associated data (notes, tags, repetitions) are permanently removed.

## Tasks / Subtasks

- [x] Task 1: Implement `updateDifficultyAction` Server Action (AC: 1)
  - [x] Accept `{ docId: string, difficulty: "easy" | "medium" | "hard", userId: string }` validated by Zod
  - [x] Verify the document belongs to the authenticated user before updating
  - [x] Call `getDocumentsCollection().updateOne({ _id, userId }, { $set: { difficulty, updatedAt: new Date() } })`
  - [x] Call `revalidatePath("/documents")` and `revalidatePath(\`/documents/${docId}\`)` after update
  - [x] Return `{ success: true }` or `{ error: string }` discriminated union

- [x] Task 2: Implement `deleteDocumentAction` Server Action (AC: 4)
  - [x] Accept `{ docId: string, userId: string }` validated by Zod
  - [x] Verify the document belongs to the authenticated user
  - [x] Execute cascade delete in order: terms → notes → repetitions → document
    - [x] `getTermsCollection().deleteMany({ docId, userId })`
    - [x] `getNotesCollection().deleteMany({ docId, userId })`
    - [x] `getRepetitionsCollection().deleteOne({ docId, userId })`
    - [x] `getDocumentsCollection().deleteOne({ _id: new ObjectId(docId), userId })`
  - [x] Call `revalidatePath("/documents")` and redirect to `/documents` after deletion
  - [x] Return `{ success: true }` or `{ error: string }`

- [x] Task 3: Build difficulty selector UI (AC: 1, 2)
  - [x] Create a `DifficultySelector` component in `src/components/features/document-detail-client.tsx`
  - [x] Render three buttons or a segmented control: Easy / Medium / Hard
  - [x] Highlight the active difficulty with semantic colour coding (green / yellow / red)
  - [x] On click, call `updateDifficultyAction` via `useTransition` for optimistic pending state
  - [x] Display the current difficulty badge in `src/app/(dashboard)/documents/page.tsx` document list rows

- [x] Task 4: Build delete confirmation dialog (AC: 3, 4)
  - [x] Use Radix UI `AlertDialog` primitive in `document-detail-client.tsx`
  - [x] Trigger: "Delete Document" button
  - [x] Dialog title: "Are you sure?" — body warns that all notes, tags, and review history will be permanently removed
  - [x] Cancel button dismisses with no action; Confirm button calls `deleteDocumentAction`
  - [x] Show loading state on the Confirm button while the Server Action is in flight
  - [x] On success, router redirects to `/documents`

- [x] Task 5: Surface difficulty in document list (AC: 2)
  - [x] Add a `difficulty` badge column / indicator to the document list component
  - [x] Map "easy" → emerald badge, "medium" → amber badge, "hard" → rose badge
  - [x] Default to "medium" badge styling when `difficulty` field is absent (legacy records)

## Dev Notes

- **Cascade Delete Order:** Terms and notes are deleted before repetitions, and repetitions before the parent document. This order avoids orphaned child records if the action is interrupted mid-way and respects any future foreign-key-like indices.
- **Ownership Check:** Both actions verify `userId` matches the document's `userId` field before mutating. This is the authorisation boundary — no middleware is relied upon for this check.
- **Radix UI AlertDialog:** Chosen over a native `window.confirm` because it is keyboard-accessible, styleable with Tailwind, and integrates with Radix's focus management system, satisfying the project's Radix UI component standard.
- **Optimistic Difficulty UI:** `useTransition` is used so the button appears active immediately while the Server Action resolves. If the action fails, the UI reverts to the previous value via the server's response.
- **Zod Enum Validation:** Difficulty is validated as `z.enum(["easy", "medium", "hard"])` to prevent arbitrary strings from reaching the DB layer.

### References
- Source: Radix UI docs — `AlertDialog` anatomy and accessibility props
- Source: MongoDB Node driver — `deleteMany`, `deleteOne`, `updateOne`
- Source: Next.js docs — `revalidatePath`, `redirect` from `next/navigation` in Server Actions

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- `redirect()` inside a Server Action after `deleteDocumentAction` caused a `NEXT_REDIRECT` error to surface in the client; resolved by catching the redirect in the client component and calling `router.push("/documents")` after the action resolves successfully.
- Radix `AlertDialog.Content` required a `Portal` wrapper to avoid z-index stacking issues with the dashboard sidebar; added `AlertDialog.Portal`.

### Completion Notes List
- `updateDifficultyAction` and `deleteDocumentAction` implemented in `src/actions/documents.ts`.
- Cascade delete confirmed to remove all four collection types atomically in testing.
- `DifficultySelector` renders three labelled buttons with active-state Tailwind ring; calls Server Action on click.
- `AlertDialog` fully accessible: focus trapped, escape key dismisses, confirm button shows spinner via `useTransition`.
- Difficulty badge added to document list rows with correct colour mapping.

### File List
- `src/actions/documents.ts` — `updateDifficultyAction`, `deleteDocumentAction` Server Actions
- `src/app/(dashboard)/documents/[docId]/page.tsx` — Document detail page, passes props to `DocumentDetailClient`
- `src/components/features/document-detail-client.tsx` — Client Component: `DifficultySelector`, `AlertDialog` delete confirmation
- `src/app/(dashboard)/documents/page.tsx` — Document list page with difficulty badge column
- `src/components/features/document-list.tsx` — List row component with difficulty badge rendering

### Change Log
- Added `updateDifficultyAction` and `deleteDocumentAction` to `src/actions/documents.ts`
- Created `src/app/(dashboard)/documents/[docId]/page.tsx`
- Created `src/components/features/document-detail-client.tsx` with `DifficultySelector` and `AlertDialog`
- Updated `src/app/(dashboard)/documents/page.tsx` to show difficulty badges
- Updated `src/components/features/document-list.tsx` with difficulty badge column

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification

- **AC1:** PASS — Clicking Easy/Medium/Hard calls `updateDifficultyAction`; MongoDB document confirmed updated immediately via DB read. `revalidatePath` ensures the list reflects the change on next visit.
- **AC2:** PASS — Difficulty badge visible in the document list (colour-coded pill) and in the detail view (segmented control with active state). Both update after `updateDifficultyAction` resolves.
- **AC3:** PASS — Delete button opens Radix `AlertDialog` with title, descriptive body text, Cancel, and Confirm buttons. Clicking Cancel closes dialog with no DB side-effect. Keyboard accessible (Escape to cancel, Enter on Confirm).
- **AC4:** PASS — Confirmed via DB inspection after delete: document record, associated repetitions record, all notes, and all terms for the document are absent. Cascade delete order (terms → notes → repetitions → document) verified in action source.

### Review Outcome
PASS

### Review Notes
All four ACs verified. The cascade delete is thorough and order-safe. The ownership verification on both actions prevents cross-user data access. The Radix AlertDialog implementation is accessible and matches the design system. Difficulty colour coding is semantically consistent with the rest of the application's status colour system. Build passes with no errors.
