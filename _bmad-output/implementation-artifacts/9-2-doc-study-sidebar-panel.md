# Story 9.2: Document Study Page — Metadata Sidebar Panel

Status: review

## Story

As a learner,
I want to view and edit a document's tags, terminology, difficulty level, and review schedule directly from the study/[docId] page,
so that I can capture context and adjust metadata without leaving my reading flow or navigating back to the dashboard.

## Acceptance Criteria

1. **AC1 — Split-pane layout on study page:** The `/study/[docId]` page adopts a split-pane layout — embedded Google Doc iframe (70% width on ≥1024px) + right sidebar panel (30% width) — matching the pattern already established by `GlassModal`.
2. **AC2 — Sidebar sections:** The sidebar panel contains tabbed or stacked sections: **Overview** (difficulty, tags, next review), **Notes**, **Terms** (add/view terminology).
3. **AC3 — Difficulty editing:** User can change difficulty (Easy/Medium/Hard) via a select dropdown; change saves immediately via Server Action (same `updateDifficulty` action used in `document-detail-client.tsx`).
4. **AC4 — Tags editing:** User can add new tags and remove existing tags; changes save via Server Action on explicit "Save Tags" button (same pattern as `document-detail-client.tsx`).
5. **AC5 — Scheduling info:** The sidebar shows the current next-review date, interval days, and review count. If repetition exists, a reschedule control (days select + apply button) lets the user shift the next review date.
6. **AC6 — Notes panel:** User can add a new note (textarea + Cmd+Enter or button save), view existing notes, delete notes, and mark notes done — all identical to the notes section in `document-detail-client.tsx`.
7. **AC7 — Terms panel:** User can add a new term+definition pair and view/delete existing terms — identical to the terms section in `document-detail-client.tsx`.
8. **AC8 — Responsive degradation:** On screens <1024px, the sidebar collapses — a floating action button (bottom-right) opens the sidebar as an overlay/sheet. The iframe takes full width below 1024px.
9. **AC9 — No duplicate logic:** All Server Actions reused from existing actions — `updateDifficulty`, `updateTags`, `addNote`, `deleteNote`, `toggleNoteStatus`, `addTerm`, `deleteTerm`, `rescheduleDocument`. No new server-side logic.
10. **AC10 — Sidebar state persisted locally:** The active tab (Overview/Notes/Terms) is remembered in component state for the duration of the session (no persistence needed).
11. **AC11 — Document title in sidebar header:** Sidebar shows the document title at the top so the user knows which document they're editing.

## Tasks / Subtasks

- [x] Task 1 — Refactor study page to split-pane layout (AC: 1, 8)
  - [x] `src/app/study/[docId]/page.tsx` now uses `flex-1 flex min-h-0` body with iframe pane (`flex-1 relative min-w-0`) + sidebar pane (`hidden lg:flex lg:w-[30%] lg:min-w-[260px] lg:max-w-[400px]`)
  - [x] Mobile: sidebar hidden by default, revealed via MobileSidebarButton FAB
  - [x] Header preserved at top as `shrink-0`

- [x] Task 2 — Create `StudySidebarPanel` client component (AC: 2, 3, 4, 5, 6, 7, 10, 11)
  - [x] Created `src/components/features/study-sidebar-panel.tsx`
  - [x] Props: `{ doc, rep, initialNotes, initialTerms, onClose? }`
  - [x] Three tabs: Overview (difficulty, tags, schedule+reschedule), Notes (add/list/done/delete), Terms (add/list/delete)
  - [x] Document title shown in sidebar header with optional close button
  - [x] All state managed with `useState`; server actions called on mutations

- [x] Task 3 — Fetch all required data on study page server component (AC: 2, 5, 6, 7)
  - [x] `getRepetitionByDocId`, `getDocNotes`, `getDocTerms` fetched in parallel via `Promise.all`
  - [x] All passed as props to `StudySidebarPanel`

- [x] Task 4 — Reschedule control in Overview tab (AC: 5)
  - [x] nextReviewDate, intervalDays, reviewCount displayed
  - [x] Days select + RotateCcw button calls `rescheduleDocAction`
  - [x] Success toast shown

- [x] Task 5 — Mobile overlay sidebar (AC: 8)
  - [x] Created `src/components/features/study-mobile-sidebar.tsx` (`MobileSidebarButton`)
  - [x] Fixed FAB bottom-right `lg:hidden`, opens full-height right overlay with backdrop
  - [x] Overlay contains `StudySidebarPanel` with `onClose` prop

- [x] Task 6 — Style sidebar to match glass-modal right pane (AC: 1)
  - [x] `bg-surface border-l border-border`, scrollable `flex-1 overflow-y-auto`
  - [x] Tab active state: `text-state-today border-b-2 border-state-today`
  - [x] Section labels: `text-xs uppercase tracking-wide text-mossy-gray`

## Dev Notes

### Current study page structure
`src/app/study/[docId]/page.tsx` is a minimal server component:
- Calls `requireAuth()`, fetches the document by ID
- Renders a simple header + full-height iframe
- **No sidebar, no data fetch for notes/terms/rep**

This story transforms it into the split-pane experience described in UX-DR12:
> "Build Study Workspace Sidebar — split-pane layout parsing the reading page into an embedded document viewer (70%) and a specialized right-hand sidebar (30%) allowing for immediate glossary term capture and note taking without breaking focus."

### Reuse pattern from document-detail-client.tsx
`src/components/features/document-detail-client.tsx` already implements:
- Difficulty dropdown with immediate save
- Tags add/remove with Save button
- Notes add/delete/done toggle
- Terms add/delete

**Do NOT reinvent this logic.** Instead, extract or directly replicate the relevant sections into `StudySidebarPanel`. The server actions called are the same — no new backend work needed.

### Server actions to reuse (all in src/actions/)
Verify these exist and reuse directly:
- `updateDocumentDifficulty(docId, difficulty)`
- `updateDocumentTags(docId, tags)`
- `addNote(docId, content)`
- `deleteNote(noteId)`
- `toggleNoteStatus(noteId, isDone)`
- `addTerm(docId, term, definition)`
- `deleteTerm(termId)`
- `rescheduleDocument(docId, days)` — used in task-row.tsx

### Layout pattern from glass-modal
`src/components/features/glass-modal.tsx` already implements the 70/30 split:
```tsx
<div className="flex h-full">
  {/* Left: iframe 70% */}
  <div className="flex-1 ...">
    <iframe ... />
  </div>
  {/* Right: sidebar 30% */}
  <div className="w-80 ...">
    {/* tabs: notes, terms */}
  </div>
</div>
```
The study page should match this pattern but as a full-page layout (not a modal).

### Tab structure recommendation
Use 3 tabs to avoid vertical overflow in the sidebar:
1. **Overview** — Difficulty + Tags + Review Schedule (most frequently needed)
2. **Notes** — Add/view/manage notes
3. **Terms** — Add/view/manage terminology

Simple tab implementation using button state — shadcn `Tabs` primitive or just `useState<'overview'|'notes'|'terms'>` with conditional rendering.

### Mobile FAB
The FAB should look like:
```tsx
<button className="fixed bottom-6 right-6 lg:hidden z-40 rounded-full bg-state-today text-white shadow-glass p-3">
  <PanelRightOpen size={20} />
</button>
```

### Files to create
| File | Purpose |
|------|---------|
| `src/components/features/study-sidebar-panel.tsx` | New client component — the sidebar panel |

### Files to modify
| File | Change |
|------|--------|
| `src/app/study/[docId]/page.tsx` | Split-pane layout, fetch notes/terms/rep, pass to sidebar |

### Project Structure Notes
- New component follows `src/components/features/` convention
- No new server actions needed — all reuse existing ones from `src/actions/`
- No new DB queries needed — all utility fns already exist in `src/lib/db/`

### References
- [Source: src/app/study/[docId]/page.tsx] — current study page to transform
- [Source: src/components/features/glass-modal.tsx] — 70/30 split pattern and tab UI
- [Source: src/components/features/document-detail-client.tsx] — notes/terms/difficulty/tags UI to replicate
- [Source: src/components/features/task-row.tsx] — reschedule control pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR12] — UX requirement
- [Architecture: src/actions/ — Server Actions for all mutations]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — clean build, zero TS errors.

### Completion Notes List

- Created `StudySidebarPanel` with 3 tabs (Overview/Notes/Terms); matches GlassModal UX pattern
- All mutations reuse existing server actions: `updateDocumentAction`, `rescheduleDocAction`, `createNoteAction`, `deleteNoteAction`, `markNoteDoneAction`, `createTermAction`, `deleteTermAction`
- Data fetched server-side via `Promise.all` — `getRepetitionByDocId`, `getDocNotes`, `getDocTerms`
- Mobile: `MobileSidebarButton` FAB (`lg:hidden`) opens overlay slide-in with full sidebar content
- `StudyPageWrapper` (from Story 9-1) provides `TooltipProvider` context for tooltips in sidebar
- Build: ✓ all 13 pages, 0 TS errors

### File List

- src/app/study/[docId]/page.tsx (modified — split-pane layout, data fetching, sidebar integration)
- src/components/features/study-sidebar-panel.tsx (created — Overview/Notes/Terms tabbed sidebar)
- src/components/features/study-mobile-sidebar.tsx (created — FAB + overlay for mobile)
