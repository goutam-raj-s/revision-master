---
title: 'Dashboard and Documents Sort/Filter'
type: 'feature'
created: '2026-05-04T03:14:00+05:30'
status: 'done'
baseline_commit: '91ab68edf7d2fe3ecf9e74cd83ce9c8fb2d2cc5c'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The dashboard revision queue lacks searching and sorting capabilities, making it difficult to find specific tasks. Both the documents page and the dashboard currently default to sorting by newest, but users expect the default sort to be by last modified.

**Approach:** Update `DocumentListClient` so its default sort order is `last-modified`. Update `TaskQueue` in the dashboard to include a search input and a sort order dropdown, mirroring the UX of the documents page, and implement client-side filtering and sorting for the dashboard tasks.

## Boundaries & Constraints

**Always:**
- Keep sorting and filtering logic client-side so it works immediately without server requests.
- Use the existing design language (e.g. `Input` with `Search` icon, native `<select>` with `border-border rounded-xl` classes) to match `DocumentListClient`.
- Both `TaskItem` (documents) and `YoutubeTaskItem` (YouTube sessions) must be correctly searched (by title, tags) and sorted.

**Ask First:**
- If we need to change how `getTaskQueue` fetches data from the database.
- If pagination needs to be added to the dashboard (currently tasks are rendered directly).

**Never:**
- Do not introduce new third-party dependencies for sorting.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Search empty | `""` | Show all tasks | N/A |
| Search mismatch | `"xyznonexistent"` | Show empty state (InboxZero or similar empty message) | N/A |
| Sort by last-modified | Select "Last Modified" | Tasks are ordered by `doc.updatedAt` / `session.updatedAt` descending | N/A |
| Mixed task types | A `TaskItem` and a `YoutubeTaskItem` | Search matches `doc.title` or `session.videoTitle`. Sort uses appropriate `updatedAt` | N/A |

</frozen-after-approval>

## Code Map

- `src/components/features/document-list-client.tsx` -- Update default `sortOrder` state to `"last-modified"`.
- `src/components/features/task-queue.tsx` -- Add state for search and sort, render search input and sort dropdown, and apply filtering/sorting to `initialTasks`.
- `src/types/index.ts` -- Reference for `AnyTaskItem` types for sorting/searching.

## Tasks & Acceptance

**Execution:**
- [x] `src/components/features/document-list-client.tsx` -- Change `useState("newest")` to `useState("last-modified")` for `sortOrder`.
- [x] `src/components/features/task-queue.tsx` -- Add `search` and `sortOrder` state (default `"last-modified"`).
- [x] `src/components/features/task-queue.tsx` -- Add UI for search input and sort select.
- [x] `src/components/features/task-queue.tsx` -- Apply `useMemo` to compute `filteredAndSortedTasks` based on search and sort.

**Acceptance Criteria:**
- Given I navigate to the dashboard or documents page, then the default sort order is "Last Modified".
- Given I type in the search bar on the dashboard, then the task list instantly filters by title and tags.
- Given I change the sort dropdown on the dashboard, then the task list re-orders correctly.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint` -- expected: Passes without errors
- `npm run build` -- expected: Builds successfully

## Suggested Review Order

**Default Sort Update**

- Update default state hook to set "last-modified" rather than "newest" as the initial fallback.
  [`document-list-client.tsx:77`](../../src/components/features/document-list-client.tsx#L77)

**Task Queue Filtering & Sorting**

- Integrate unified search and sort states with local storage persistence.
  [`task-queue.tsx:32`](../../src/components/features/task-queue.tsx#L32)

- Memoized client-side filtering and sorting for mixed standard and YouTube task items.
  [`task-queue.tsx:48`](../../src/components/features/task-queue.tsx#L48)

- Incorporate `Search`, `Input`, and native `select` controls to match the Document List UI.
  [`task-queue.tsx:111`](../../src/components/features/task-queue.tsx#L111)
