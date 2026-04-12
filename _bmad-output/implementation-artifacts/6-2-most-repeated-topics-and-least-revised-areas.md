# Story 6.2: Most Repeated Topics & Least Revised Areas

Status: done

## Story

As a **user**,
I want to see aggregated insights showing my "Most Repeated Topics" and "Least Revised Areas,"
So that I can identify knowledge strengths and gaps in my study habits.

## Acceptance Criteria

1. "Most Repeated Topics" shows top 5 tags ranked by total revision count across associated documents.
2. "Least Revised Areas" shows top 5 tags ranked by longest gap since last revision.
3. Each insight entry is clickable, navigating to the filtered document list for that tag.
4. Insights update after any task clearance or scheduling action.
5. Analytics section gracefully handles new users with fewer than 5 tags (show available data, no empty rows).

## Tasks / Subtasks

- [x] Task 1: getAnalyticsInsights function in analytics.ts (AC: 1, 2)
  - [x] 1.1: Most Repeated: $unwind tags → $group by tag → $sum reviewCount → $sort desc → $limit 5
  - [x] 1.2: Least Revised: $unwind tags → $group by tag → $min lastReviewedAt → $sort asc → $limit 5
  - [x] 1.3: Return { mostRepeated: TagInsight[], leastRevised: TagInsight[] }
- [x] Task 2: AnalyticsInsights component (AC: 3, 5)
  - [x] 2.1: Two sections: "Most Repeated Topics" and "Least Revised Areas"
  - [x] 2.2: Each entry as clickable pill → /documents?tag={tag}
  - [x] 2.3: Show available data even if fewer than 5 tags (no empty rows)
- [x] Task 3: Revalidation (AC: 4)
  - [x] 3.1: revalidatePath("/dashboard") in task actions covers analytics too

## Dev Notes

- **Most Repeated Pipeline:** `getDocumentsCollection().aggregate([{ $match: { userId } }, { $lookup: { from: "repetitions", ... } }, { $unwind: "$tags" }, { $group: { _id: "$tags", totalReviews: { $sum: "$repetition.reviewCount" } } }, { $sort: { totalReviews: -1 } }, { $limit: 5 }])`.
- **Least Revised Pipeline:** Similar but groups by `$min: "$repetition.lastReviewedAt"` and sorts ascending (oldest lastReviewedAt = least recently revised).
- **New User Handling:** `$limit 5` naturally returns fewer than 5 if user has fewer tags. Component renders however many are returned.
- **TagInsight Type:** `{ tag: string, count: number }` for most repeated; `{ tag: string, daysSinceReview: number }` for least revised.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2]
- [Source: _bmad-output/planning-artifacts/prd.md#FR19]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- $lookup aggregation used to join Documents with Repetitions for review count access.

### Completion Notes List
- getAnalyticsInsights implemented with two MongoDB aggregation pipelines
- AnalyticsInsights component renders two clickable insight sections
- New user handling: renders available data, no empty rows
- revalidatePath("/dashboard") covers analytics revalidation

### File List
- `src/actions/analytics.ts` — getAnalyticsInsights with two pipelines
- `src/components/features/analytics-insights.tsx` — two-section insight display
- `src/app/(dashboard)/dashboard/page.tsx` — mounts AnalyticsInsights

### Change Log
- getAnalyticsInsights added to analytics.ts
- AnalyticsInsights component created
- Dashboard page renders AnalyticsInsights below StatsCards

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — Most Repeated aggregation: unwind tags, group by tag summing reviewCount, sort descending, limit 5. Returns top 5 tags by review frequency.
- **AC2:** PASS — Least Revised aggregation: unwind tags, group by tag with min lastReviewedAt, sort ascending (longest gap first), limit 5.
- **AC3:** PASS — Each insight entry rendered as a link to `/documents?tag={tag}`. Clicking navigates to filtered document list.
- **AC4:** PASS — `revalidatePath("/dashboard")` in task-mutating actions causes dashboard re-fetch including analytics data.
- **AC5:** PASS — `$limit 5` returns however many tags exist. Component renders all returned results without empty row placeholders.

### Review Outcome
PASS

### Review Notes
The aggregation pipelines correctly implement the product requirements for Most Repeated and Least Revised insights. The $lookup join between Documents and Repetitions is necessary to access reviewCount data. For large document sets, adding an index on `userId + tags` would improve aggregation performance, but is not required at Phase 1 scale.
