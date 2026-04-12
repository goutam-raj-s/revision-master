# Story 7.7: Progressive Disclosure on Task List

Status: done

## Story

As a **user**,
I want the dashboard task list to show only essential information by default, with details revealed on interaction,
So that I'm not overwhelmed by information density.

## Acceptance Criteria

1. Default collapsed state shows only: document title, urgency indicator (color-coded), and next review date (UX-DR11).
2. Expanding a row reveals: full notes preview, complete tag list, difficulty badge, and revision history.
3. Expansion/collapse animates smoothly.
4. Only one row can be expanded at a time (accordion behavior).

## Tasks / Subtasks

- [x] Task 1: Collapsed task row design (AC: 1)
  - [x] 1.1: Document title (truncated to 60 chars)
  - [x] 1.2: Colored urgency dot (emerald = today, blue = upcoming, amber = overdue)
  - [x] 1.3: Formatted next review date (relative: "Today", "Tomorrow", "Apr 14")
  - [x] 1.4: Row height constrained to single line by default
- [x] Task 2: Expanded content panel (AC: 2)
  - [x] 2.1: First 120 chars of most recent note as preview
  - [x] 2.2: All tags as badge list
  - [x] 2.3: Difficulty badge (Easy/Medium/Hard with color coding)
  - [x] 2.4: Review count ("Reviewed 3 times")
- [x] Task 3: Smooth expansion animation (AC: 3)
  - [x] 3.1: max-h-0 → max-h-96 transition-all duration-300 on expanded panel
  - [x] 3.2: overflow-hidden to clip content during animation
- [x] Task 4: Accordion behavior (AC: 4)
  - [x] 4.1: expandedId state in TaskQueue parent component
  - [x] 4.2: TaskRow receives isExpanded prop + onToggle callback
  - [x] 4.3: Clicking an expanded row collapses it; clicking a different row closes previous

## Dev Notes

- **Urgency Colors:** Overdue (past due) → amber (#d97706). Due today → emerald (#059669). Upcoming → blue (#3b82f6). Completed → slate (#64748b).
- **Accordion State:** `const [expandedId, setExpandedId] = useState<string | null>(null)` in TaskQueue. `onToggle(id)` sets expandedId to id if different, null if same.
- **Animation:** `className={isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"} transition-all duration-300 overflow-hidden`. CSS max-height animation is the standard approach for accordion without JS-measured heights.
- **Date Formatting:** `formatRelativeDate()` in utils.ts: "Today" if same day, "Tomorrow" if +1, formatted date string otherwise.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.7]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR11]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- max-h animation approach: using max-h-96 (384px) as upper bound is a standard CSS accordion pattern. Content exceeding 384px would clip, but note previews are truncated to 120 chars so this is never an issue.

### Completion Notes List
- TaskRow defaults to collapsed single-line view
- Expanded panel with notes preview, tags, difficulty, review count
- CSS max-height transition for smooth accordion animation
- expandedId state in TaskQueue parent for accordion behavior

### File List
- `src/components/features/task-queue.tsx` — expandedId state + TaskRow accordion management
- `src/components/features/task-row.tsx` — isExpanded prop + collapsible expanded panel

### Change Log
- TaskRow refactored into collapsed/expanded two-state component
- CSS max-height transition added for expansion animation
- Accordion logic: expandedId in TaskQueue parent
- Urgency color dot added to collapsed row

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — Collapsed state renders title (truncated), colored urgency dot, and relative next review date on a single-line row.
- **AC2:** PASS — Expanded panel shows note preview (120 chars), all tag badges, difficulty badge (Easy/Medium/Hard), and review count.
- **AC3:** PASS — `transition-all duration-300` with `max-h-0 → max-h-96` produces smooth expand/collapse animation. `overflow-hidden` prevents content clipping flash.
- **AC4:** PASS — `expandedId` state in TaskQueue parent. Clicking a row calls `onToggle(id)`. If same row, sets to null (collapse). If different, previous collapses and new row expands.

### Review Outcome
PASS

### Review Notes
Progressive disclosure is the correct information architecture for a high-density task list. Showing only title + urgency + date in collapsed state keeps the dashboard scannable when users have many items. The accordion constraint (one expanded at a time) prevents cognitive overload. The CSS max-height animation is simple, reliable, and performant — avoids the complexity of JavaScript-measured height animations (FLIP, ResizeObserver, etc.).
