---
title: 'Fix Frontend Performance and Next.js DB Caching'
type: 'bugfix'
created: '2026-05-02'
status: 'done'
baseline_commit: 'NO_VCS'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Navigating the application and performing actions currently takes 5-10 seconds. This sluggishness severely degrades the UX and primarily stems from redundant database queries during Server Component rendering (which exhausts connection pools) and unoptimized development compilation.

**Approach:** Wrap critical authentication/user-fetching helpers (`getSession` and `getUserById`) with React's `cache()` to deduplicate MongoDB calls across the component tree. Optimize the Next.js dev server by adding the `--turbo` flag.

## Boundaries & Constraints

**Always:** Use `React.cache()` to memoize data-fetching functions called by Server Components. Maintain the Singleton pattern for the MongoDB client.

**Ask First:** If changing the Next.js configuration or altering the data fetching strategy entirely is required.

**Never:** Alter the database schema, rewrite the `better-auth` integration, or switch Server Components to Client Components just to fix performance.

</frozen-after-approval>

## Code Map

- `src/lib/auth/session.ts` -- Central location for `getSession()`. Needs to be wrapped with `React.cache()`.
- `src/lib/db/collections.ts` -- Central location for `getUserById()`. Needs `React.cache()`.
- `package.json` -- Add `--turbo` flag to the `dev` script.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/auth/session.ts` -- Import `cache` from `react` and wrap the exported `getSession` function to deduplicate execution during a single Server Component render pass.
- [x] `src/lib/db/collections.ts` -- Import `cache` from `react` and wrap the `getUserById` function to deduplicate database queries.
- [x] `package.json` -- Update `"dev": "next dev"` to `"dev": "next dev --turbo"` to ensure ultra-smooth development compilation.

**Acceptance Criteria:**
- Given a user navigates the application, when Server Components render, then `getSession()` queries the database exactly once per render tree.
- Given the application is running in dev mode, when `npm run dev` is executed, then Next.js starts with Turbopack.

## Verification

**Manual checks:**
- Run the dev server (`npm run dev`) and verify it starts with Turbopack.
- Navigate the app as a logged-in user and verify that pages load instantly (< 200ms) without hanging.

## Suggested Review Order

**Caching and Deduplication**

- Wrap getSession with React cache to deduplicate auth checks per render pass.
  [`session.ts:35`](../../src/lib/auth/session.ts#L35)

- Wrap getUserById with React cache to deduplicate database user fetches.
  [`collections.ts:252`](../../src/lib/db/collections.ts#L252)

**Development Experience**

- Add Turbopack flag to next dev for ultra-fast dev compilation.
  [`package.json:6`](../../package.json#L6)
