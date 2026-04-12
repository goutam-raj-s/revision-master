# Story 7.5: Responsive Design & Mobile Degradation

Status: done

## Story

As a **user**,
I want the application to work well on my phone for quick task clearance, and maximize screen real estate on desktop,
So that I can study on any device.

## Acceptance Criteria

1. Mobile (< 768px): sidebar collapses to hamburger menu (UX-DR9).
2. Split-screen layouts stack vertically on mobile; Google Doc opens externally.
3. Tap targets meet minimum 44px sizing requirements.
4. Desktop (1024px+): split-screen layouts activate and sidebars are visible.
5. Content constrained with max-w-screen-2xl to prevent extreme stretching.

## Tasks / Subtasks

- [x] Task 1: Responsive sidebar (AC: 1, 4)
  - [x] 1.1: Sidebar hidden on mobile: hidden md:flex on sidebar container
  - [x] 1.2: Hamburger button visible on mobile: flex md:hidden
  - [x] 1.3: Mobile nav drawer via Radix UI Sheet (Dialog variant)
  - [x] 1.4: Desktop sidebar always visible at md breakpoint+
- [x] Task 2: Mobile Glass Modal degradation (AC: 2)
  - [x] 2.1: Detect viewport < 768px in glass-modal
  - [x] 2.2: Replace iframe with "Open in Google Docs" external link button on mobile
  - [x] 2.3: Metadata sidebar takes full width on mobile (stacked layout)
- [x] Task 3: Tap target sizing (AC: 3)
  - [x] 3.1: All interactive elements min h-11 (44px) on mobile
  - [x] 3.2: Tag badges min h-8 with adequate padding
- [x] Task 4: Layout constraints (AC: 5)
  - [x] 4.1: max-w-screen-2xl mx-auto on main content containers
  - [x] 4.2: Responsive padding: px-4 md:px-8 lg:px-12

## Dev Notes

- **Breakpoints:** Mobile: < 768px (below Tailwind `md`). Desktop: >= 1024px (Tailwind `lg`). Split-screen activates at `lg`.
- **Mobile Drawer:** Radix UI `@radix-ui/react-dialog` used as Sheet/drawer for mobile navigation. `side="left"` variant with slide-in animation.
- **Viewport Detection:** `useWindowSize` hook or CSS-only `hidden lg:grid` on glass modal split layout. CSS-only preferred to avoid hydration issues.
- **Tap Targets:** Tailwind `min-h-11` (44px) on buttons. Radix UI Select and DropdownMenu items have adequate padding by default.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.5]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR9]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- No issues. CSS-only responsive approach avoids SSR hydration mismatch.

### Completion Notes List
- Sidebar uses hidden md:flex / flex md:hidden pattern for responsive toggle
- Mobile nav drawer via Radix Dialog
- Glass modal replaces iframe with external link on mobile via CSS hidden lg:block
- max-w-screen-2xl applied to main content areas
- min-h-11 applied to all interactive elements

### File List
- `src/components/features/sidebar.tsx` — responsive sidebar + mobile drawer
- `src/components/features/glass-modal.tsx` — mobile degradation (external link)
- `src/app/(dashboard)/layout.tsx` — max-w-screen-2xl container

### Change Log
- Sidebar responsive pattern implemented with mobile drawer
- Glass modal mobile degradation: iframe hidden, external link shown on mobile
- Content width constrained with max-w-screen-2xl
- Tap target sizing standardized to min-h-11

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — Sidebar uses `hidden md:flex` class. Hamburger button uses `flex md:hidden`. Mobile drawer implemented with Radix Dialog.
- **AC2:** PASS — Glass modal split layout uses `hidden lg:grid`. On mobile, only metadata sidebar shown with "Open in Google Docs" external link button instead of iframe.
- **AC3:** PASS — All buttons use `min-h-11` (44px). Radix UI primitives provide adequate tap targets by default.
- **AC4:** PASS — Desktop (lg+) shows full split-screen in glass modal and visible sidebar. Split-screen activated with `lg:grid` breakpoint.
- **AC5:** PASS — `max-w-screen-2xl mx-auto` applied to dashboard layout main content container.

### Review Outcome
PASS

### Review Notes
Mobile degradation strategy (external link instead of embedded iframe) is correct — mobile browsers handle Google Doc embeds poorly due to iframe sizing and touch scroll conflicts. The CSS-only responsive approach (no JavaScript viewport detection) avoids SSR hydration issues and is more performant. Desktop-first design is well-suited for a study tool where users primarily engage on larger screens.
