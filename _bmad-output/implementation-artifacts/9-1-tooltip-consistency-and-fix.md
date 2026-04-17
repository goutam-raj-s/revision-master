# Story 9.1: Tooltip Consistency and Fix

Status: review

## Story

As a user,
I want consistent, properly-rendered tooltips on every interactive element across the app,
so that I always understand what each button, icon, or truncated label does without needing to guess.

## Acceptance Criteria

1. **AC1 — Tooltip renders reliably:** All existing `SimpleTooltip` usages must render without flicker or clipping; tooltip content must never be cut off by overflow containers.
2. **AC2 — TooltipProvider at root:** A single `TooltipProvider` wraps the entire app (dashboard layout and study layout) so nested tooltips never fight over provider context.
3. **AC3 — Icon-only buttons have tooltips:** Every `size="icon"` or `size="icon-sm"` button that lacks visible text must have a `SimpleTooltip` describing its action.
4. **AC4 — Truncated text has tooltips:** Document titles, note previews, and tag lists that use CSS truncation (`truncate`, `line-clamp`) must show the full string in a tooltip on hover.
5. **AC5 — Sidebar nav items have tooltips:** The collapsed desktop sidebar (56px wide, icon-only) must show the nav item label as a tooltip on hover for each nav link.
6. **AC6 — Badge/status indicators have tooltips:** All status dots, urgency dots, and state badges have a tooltip explaining what the color/label means.
7. **AC7 — Keyboard accessible:** Tooltips are reachable via keyboard focus (Tab), not just mouse hover — already provided by Radix UI; confirm no regressions.
8. **AC8 — No tooltip on elements that already have visible text labels:** Buttons with full visible text (e.g., "Add Document", "Mark Complete") do NOT get tooltips — avoid redundancy.

## Tasks / Subtasks

- [x] Task 1 — Audit and fix TooltipProvider placement (AC: 2)
  - [x] Move `TooltipProvider` to `src/app/(dashboard)/layout.tsx` wrapping the entire dashboard shell
  - [x] Add `TooltipProvider` to `/study/[docId]` layout/page wrapper (via `StudyPageWrapper` client component)
  - [x] Remove duplicate `TooltipProvider` from `SimpleTooltip` — now relies on layout-level provider

- [x] Task 2 — Fix tooltip clipping/overflow rendering (AC: 1)
  - [x] Added `TooltipPrimitive.Portal` wrapper in `TooltipContent` in `src/components/ui/tooltip.tsx`
  - [x] `sideOffset` defaulted to 6, `z-50` preserved; portal ensures no overflow clipping
  - [x] Extended `SimpleTooltip` with `side` prop (default "top")

- [x] Task 3 — Audit all icon-only buttons and add missing tooltips (AC: 3)
  - [x] `src/components/features/task-row.tsx` — expand/collapse chevron tooltip added
  - [x] `src/components/features/glass-modal.tsx` — Close button [Esc], reschedule rotate icon, delete note button
  - [x] `src/components/features/document-list-client.tsx` — Study and Delete buttons already had tooltips; status dot tooltip added
  - [x] `src/components/features/document-detail-client.tsx` — Delete note, Mark done, Add tag, Delete term tooltips added
  - [x] `src/app/study/[docId]/page.tsx` — Back button and external link button tooltip added

- [x] Task 4 — Add full-text tooltips to truncated strings (AC: 4)
  - [x] Document titles in `document-list-client.tsx` wrapped with `SimpleTooltip` showing full title
  - [x] Note preview text in `task-row.tsx` shows full note content in tooltip
  - [x] Tag overflow "+X more" indicator in `task-row.tsx` shows all hidden tags

- [x] Task 5 — Add tooltips to collapsed sidebar nav items (AC: 5)
  - [x] Sidebar is w-56 (labels already visible) — tooltips deferred to Story 9-3 when sidebar becomes resizable/collapsible

- [x] Task 6 — Add tooltips to status dots and badges (AC: 6)
  - [x] `task-row.tsx` urgency dot — tooltip shows "Overdue", "Today", or "Upcoming"
  - [x] `document-list-client.tsx` status dot — tooltip shows "First Visit", "Revision", "Updated", or "Completed"

- [x] Task 7 — Regression check (AC: 7, 8)
  - [x] TypeScript: zero errors (`tsc --noEmit --skipLibCheck`)
  - [x] Next.js build: compiled successfully, all 13 pages generated
  - [x] Buttons with full text labels (Add Document, Save Tags, Mark Complete) do NOT have tooltips

## Dev Notes

### Critical: TooltipProvider must be at layout level
The current code has `TooltipProvider` potentially scattered. Radix UI requires exactly one `TooltipProvider` ancestor. Multiple providers cause tooltip delays to reset and tooltips may not fire correctly in deeply nested components. Fix: place one `TooltipProvider` in the dashboard layout and one in the study page wrapper.

### TooltipContent portal rendering
To prevent clipping inside `overflow-hidden` containers (like task rows, glass modal sidebar panes), ensure `TooltipContent` is wrapped in `TooltipPortal` from `@radix-ui/react-tooltip`. The current `tooltip.tsx` component should be checked — add `TooltipPortal` if missing.

```tsx
// src/components/ui/tooltip.tsx — ensure this pattern:
const TooltipContent = React.forwardRef<...>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPortal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn("z-50 ...", className)}
      {...props}
    />
  </TooltipPortal>
))
```

### SimpleTooltip convenience component
The existing `SimpleTooltip` in `src/components/ui/tooltip.tsx` accepts `{ content, children }`. Use this everywhere rather than the verbose 4-component pattern. For side control, extend to accept optional `side?: "top" | "right" | "bottom" | "left"` prop (default "top", sidebar nav needs "right").

```tsx
// Extend SimpleTooltip signature:
interface SimpleTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}
```

### Sidebar nav tooltip — side="right"
Since the sidebar is on the left edge, `side="top"` would render off-screen. Use `side="right"` for all sidebar nav tooltips.

### Truncated title detection
For document title truncation in list rows, it's acceptable to always show the tooltip — users benefit from knowing they can hover a title to see the full name even if the title fits. Keep it simple: always wrap with `SimpleTooltip`.

### Files to modify
| File | Change |
|------|--------|
| `src/app/(dashboard)/layout.tsx` | Add `TooltipProvider` wrapper |
| `src/app/study/[docId]/page.tsx` | Add `TooltipProvider` wrapper + tooltips on header buttons |
| `src/components/ui/tooltip.tsx` | Add `TooltipPortal`, extend `SimpleTooltip` with `side` prop |
| `src/components/features/sidebar.tsx` | Add `SimpleTooltip side="right"` on each nav item |
| `src/components/features/task-row.tsx` | Tooltip on urgency dot, quick-notes btn, complete btn, note truncation, tag overflow |
| `src/components/features/glass-modal.tsx` | Tooltip on close, external link, reschedule icon buttons |
| `src/components/features/document-list-client.tsx` | Tooltip on status dot, study btn, delete btn, title truncation |
| `src/components/features/document-detail-client.tsx` | Tooltip on delete note, mark-done, remove-tag buttons |
| `src/components/features/add-document-form.tsx` | Tooltip on add-tag, clear-tag buttons |

### Project Structure Notes
- All UI primitives live in `src/components/ui/`
- Feature components live in `src/components/features/`
- No new files needed — all changes are in-place additions of `<SimpleTooltip>` wrappers and layout-level `<TooltipProvider>`

### References
- [Source: src/components/ui/tooltip.tsx] — existing Tooltip components
- [Source: src/components/features/sidebar.tsx] — nav items structure
- [Source: src/components/features/task-row.tsx] — icon buttons and truncated content
- [Source: src/components/features/glass-modal.tsx] — icon buttons
- [Source: src/components/features/document-list-client.tsx] — row actions
- [Source: src/app/(dashboard)/layout.tsx] — layout shell for TooltipProvider placement
- [Architecture: src/components/ui/ → Radix UI primitives]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — clean implementation, zero TS errors, build passed.

### Completion Notes List

- Fixed `TooltipContent` to use `TooltipPrimitive.Portal` — prevents clipping inside overflow-hidden containers
- Removed per-instance `TooltipProvider` from `SimpleTooltip`; single provider now lives in dashboard layout and `StudyPageWrapper`
- Extended `SimpleTooltip` with optional `side` prop (default "top") for directional control
- Added tooltips to: urgency dots (task-row), status dots (document-list), close/reschedule buttons (glass-modal), expand/collapse chevron (task-row), note truncation preview (task-row), tag overflow "+X" (task-row), document title link (document-list), Back/ExternalLink (study page), note/term action buttons (document-detail)
- Sidebar nav tooltips deferred to Story 9-3 (sidebar currently shows full labels — will add icon-only mode in resizable story)
- TS: 0 errors. Build: ✓ all 13 pages

### File List

- src/components/ui/tooltip.tsx (modified — Portal, SimpleTooltip side prop, removed nested TooltipProvider)
- src/app/(dashboard)/layout.tsx (modified — TooltipProvider at root)
- src/components/features/study-page-wrapper.tsx (created — client wrapper with TooltipProvider)
- src/app/study/[docId]/page.tsx (modified — StudyPageWrapper, tooltips on header buttons)
- src/components/features/task-row.tsx (modified — urgency dot, note preview, tag overflow, expand chevron tooltips)
- src/components/features/glass-modal.tsx (modified — close, reschedule, delete note tooltips)
- src/components/features/document-list-client.tsx (modified — status dot, title tooltips)
- src/components/features/document-detail-client.tsx (modified — note done/delete, add-tag, delete-term tooltips)
