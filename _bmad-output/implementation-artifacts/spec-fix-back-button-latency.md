---
title: 'Fix Back Button Latency using React Suspense Boundaries'
type: 'bugfix'
created: '2026-05-02'
status: 'done'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Clicking the "Back" button or any link throughout the application causes a 5-6 second UI freeze. This happens because Next.js App Router blocks client-side navigation until the destination route's data fetching completely finishes, as there are no loading boundaries defined and no visual feedback for navigation.

**Approach:** 
1. Install and implement `nextjs-toploader` in the root `layout.tsx` to provide instant, app-wide visual feedback (a progress bar) the moment any link is clicked.
2. Introduce a `loading.tsx` file inside `src/app/(dashboard)` to act as a React Suspense boundary. This will cause Next.js to instantly transition the URL and show a loading skeleton on click, rather than freezing the current page while waiting for the server.

## Boundaries & Constraints

**Always:** Use standard Next.js `loading.tsx` conventions to create layout-level Suspense boundaries.
**Ask First:** Before modifying the database schema or using third-party caching libraries.
**Never:** Convert the dashboard Server Components into Client Components just to show a loading state.

</frozen-after-approval>

## Code Map

- `package.json` -- Add `nextjs-toploader` dependency.
- `src/app/layout.tsx` -- Add `<NextTopLoader />` to provide instant app-wide navigation feedback.
- `src/app/(dashboard)/loading.tsx` -- New file to define the global dashboard loading state.

## Tasks & Acceptance

**Execution:**
- [x] `terminal` -- Run `npm install nextjs-toploader`
- [x] `src/app/layout.tsx` -- Import and render `NextTopLoader` inside the `<body>` element. Configure it with the app's primary color (`#059669`) and set `showSpinner={false}`.
- [x] `src/app/(dashboard)/loading.tsx` -- Create a sleek, centered loading spinner/skeleton for the dashboard layout.

**Acceptance Criteria:**
- Given a user is on `/study/youtube`, when they click the "Back" button, then the UI instantly navigates and displays a loading state rather than freezing.

## Verification

**Manual checks:**
- Click the "Back" button on `/study/youtube` and verify the navigation feels instant.
