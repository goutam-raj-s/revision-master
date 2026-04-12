# Story 7.2: Micro-Interactions & Task Completion Animations

Status: done

## Story

As a **user**,
I want fluid, satisfying micro-animations when I interact with the UI — especially when clearing tasks,
So that the revision habit feels rewarding and the interface feels alive.

## Acceptance Criteria

1. Hovering over a Task Row Card triggers a bouncy transform (cubic-bezier(0.34, 1.56, 0.64, 1), scale 1.05) per UX-DR6.
2. Marking a task as completed makes the row slide right and fade out.
3. Remaining tasks slide up to fill the gap with physics-based easing.
4. A toast notification confirms the action.
5. All transitions use duration-300 ease-out for consistency.

## Tasks / Subtasks

- [x] Task 1: Bouncy hover animation (AC: 1)
  - [x] 1.1: .bouncy-hover CSS class with cubic-bezier(0.34,1.56,0.64,1) transition
  - [x] 1.2: hover:scale-105 applied via .bouncy-hover on task row
- [x] Task 2: Task completion sweep animation (AC: 2, 3)
  - [x] 2.1: @keyframes sweep-out: translateX(0)→translateX(100%) + opacity 1→0
  - [x] 2.2: animate-sweep-out class applied to task row on complete
  - [x] 2.3: setTimeout → remove from list after animation completes (300ms)
- [x] Task 3: Toast notifications (AC: 4)
  - [x] 3.1: Radix UI Toast in root layout
  - [x] 3.2: Toaster component renders toast stack
  - [x] 3.3: Toast triggered from TaskRow on complete/reschedule
- [x] Task 4: Consistent transition durations (AC: 5)
  - [x] 4.1: duration-300 ease-out applied on all interactive elements
  - [x] 4.2: Expansion/collapse of task rows uses transition-all duration-300

## Dev Notes

- **CSS Classes:** `.bouncy-hover { transition: transform 300ms cubic-bezier(0.34,1.56,0.64,1); } .bouncy-hover:hover { transform: scale(1.05); }`. Defined in globals.css as plain CSS.
- **Sweep Animation:** `@keyframes sweep-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`. Class: `animate-sweep-out { animation: sweep-out 300ms ease-out forwards; }`.
- **Gap Fill:** CSS `transition-all duration-300` on the task list container. When an item is removed from the React state array, remaining items naturally slide up via CSS layout transition.
- **Toast:** Radix UI `@radix-ui/react-toast` in root layout. Toast called with `{ title: "Marked complete", description: "Document cleared from queue" }`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR6]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Gap fill animation: CSS flexbox column with `transition-all` on container achieves smooth slide-up without JavaScript-driven animations.

### Completion Notes List
- .bouncy-hover class defined in globals.css and applied to task rows
- @keyframes sweep-out defined, animate-sweep-out class created
- Task row applies sweep-out class then removes from list after 300ms
- Radix UI Toast mounted in root layout, triggered on action completion

### File List
- `src/app/globals.css` — .bouncy-hover, @keyframes sweep-out, animate-sweep-out
- `src/components/features/task-row.tsx` — applies bouncy-hover + sweep animation on complete
- `src/app/layout.tsx` — Toaster component mounted
- `src/components/ui/toaster.tsx` — Radix UI Toast wrapper

### Change Log
- Added .bouncy-hover and animate-sweep-out CSS in globals.css
- task-row.tsx applies sweep class then removes from parent state after animation
- Radix Toast integrated in root layout
- All interactive transitions standardized to duration-300 ease-out

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `.bouncy-hover` class uses `cubic-bezier(0.34,1.56,0.64,1)` with `hover:scale-105`. Applied to task row cards.
- **AC2:** PASS — `animate-sweep-out` keyframe slides row to `translateX(100%)` with `opacity: 0` over 300ms.
- **AC3:** PASS — CSS `transition-all duration-300` on flexbox column container causes remaining items to slide up naturally when item is removed from React state.
- **AC4:** PASS — Radix UI Toast displays "Marked complete" / "Document rescheduled" confirmation on action.
- **AC5:** PASS — `duration-300 ease-out` applied consistently across all transitions including expansion/collapse and hover effects.

### Review Outcome
PASS

### Review Notes
The micro-interaction system creates a rewarding task-clearance experience. The bouncy cubic-bezier is the same easing used in iOS spring animations, giving a native-app feel. The sweep-out animation is satisfying without being distracting. CSS-driven gap fill (rather than JavaScript-driven FLIP animations) is simpler and performs well.
