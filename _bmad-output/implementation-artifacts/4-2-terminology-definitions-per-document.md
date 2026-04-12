# Story 4.2: Terminology Definitions per Document

Status: done

## Story

As a **user**,
I want to create terminology definitions mapped to specific documents,
So that I build a personal glossary of key concepts alongside my study material.

## Acceptance Criteria

1. Term and definition is persisted and linked to the source document.
2. Terms are displayed in the metadata sidebar alongside notes.
3. Each term entry includes: term name, definition text, source document reference, creation date.
4. Manual entry is supported (Phase 1; AI-powered definitions deferred to Phase 2 per PRD).

## Tasks / Subtasks

- [x] Task 1: Implement createTermAction Server Action (AC: 1)
  - [x] 1.1: Zod schema: term (string min 1), definition (string min 1), docId (string)
  - [x] 1.2: Insert into terms collection with docId, userId, term, definition, createdAt, status: "active"
  - [x] 1.3: Fix useActionState type: _prev: ActionResult<Term> matches return type
  - [x] 1.4: revalidatePath after insert
- [x] Task 2: Display terms in Glass Modal sidebar (AC: 2, 3)
  - [x] 2.1: Terms tab in glass-modal right pane
  - [x] 2.2: Each term shows: term name (bold), definition, source doc reference, createdAt date
- [x] Task 3: Terminology browser page (AC: 3, 4)
  - [x] 3.1: /terminology route lists all user terms alphabetically
  - [x] 3.2: Terms grouped by first letter, source doc link per entry

## Dev Notes

- **Terms Collection:** `{ _id, docId, userId, term, definition, createdAt, updatedAt, status: "active" | "done" }`.
- **Phase 1 Scope:** Manual text entry only. "Define with Gemini" button is Phase 2 (AI Terminology Context Popover per UX-DR12). Phase 1 shows placeholder button that is disabled.
- **Source Doc Reference:** Terms store `docId` which is resolved to document title on render.
- **useActionState Fix:** Same pattern as createNoteAction — `_prev: ActionResult<Term>` must match return type.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR12]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Same useActionState type fix as Story 4.1 — ActionResult<Term> typing applied.

### Completion Notes List
- createTermAction implemented with correct ActionResult<Term> typing
- Terms displayed in Terms tab of glass-modal sidebar
- Terminology page at /terminology shows all user terms alphabetically
- "Define with Gemini" button present but disabled (Phase 2 placeholder)

### File List
- `src/actions/notes.ts` — createTermAction (alongside note actions)
- `src/components/features/glass-modal.tsx` — Terms tab in right sidebar
- `src/app/(dashboard)/terminology/page.tsx` — global terminology browser
- `src/types/index.ts` — DbTerm, Term types

### Change Log
- Implemented createTermAction with proper ActionResult<Term> typing
- Terms tab added to glass-modal alongside Notes tab
- /terminology page created with alphabetical grouping and source doc links

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `createTermAction` inserts into `terms` collection with docId, userId, term, definition, createdAt.
- **AC2:** PASS — Terms tab in glass-modal right pane lists all terms for the document alongside Notes tab.
- **AC3:** PASS — Each entry shows term name, definition, source document title (resolved from docId), and createdAt date.
- **AC4:** PASS — Manual text entry form implemented. AI definition deferred to Phase 2 with disabled placeholder button.

### Review Outcome
PASS

### Review Notes
Terminology is implemented as a proper first-class feature with its own collection and dedicated /terminology browser page. The Phase 2 AI integration point is clearly delineated with a disabled placeholder, making future integration straightforward. The shared notes.ts action file is a clean organizational choice given the similar CRUD patterns.
