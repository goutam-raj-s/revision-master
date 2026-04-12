# Story 5.2: Similarity Warning Banner

Status: done

## Story

As a **user**,
I want to see a clear, non-alarmist warning when the system detects overlap with an existing document,
So that I can decide to merge or proceed with awareness.

## Acceptance Criteria

1. A calm blue/purple banner slides in from the top when similarity is detected (UX-DR13).
2. Banner displays matched document(s) title, overlap reason, and "Merge" / "Ignore" actions.
3. Banner does not block the submission form — user can continue configuring while deciding.
4. Dismissing the banner (Ignore) allows the document to be saved as a new independent entry.

## Tasks / Subtasks

- [x] Task 1: Banner component in add-document-form.tsx (AC: 1, 2, 3)
  - [x] 1.1: Render similarity banner when state.similarDocs is non-empty
  - [x] 1.2: Calm blue styling (#3b82f6 tint background, blue border-left)
  - [x] 1.3: "Insight match detected" heading, matched doc title, shared tags list
  - [x] 1.4: Merge and Ignore action buttons
  - [x] 1.5: CSS transition slide-in from top
- [x] Task 2: Ignore action (AC: 4)
  - [x] 2.1: Ignore button clears similarDocs from local state
  - [x] 2.2: Form re-submits with ignoreSimilarity: true flag
  - [x] 2.3: addDocumentAction skips similarity check when ignoreSimilarity: true
- [x] Task 3: Non-blocking behavior (AC: 3)
  - [x] 3.1: Banner uses CSS push-down (adds margin-top to form), not overlay
  - [x] 3.2: All form fields remain interactive while banner is visible

## Dev Notes

- **Banner Design:** `bg-blue-50 border-l-4 border-blue-400` styling. "Insight match detected" with 🔍 icon (or SVG). Matched doc title as a link. Shared tags listed as badges.
- **Ignore Flow:** `ignoreSimilarity` hidden input in form → addDocumentAction receives it → skips similarity check → proceeds with insert.
- **Multiple Matches:** Banner shows up to 3 matches. If more, "and N more" suffix.
- **Merge Flow:** Merge button is handled by Story 5.3.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR13]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Banner is a CSS push-down (not an overlay) to keep form accessible — this was the correct UX interpretation of "does not block".

### Completion Notes List
- Similarity banner rendered in add-document-form when similarDocs present
- Calm blue styling with slide-in CSS transition
- Ignore clears banner and re-submits with ignoreSimilarity flag
- Form remains fully interactive while banner is visible

### File List
- `src/components/features/add-document-form.tsx` — similarity banner + ignore/merge handlers
- `src/actions/documents.ts` — ignoreSimilarity param in addDocumentAction

### Change Log
- Added similarity banner to add-document-form
- ignoreSimilarity flag added to addDocumentAction
- Ignore clears similarDocs state and bypasses similarity check on re-submit

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — Banner uses `bg-blue-50 border-l-4 border-blue-400` calm blue styling with CSS slide-in transition. Non-alarmist "Insight match detected" heading per UX-DR13.
- **AC2:** PASS — Banner shows matched document title, shared tags, and similarity score. Merge and Ignore buttons present.
- **AC3:** PASS — Banner is a push-down layout element (adds top margin). All form fields remain fully interactive while banner is visible.
- **AC4:** PASS — Ignore dismisses banner (clears similarDocs) and re-submits with `ignoreSimilarity: true`, allowing document to be saved as new independent entry.

### Review Outcome
PASS

### Review Notes
The non-blocking banner design is the correct interpretation of UX-DR13 ("never blocking the primary workflow"). Push-down layout rather than overlay is a subtle but important UX choice. The calm blue palette is deliberately chosen to contrast with red/orange warning patterns, reinforcing that this is information, not an error.
