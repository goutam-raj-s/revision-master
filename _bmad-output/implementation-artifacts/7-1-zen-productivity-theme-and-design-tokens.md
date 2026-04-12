# Story 7.1: Zen Productivity Theme & Design Tokens

Status: done

## Story

As a **user**,
I want the entire application to feel like a calm, premium learning environment with consistent colors, typography, and spacing,
So that long study sessions are comfortable and the UI builds trust.

## Acceptance Criteria

1. Background uses sage/mint cream (#f1f5f2), cards use white (#FFFFFF) with border-radius 1.5rem (UX-DR1).
2. Semantic state colors applied: Emerald (#059669) for Today, Blue (#3b82f6) for Upcoming, Amber (#d97706) for Stale, Gray (#64748b) for Completed (UX-DR2).
3. Inter is the primary typeface, Newsreader for document titles, monospace for dates/metrics (UX-DR3).
4. Custom shadow utilities (shadow-soft, shadow-hover) replace default harsh shadows.

## Tasks / Subtasks

- [x] Task 1: Rewrite globals.css for Tailwind v4 (AC: 1, 2, 3, 4)
  - [x] 1.1: Replace v3 @tailwind directives with @import "tailwindcss"
  - [x] 1.2: Define all color tokens in @theme {} block
  - [x] 1.3: Define font-family tokens in @theme {}
  - [x] 1.4: Define shadow tokens in @theme {}
  - [x] 1.5: Define keyframes and animation tokens in @theme {}
- [x] Task 2: Custom utility classes (AC: 4)
  - [x] 2.1: .bouncy-hover — cubic-bezier bounce transform
  - [x] 2.2: .glass-surface — backdrop-blur + semi-transparent bg
  - [x] 2.3: .shimmer-bg — animated gradient for loading states
  - [x] 2.4: .task-row-hover — hover lift with soft shadow
- [x] Task 3: Simplify tailwind.config.ts for v4 (AC: 1)
  - [x] 3.1: Remove extended theme config (moved to @theme {})
  - [x] 3.2: Keep only content paths and empty plugins array

## Dev Notes

- **Critical Tailwind v4 Migration:** v4 breaks from v3 entirely. `@tailwind base/components/utilities` → `@import "tailwindcss"`. All design tokens move from `tailwind.config.ts extend: {}` → `@theme {}` block in globals.css. Config file is now nearly empty.
- **Bug Fixed:** Initial globals.css used v3 syntax causing `border-border unknown utility class` errors. Complete rewrite to v4 syntax fixed all issues.
- **@theme Block:** Defines `--color-canvas: #f1f5f2`, `--color-emerald-today: #059669`, `--color-blue-upcoming: #3b82f6`, `--color-amber-stale: #d97706`, `--color-slate-completed: #64748b`, font-family tokens, shadow tokens, keyframe animations.
- **Fonts:** Inter loaded via `next/font/google` in root layout. Newsreader loaded similarly. Applied via `font-inter` / `font-newsreader` CSS classes from @theme tokens.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.1]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR1, UX-DR2, UX-DR3]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- **Major Issue:** Tailwind v4 completely changes config approach. Initial v3-style globals.css caused build errors (`border-border` unknown utility). Fixed by full rewrite to v4 `@import "tailwindcss"` + `@theme {}` pattern. This was the biggest single technical hurdle in the project.

### Completion Notes List
- globals.css completely rewritten for Tailwind v4 compatibility
- All color, font, shadow, and animation tokens defined in @theme {}
- tailwind.config.ts simplified to content paths only
- Custom utility classes defined as plain CSS (not @layer)

### File List
- `src/app/globals.css` — complete Tailwind v4 design token definitions + custom utilities
- `tailwind.config.ts` — simplified to content paths only

### Change Log
- Full rewrite of globals.css from v3 to v4 syntax
- All design tokens migrated from tailwind.config.ts to @theme {}
- Custom utility classes added for bouncy-hover, glass-surface, shimmer-bg
- tailwind.config.ts stripped to minimal v4 config

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — Canvas `#f1f5f2` applied as body background. Cards use `bg-white rounded-3xl` (1.5rem = 24px = rounded-3xl in Tailwind).
- **AC2:** PASS — Semantic state colors defined in @theme and applied consistently: emerald for today tasks, blue for upcoming, amber for stale/rescheduled, slate for completed.
- **AC3:** PASS — Inter font loaded via next/font/google, applied globally. Newsreader applied to document title elements. System monospace for dates/metrics.
- **AC4:** PASS — `shadow-soft` and `shadow-hover` custom shadow utilities defined in @theme. Applied on cards and task rows.

### Review Outcome
PASS

### Review Notes
The Tailwind v4 migration was the highest-risk technical challenge in the entire implementation. The v4 `@theme {}` approach is actually cleaner than v3's config extension pattern — all design tokens colocated in CSS rather than split across JS config and CSS files. The build now passes cleanly with zero Tailwind-related errors. This design system provides a solid foundation for the Zen Productivity aesthetic throughout the application.
