# Story 9.3: Resizable UI Panels Across All Pages

Status: ready-for-dev

## Story

As a user,
I want to drag-resize sections, sidebars, and panels across every page of the app,
so that I can tailor the layout to my screen size, reading style, and workflow preferences.

## Acceptance Criteria

1. **AC1 — Resizable split panes:** All split-pane layouts (glass-modal 70/30, study page 70/30) expose a draggable divider between left and right panes. Dragging adjusts widths in real time.
2. **AC2 — Collapsible sidebar:** The left navigation sidebar (currently fixed 56px icon-only) can be expanded by dragging its right edge — expanding it reveals nav labels alongside icons. A minimum width of 56px and maximum of 220px is enforced.
3. **AC3 — Collapsible/resizable right sidebar on study page:** The study page right sidebar can be resized (min 240px, max 480px) by dragging its left edge. A collapse button hides it entirely; clicking it again or clicking the FAB re-opens it at its last saved width.
4. **AC4 — Dashboard section height adjustment:** The dashboard page's "Revision Queue" section and "Learning Insights" section each have a drag handle on their bottom edge, allowing users to adjust how much vertical space each section occupies.
5. **AC5 — Persistence across navigation:** Resized widths and heights are saved to `localStorage` under a namespaced key (e.g. `rm-layout-prefs`) and restored on next load. No server round-trip needed.
6. **AC6 — Resize handles are discoverable:** Drag handles have a subtle visual indicator (a thin line with a grip dots pattern `⠿`) that becomes more visible on hover. Cursor changes to `resize` cursor on hover.
7. **AC7 — Touch/mobile support for collapsing:** On mobile (<1024px), resize dragging is disabled (too imprecise) but collapse/expand via tap on handle or toggle button still works.
8. **AC8 — Smooth resize with no layout thrash:** Resize is implemented using CSS variables or inline style updates — no React re-render on every mousemove pixel. Only state updates when drag ends.
9. **AC9 — Double-click to reset:** Double-clicking any drag handle resets that section to its default size.
10. **AC10 — Glass modal split pane is also resizable:** The GlassModal study overlay (3-4 split screen modal) also uses the same resizable split logic.

## Tasks / Subtasks

- [ ] Task 1 — Create `ResizablePanel` primitive component (AC: 1, 6, 8, 9)
  - [ ] Create `src/components/ui/resizable-panel.tsx`
  - [ ] Implement a hook `useResizableSplit` that manages:
    - `splitPercent: number` state (e.g. 70 for 70%)
    - `onMouseDown` handler that starts drag tracking via `document.addEventListener('mousemove')` and `'mouseup'`
    - Updates CSS variable `--split-left` on the container element directly (no React setState on each mousemove — use ref)
    - On mouseup, calls `setSplitPercent(newValue)` once to commit state
    - Enforces min/max constraints (configurable props)
    - Double-click handler on divider to reset to default
  - [ ] Create `ResizableHandle` component: a vertical thin bar `w-1` with grip dots, `cursor-col-resize`, hover state brightens it
  - [ ] Create `ResizablePanelGroup` wrapper that applies `display: flex` and wires up the handle between left/right children

- [ ] Task 2 — Create `useLocalStorageLayout` hook (AC: 5)
  - [ ] Create `src/hooks/use-layout-prefs.ts`
  - [ ] Reads/writes to `localStorage` key `rm-layout-prefs` (JSON object)
  - [ ] Keys: `sidebarWidth`, `studySplitPercent`, `modalSplitPercent`, `dashboardQueueHeight`, `dashboardInsightsHeight`
  - [ ] Exports `useLayoutPref(key, defaultValue)` — returns `[value, setValue]` pair with auto-persistence
  - [ ] Handles SSR safely (returns defaultValue on server, reads localStorage on client after mount)

- [ ] Task 3 — Apply resizable split to GlassModal (AC: 1, 10)
  - [ ] In `src/components/features/glass-modal.tsx`, replace the hard-coded `flex-1` / `w-80` split with `ResizablePanelGroup`
  - [ ] Default split: 70/30 (same as current)
  - [ ] Min left: 40%, max left: 85%
  - [ ] Persist split percent via `useLayoutPref('modalSplitPercent', 70)`

- [ ] Task 4 — Apply resizable split to study page (AC: 1, 3)
  - [ ] In `src/app/study/[docId]/page.tsx` (after Story 9-2 split-pane is implemented), wrap with `ResizablePanelGroup`
  - [ ] Default: 70/30, min left 40%, max left 85%
  - [ ] Persist via `useLayoutPref('studySplitPercent', 70)`
  - [ ] Add collapse button at top of sidebar panel (chevron-right icon) that sets splitPercent to 100 (full width for iframe)
  - [ ] When collapsed, show a small expand button on the right edge to restore

- [ ] Task 5 — Resizable navigation sidebar (AC: 2)
  - [ ] In `src/components/features/sidebar.tsx`, add a vertical drag handle on the right edge of the sidebar
  - [ ] Current sidebar: fixed `w-14` (56px). With resize: `style={{ width: sidebarWidth + 'px' }}`
  - [ ] `sidebarWidth` range: 56px (icon-only) → 220px (icons + labels visible)
  - [ ] When `sidebarWidth > 100`, show nav labels next to icons (currently hidden — the labels exist in the DOM as `sr-only` or hidden, make them visible)
  - [ ] Persist via `useLayoutPref('sidebarWidth', 56)`
  - [ ] On mobile: disable resize (sidebar is hamburger-menu driven, unchanged)
  - [ ] Double-click handle: toggle between 56px and 180px (collapsed/expanded snap)

- [ ] Task 6 — Resizable dashboard sections (AC: 4)
  - [ ] In `src/app/(dashboard)/dashboard/page.tsx`, wrap the Revision Queue section and Learning Insights section in a vertically resizable layout
  - [ ] Create a `ResizableVerticalHandle` variant of the handle (horizontal bar, `cursor-row-resize`)
  - [ ] The queue section gets a bottom drag handle; dragging it adjusts the queue's `height` (min 200px, max 70vh)
  - [ ] Insights section fills the remaining space (`flex-1`)
  - [ ] Persist queue height via `useLayoutPref('dashboardQueueHeight', 400)`

- [ ] Task 7 — Touch: collapse-only on mobile (AC: 7)
  - [ ] In all resizable components, detect `'ontouchstart' in window` and disable mouse drag when true
  - [ ] On study page and glass modal: keep collapse/expand toggle button functional on touch
  - [ ] Sidebar: hamburger menu behavior unchanged on mobile (already implemented)

- [ ] Task 8 — Visual polish for handles (AC: 6, 8)
  - [ ] Handle default: `bg-border opacity-40`
  - [ ] Handle hover: `bg-state-today opacity-80` with `transition-opacity duration-150`
  - [ ] Grip dots pattern using `⠿` character or three `•` dots spaced vertically in the center of the handle
  - [ ] Ensure handle click target is at least 8px wide (even if visually 2px) for easy grabbing — use negative margin or padding
  - [ ] No page scroll or text selection during drag (add `user-select: none` to body during active drag via `document.body.style.userSelect`)

## Dev Notes

### No third-party resize library needed
Avoid adding `react-resizable`, `re-resizable`, or `react-split-pane` — these add bundle weight and may conflict with Tailwind v4. The custom hook approach is ~60 lines and perfectly adequate. The key insight for smooth resize: **update DOM directly via refs during drag, commit to state only on mouseup**.

```tsx
// Performance-correct resize pattern:
const handleMouseMove = useCallback((e: MouseEvent) => {
  if (!isDragging.current || !containerRef.current) return;
  const containerRect = containerRef.current.getBoundingClientRect();
  const newPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
  const clamped = Math.min(maxPercent, Math.max(minPercent, newPercent));
  // Direct DOM update — no React re-render:
  leftRef.current!.style.width = `${clamped}%`;
  rightRef.current!.style.width = `${100 - clamped}%`;
  pendingPercent.current = clamped;
}, [minPercent, maxPercent]);

const handleMouseUp = useCallback(() => {
  if (!isDragging.current) return;
  isDragging.current = false;
  setSplitPercent(pendingPercent.current); // single state update on release
  onResizeEnd?.(pendingPercent.current);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.body.style.userSelect = '';
}, [handleMouseMove]);
```

### localStorage SSR safety
Next.js App Router server-renders components. `localStorage` is undefined on the server. Safe pattern:

```tsx
// src/hooks/use-layout-prefs.ts
import { useEffect, useState } from 'react';

export function useLayoutPref(key: string, defaultValue: number) {
  const [value, setValue] = useState(defaultValue); // server-safe default

  useEffect(() => {
    const stored = localStorage.getItem(`rm-layout-prefs.${key}`);
    if (stored !== null) setValue(Number(stored));
  }, [key]);

  const persist = (newVal: number) => {
    setValue(newVal);
    localStorage.setItem(`rm-layout-prefs.${key}`, String(newVal));
  };

  return [value, persist] as const;
}
```

### Sidebar label visibility at expanded width
Current `sidebar.tsx` has nav labels either as `sr-only` text or as text with `hidden lg:block`. When `sidebarWidth > 100`, apply a CSS class `.sidebar-expanded` to the sidebar element and in CSS:
```css
.sidebar-expanded .nav-label { display: block; }
```
Or drive it conditionally in JSX: `{sidebarWidth > 100 && <span>{label}</span>}`.

### Dashboard vertical resize
The dashboard page is a server component — the resize logic needs a client wrapper. Wrap the stats+queue+insights content in a `DashboardLayoutClient` client component that handles the vertical resize. The page itself stays a server component for data fetching; just the layout wrapper is client-side.

### Dependency on Story 9-2
Task 4 (study page resizable split) depends on Story 9-2 being implemented first (which introduces the study page split-pane). If implementing in parallel, Task 4 should be done after 9-2.

### Files to create
| File | Purpose |
|------|---------|
| `src/components/ui/resizable-panel.tsx` | ResizablePanelGroup, ResizableHandle, ResizableVerticalHandle components |
| `src/hooks/use-layout-prefs.ts` | localStorage persistence hook |

### Files to modify
| File | Change |
|------|--------|
| `src/components/features/glass-modal.tsx` | Use ResizablePanelGroup for 70/30 split |
| `src/app/study/[docId]/page.tsx` | Use ResizablePanelGroup (after 9-2) |
| `src/components/features/sidebar.tsx` | Resizable right edge, expandable with labels |
| `src/app/(dashboard)/dashboard/page.tsx` | Vertical resize between queue and insights |

### Project Structure Notes
- New hook in `src/hooks/` — create the directory if it doesn't exist (check first with glob)
- New UI primitive in `src/components/ui/` — consistent with existing Radix UI components
- All layout prefs stored under `rm-layout-prefs.*` keys in localStorage

### References
- [Source: src/components/features/glass-modal.tsx] — existing 70/30 split to make resizable
- [Source: src/components/features/sidebar.tsx] — nav sidebar to add resize to
- [Source: src/app/(dashboard)/dashboard/page.tsx] — dashboard layout for vertical resize
- [Source: src/app/study/[docId]/page.tsx] — study page split (depends on Story 9-2)
- [Architecture: src/components/ui/ → UI primitive location]
- [Architecture: Zustand for client state — but layout prefs are localStorage, not Zustand store]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
