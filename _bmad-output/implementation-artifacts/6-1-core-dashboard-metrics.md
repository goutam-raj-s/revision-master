# Story 6.1: Core Dashboard Metrics

Status: done

## Story

As a **user**,
I want to see core metrics — Total Documents, Pending Revisions, and Total Completed — on my dashboard,
So that I have an at-a-glance understanding of my learning progress.

## Acceptance Criteria

1. Three metric cards display: Total Documents, Pending Revisions (nextReviewDate ≤ today), Total Completed (status = "completed").
2. Metrics are calculated server-side via MongoDB aggregation (RSC).
3. Metric values update after task clearance (revalidatePath).
4. Empty states show "0" with encouraging messaging, not error states.

## Tasks / Subtasks

- [x] Task 1: getDashboardStats Server Action / function (AC: 1, 2)
  - [x] 1.1: Total docs: countDocuments({ userId })
  - [x] 1.2: Pending revisions: join Repetitions where nextReviewDate <= today
  - [x] 1.3: Total completed: countDocuments({ userId, status: "completed" })
  - [x] 1.4: Return DashboardStats type
- [x] Task 2: StatsCards component (AC: 1, 4)
  - [x] 2.1: Three cards: Total Docs, Pending Revisions, Total Completed
  - [x] 2.2: Empty state shows "0" with sub-label like "Keep it up!"
  - [x] 2.3: Cards use Zen Productivity design (white card, soft shadow)
- [x] Task 3: Revalidation after task actions (AC: 3)
  - [x] 3.1: revalidatePath("/dashboard") in rescheduleAction and completeDocumentAction
  - [x] 3.2: Dashboard re-fetches stats on next visit

## Dev Notes

- **getDashboardStats:** In `src/actions/analytics.ts`. Uses `React.cache()` for deduplication within a single request. Called in dashboard page Server Component.
- **Pending Revisions Join:** `getRepetitionsCollection().countDocuments({ userId, nextReviewDate: { $lte: new Date() } })` — straightforward, no aggregation pipeline needed.
- **DashboardStats Type:** `{ totalDocs: number, pendingRevisions: number, totalCompleted: number }`.
- **revalidatePath:** `revalidatePath("/dashboard")` called in all task-mutating Server Actions. Next.js 16 — `revalidateTag` requires 2 args, so `revalidatePath` used instead.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1]
- [Source: _bmad-output/planning-artifacts/prd.md#FR18]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- revalidateTag removed: Next.js 16 changed signature to require 2 arguments. Replaced with revalidatePath throughout all action files.

### Completion Notes List
- getDashboardStats implemented in analytics.ts with 3 MongoDB count queries
- DashboardStats type in types/index.ts
- StatsCards component renders 3 metric cards with empty state handling
- revalidatePath("/dashboard") wired into all task-mutating actions

### File List
- `src/actions/analytics.ts` — getDashboardStats
- `src/components/features/stats-cards.tsx` — three metric card components
- `src/app/(dashboard)/dashboard/page.tsx` — calls getDashboardStats, renders StatsCards
- `src/types/index.ts` — DashboardStats type

### Change Log
- Created analytics.ts with getDashboardStats
- StatsCards component created with Zen Productivity design
- Dashboard page wires getDashboardStats → StatsCards
- revalidatePath("/dashboard") added to all mutating actions

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — Three metric cards rendered: Total Documents (countDocuments), Pending Revisions (nextReviewDate ≤ today), Total Completed (status = "completed").
- **AC2:** PASS — All three counts computed server-side in `getDashboardStats` Server Action using MongoDB queries. Dashboard page is a React Server Component.
- **AC3:** PASS — `revalidatePath("/dashboard")` called in `rescheduleAction`, `completeDocumentAction`, `addDocumentAction`. Next page visit re-fetches fresh stats.
- **AC4:** PASS — Zero values display "0" with encouraging sub-labels. No error or null states.

### Review Outcome
PASS

### Review Notes
The metrics implementation is clean and correct. Using three separate count queries rather than a complex aggregation pipeline improves readability with minimal performance impact. The revalidatePath pattern ensures consistency without requiring real-time WebSocket connections, which is appropriate for a revision scheduling app where immediate sub-second updates are not required.
