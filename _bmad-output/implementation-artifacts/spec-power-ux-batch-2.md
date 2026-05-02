---
title: 'Power UX Batch — Inline Edit, Activity Timeline, Onboarding, Charts, Persistent Filters'
type: 'feature'
created: '2026-05-02'
status: 'in-review'
baseline_commit: '7d85488655feecf14b9eed8648023267e8006a18'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Five high-impact UX features are missing from lostbae: (1) document titles can't be edited inline, (2) there's no activity history so users can't see what they've done, (3) new users with 0 documents have no guided starting point, (4) the analytics section shows only ranked text lists with no visual trend data, and (5) document list filter/sort preferences reset on every page load.

**Approach:** Implement all five features in their smallest effective form — no new backend services, no new routing. Inline title editing lands in the document detail server/client pair. Activity timeline uses the existing `updatedAt` field (no new collection). Onboarding is a client banner gated on `totalDocs === 0`. Charts use `recharts` for a weekly review sparkline. Persistent filters use `localStorage`.

## Boundaries & Constraints

**Always:**
- Use existing Radix/shadcn primitives and the project's CSS token system (no inline Tailwind colours).
- All server actions must call `requireAuth()` and use `revalidatePath`.
- Activity timeline must NOT add a new DB collection — derive it from existing document `updatedAt`, `createdAt`, and repetition `lastReviewedAt` fields.
- `recharts` must be added to `package.json` and lazy-loaded via `next/dynamic` (heavy bundle).
- Onboarding banner must be dismissable and store dismissal in `localStorage` so it doesn't re-appear.
- Persistent filters: only sort order and media-type filter persist; search query must NOT persist (too surprising).

**Ask First:**
- If the `updateDocumentTitleAction` server action conflicts with existing `updateDocumentAction` shape, halt and confirm whether to extend it or add a new one.
- If recharts version has peer dep conflicts with the current Next.js version, halt before installing.

**Never:**
- Add WebSockets or polling for the activity timeline — purely static derived data from existing documents.
- Show other users' activity — this is a single-user app; no multi-user presence.
- Persist the text search query in localStorage.
- Use a third-party onboarding library (Shepherd, Intro.js, etc.) — keep it to a simple in-app banner.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Inline title edit — happy path | User double-clicks title, types new title, presses Enter or clicks Save | `updateDocumentTitleAction` called, title updates in UI without reload | Toast error if save fails; revert to old title |
| Inline title edit — empty | User clears title and tries to save | Save blocked; input shows validation error "Title can't be empty" | No server call made |
| Inline title edit — Escape | User starts editing, presses Escape | Reverts to original title, exits edit mode | No server call made |
| Onboarding banner — first visit | `totalDocs === 0` and `localStorage` key `lostbae_onboarding_dismissed` absent | Banner renders above task queue | — |
| Onboarding banner — dismissed | User clicks X or "Got it" | Banner hidden; `lostbae_onboarding_dismissed=1` written to localStorage | — |
| Onboarding banner — returning user | `totalDocs > 0` | Banner never renders, even if localStorage key is absent | — |
| Chart — no review data | `reviewTrend` array is all zeros | Chart renders with flat zero line and "No reviews yet" caption | — |
| Persistent filter — first visit | No localStorage entry for sort | Default `newest` sort applied | — |
| Persistent filter — returning visit | `lostbae_doc_sort=a-z` in localStorage | Sort dropdown initialised to `a-z` | Ignore invalid stored values, fall back to `newest` |

</frozen-after-approval>

## Code Map

- `src/actions/documents.ts` — add `updateDocumentTitleAction(docId, title)`
- `src/actions/analytics.ts` — add `getReviewTrendAction()` returning last-7-days review counts
- `src/app/(dashboard)/documents/[docId]/page.tsx` — replace static `<h1>` with `<InlineTitleEditor>`
- `src/components/features/inline-title-editor.tsx` — NEW client component: double-click to edit title
- `src/app/(dashboard)/dashboard/page.tsx` — add `<OnboardingBanner>` and `<ReviewTrendChart>`
- `src/components/features/onboarding-banner.tsx` — NEW: 3-step guide, dismissable to localStorage
- `src/components/features/review-trend-chart.tsx` — NEW: dynamic recharts area chart, 7-day trend
- `src/components/features/document-list-client.tsx` — init sort/mediaFilter from localStorage; persist on change; add "last-modified" sort

## Tasks & Acceptance

**Execution:**

- [x] `src/actions/documents.ts` — add `updateDocumentTitleAction(docId: string, title: string): Promise<ActionResult>` — validates title non-empty (Zod), updates `{ title, updatedAt }`, revalidates `/documents` and `/documents/${docId}`
- [x] `src/actions/analytics.ts` — add `getReviewTrendAction()` — queries `repetitions` where `lastReviewedAt` is within last 7 days, groups by day, returns `{ day: string; count: number }[]` (7 entries, zero-padded for missing days)
- [x] `src/components/features/inline-title-editor.tsx` — create NEW component: static `<span>` matching h1 styling; double-click activates `<input>`; Enter/blur saves; Escape cancels; shows spinner during save; shows "Title can't be empty" if blank
- [x] `src/app/(dashboard)/documents/[docId]/page.tsx` — replace `<h1>{doc.title}</h1>` with `<InlineTitleEditor docId={doc.id} title={doc.title} />`
- [x] `src/components/features/onboarding-banner.tsx` — create NEW component: if `totalDocs > 0` return null; read localStorage; if dismissed return null; render 3-step guide with "Got it" + X dismiss buttons writing `lostbae_onboarding_dismissed` to localStorage
- [x] `src/components/features/review-trend-chart.tsx` — create NEW dynamic recharts AreaChart; accepts `{ day: string; count: number }[]`; height 120px; state-today fill; "No reviews yet" caption when all zeros
- [x] `src/app/(dashboard)/dashboard/page.tsx` — add `getReviewTrendAction()` to `Promise.all`; add `<OnboardingBanner totalDocs={stats.totalDocs} />` above `<StatsCards>`; add `<ReviewTrendChart data={trend} />` inside analytics section
- [x] `src/components/features/document-list-client.tsx` — read `lostbae_doc_sort` and `lostbae_doc_media` from localStorage on init; persist on change; add `"last-modified"` sort option (sort by `updatedAt` descending); validate stored values
- [x] Run `npm install recharts`

**Acceptance Criteria:**

- Given a document detail page, when the user double-clicks the title, then an editable input replaces the heading in place.
- Given the edit input is focused, when the user presses Escape, then the title reverts to the original and the input disappears.
- Given the edit input has a value, when the user presses Enter or clicks outside, then the title is saved and the heading updates without a page reload.
- Given the edit input is empty, when the user tries to save, then no server call is made and "Title can't be empty" appears inline.
- Given a user with 0 documents who has never dismissed the banner, when they visit the dashboard, then the onboarding banner is visible with 3 steps.
- Given the user clicks "Got it" or X, then the banner disappears and does not reappear on refresh.
- Given a user with 1+ documents, when they visit the dashboard, then the onboarding banner is not rendered.
- Given the dashboard analytics section with review data, when it loads, then a 7-day area chart is visible.
- Given no reviews in the last 7 days, when the chart renders, then it shows a flat line and "No reviews yet" caption.
- Given a user sets sort to "Last Modified" and media to "Audio", when they navigate away and return, then those settings are re-applied.
- Given a user types a search query, when they navigate away and return, then the search field is empty.
- Given the sort dropdown, when "Last Modified" is selected, then documents sort by `updatedAt` descending.

## Design Notes

**InlineTitleEditor** static display must match `className="text-2xl font-serif font-semibold text-forest-slate leading-snug"` exactly. Input uses the same font. On focus: `ring-2 ring-state-today/40`, no border otherwise.

**OnboardingBanner** — `bg-state-today/8 border border-state-today/20` inline card above StatsCards. Three steps as numbered badges. Dismissable with X and "Got it →" button. Not a modal.

**ReviewTrendChart** — `next/dynamic` with `ssr: false`. Area fill `#059669` at 20% opacity, stroke `#059669`. 7 day X-axis labels as Mon/Tue/Wed etc. derived from the data's `day` field.

**localStorage keys:**
- `lostbae_doc_sort` — one of: `newest` | `oldest` | `a-z` | `z-a` | `last-modified`
- `lostbae_doc_media` — one of: `""` | `"google-doc"` | `"audio"` | `"video"` | `"pdf"` | `"image"`

## Verification

**Commands:**
- `npx tsc --noEmit` — expected: 0 errors

**Manual checks:**
- Double-click document title → input appears; Escape → reverts; Enter → saves in-place
- Dashboard with 0 docs → banner shows; dismiss → gone on refresh
- Dashboard with docs → no banner
- Dashboard analytics → area chart shows with day labels
- Documents page → Last Modified sort option exists; sort + media persist on reload; search does not
