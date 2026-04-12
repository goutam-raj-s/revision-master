# Story 1.4: Protected Dashboard Shell and Route Groups

Status: done

## Story

As an **authenticated user**,
I want to see a personalized dashboard shell after login,
so that I have a central workspace to manage my documents and revisions.

## Acceptance Criteria

1. An authenticated user sees a layout shell with sidebar, header, and main content area.
2. Unauthenticated users accessing any dashboard route are redirected to `/login` via middleware.
3. Route groups `(auth)`, `(dashboard)`, and `(admin)` are correctly configured with their respective layouts.
4. The sidebar displays navigation links for Dashboard, Documents, and Settings.

## Tasks / Subtasks

- [x] Task 1: Implement middleware for session-based route protection (AC: 2)
  - [x] 1.1: Create `src/middleware.ts` that reads the `rm_session` cookie
  - [x] 1.2: Redirect unauthenticated requests to protected routes to `/login`
  - [x] 1.3: Redirect authenticated requests to `/login` or `/register` to `/dashboard`
  - [x] 1.4: Pass through requests to public routes (`/login`, `/register`, `/api/...`, `/_next/...`)
- [x] Task 2: Build dashboard layout (AC: 1, 3)
  - [x] 2.1: Update `src/app/(dashboard)/layout.tsx` as a Server Component
  - [x] 2.2: Call `requireSession()` to get the current user; redirect handled server-side on miss
  - [x] 2.3: Fetch all user documents and tags in the layout for sidebar context
  - [x] 2.4: Render `<Sidebar>` and main content slot
- [x] Task 3: Build sidebar client component (AC: 1, 4)
  - [x] 3.1: Create `src/components/features/sidebar.tsx` as a Client Component
  - [x] 3.2: Use `usePathname()` from `next/navigation` for active route highlighting
  - [x] 3.3: Render nav links: Dashboard (`/dashboard`), Documents (`/documents`), Settings (`/settings`)
  - [x] 3.4: Show user display name or email in sidebar header
- [x] Task 4: Build dashboard home page (AC: 1)
  - [x] 4.1: Create `src/app/(dashboard)/dashboard/page.tsx` with study queue summary and recent documents

## Dev Notes

- **Middleware scope:** `src/middleware.ts` uses Next.js `matcher` config to apply only to routes that need protection. Static assets (`/_next/static`, `/_next/image`, `/favicon.ico`) are explicitly excluded from matching. The middleware only checks for cookie presence — it does not do a DB lookup, so it is fast and does not add latency to every request.

- **Role check is NOT in middleware:** Admin role verification is intentionally deferred to the `(admin)/layout.tsx` server component (see Story 1.5). Doing role checks in middleware would require a DB lookup on every request (to read the `role` field from the session/user record), which would add unacceptable cold-start latency. The middleware guards the door; the layout guards the room.

- **Dashboard layout is a Server Component:** `(dashboard)/layout.tsx` calls `requireSession()` which reads the cookie and does a single DB lookup. If the session is invalid, `requireSession()` calls `redirect('/login')`. This provides a second layer of protection beyond middleware.

- **Data fetching in layout:** The dashboard layout fetches all user documents and tags in one place, passing them as props to the sidebar. This avoids multiple waterfalling fetch calls in child components.

- **Sidebar as Client Component:** The sidebar needs `usePathname()` for active route highlighting, which requires the Client Component directive. The parent layout passes all data as props so the sidebar does not need to fetch anything itself.

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Routing & Middleware]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- No significant issues. Standard Next.js App Router middleware + layout pattern.

### Completion Notes List
- Implemented `src/middleware.ts` with cookie-based route protection and redirect logic for auth/protected routes.
- Updated `src/app/(dashboard)/layout.tsx` as a Server Component with `requireSession()` call and data pre-fetching.
- Created `src/components/features/sidebar.tsx` as a Client Component with `usePathname` active route highlighting.
- Created `src/app/(dashboard)/dashboard/page.tsx` with dashboard home content.

### File List
- `src/middleware.ts` — Next.js middleware: checks `rm_session` cookie, redirects unauthenticated users to `/login`, authenticated users away from auth pages
- `src/app/(dashboard)/layout.tsx` — dashboard route group layout: `requireSession()`, data fetching, renders sidebar + main slot
- `src/components/features/sidebar.tsx` — client component sidebar with active route highlighting and nav links
- `src/app/(dashboard)/dashboard/page.tsx` — dashboard home page with study queue summary

### Change Log
- Created `src/middleware.ts`: cookie check, auth/protected route redirect logic, matcher config.
- Updated `src/app/(dashboard)/layout.tsx`: Server Component, `requireSession()`, document/tag pre-fetch, sidebar rendering.
- Created `src/components/features/sidebar.tsx`: Client Component, `usePathname`, nav links for Dashboard/Documents/Settings.
- Created `src/app/(dashboard)/dashboard/page.tsx`: dashboard home page.

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — Dashboard layout renders a sidebar (with nav links and user info), header area, and `{children}` main content slot.
- **AC2:** PASS — Middleware reads `rm_session` cookie; missing or expired cookie triggers redirect to `/login`. Verified by accessing `/dashboard` without a session.
- **AC3:** PASS — `(auth)`, `(dashboard)`, and `(admin)` route groups each have a distinct `layout.tsx`. Middleware and layout-level guards cooperate correctly.
- **AC4:** PASS — Sidebar renders links for Dashboard, Documents, and Settings with active state styling via `usePathname`.

### Review Outcome
PASS

### Review Notes
The two-layer protection model (middleware for fast cookie check + layout-level `requireSession()` for authoritative DB validation) is the correct Next.js pattern. It avoids the performance cost of DB lookups in middleware while still providing genuine server-side security. Data pre-fetching in the layout is a good architectural decision that keeps child components simple.
