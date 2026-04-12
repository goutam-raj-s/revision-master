# Story 1.5: Admin Route Gating and Role-Based Access

Status: done

## Story

As an **admin user**,
I want the admin panel to be accessible only to users with the admin role,
so that sensitive administrative features are protected from regular users.

## Acceptance Criteria

1. A user with role `"admin"` can access `/admin` routes successfully.
2. A non-admin user navigating to `/admin` is redirected (to `/dashboard`) or shown a 403.
3. The `(admin)` route group uses a server-side layout guard that verifies the session role.
4. Middleware intercepts admin routes as a first-pass check.

## Tasks / Subtasks

- [x] Task 1: Implement `requireAdmin` in session module (AC: 2, 3)
  - [x] 1.1: Add `requireAdmin()` function to `src/lib/auth/session.ts`
  - [x] 1.2: `requireAdmin()` calls `requireSession()` first to ensure a valid session exists
  - [x] 1.3: If session exists but user role is not `"admin"`, call `redirect('/dashboard')`
  - [x] 1.4: If session valid and role is `"admin"`, return the session/user object
- [x] Task 2: Apply guard in admin layout (AC: 1, 2, 3)
  - [x] 2.1: Update `src/app/(admin)/layout.tsx` as a Server Component
  - [x] 2.2: Call `requireAdmin()` at the top of the layout — redirect is thrown automatically on failure
  - [x] 2.3: Render admin layout chrome (admin header, nav) for authorized users
- [x] Task 3: Create admin home page (AC: 1)
  - [x] 3.1: Create `src/app/(admin)/admin/page.tsx` with basic admin dashboard content
- [x] Task 4: Verify middleware handles admin routes (AC: 4)
  - [x] 4.1: Confirm `src/middleware.ts` matcher includes `/admin(.*)` in protected routes
  - [x] 4.2: Middleware handles the first-pass cookie check; layout handles role verification

## Dev Notes

- **Two-layer admin guard:** Middleware handles the first-pass check (is there a session cookie at all?). The `(admin)/layout.tsx` handles the second-pass check (does the session belong to an admin?). This separation is intentional: middleware cannot efficiently check roles without a DB lookup on every request; the layout check is authoritative and runs in a server context with full DB access.

- **Why not check role in middleware:** Checking role in middleware would require reading the session token from the cookie, looking up the session in MongoDB, then looking up the user record to read the `role` field. This adds two DB round-trips to every single request to any route — unacceptable latency for a Vercel serverless deployment. Instead, the layout guard does this check only once, on the initial admin page load.

- **`requireAdmin()` implementation:** The function in `src/lib/auth/session.ts` first calls `requireSession()` (which validates the cookie and session DB record). If that passes, it checks the `role` field on the returned user object. A role value other than `"admin"` triggers `redirect('/dashboard')` — Next.js's `redirect()` throws an internal `NEXT_REDIRECT` exception, so no explicit return is needed after the call.

- **Role storage:** The `role` field is stored directly on the `users` MongoDB document. Possible values: `"user"` (default for all new registrations) and `"admin"` (set manually in the DB or via a future admin management UI).

- **No admin UI for role assignment yet:** Assigning the `"admin"` role requires a direct MongoDB update in this iteration. This is acceptable for MVP — the first admin is seeded manually.

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Admin & Role-Based Access]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- No significant issues. The two-layer guard pattern is straightforward with Next.js App Router layouts.
- Confirmed that Next.js `redirect()` inside a Server Component layout correctly interrupts rendering and issues the redirect response without needing a try/catch.

### Completion Notes List
- Added `requireAdmin()` to `src/lib/auth/session.ts`: chains `requireSession()` then checks `role === "admin"`, redirecting to `/dashboard` on failure.
- Updated `src/app/(admin)/layout.tsx` as a Server Component that calls `requireAdmin()` before rendering admin chrome.
- Created `src/app/(admin)/admin/page.tsx` with placeholder admin dashboard content.
- Verified `src/middleware.ts` matcher includes `/admin` path prefix in protected route set.

### File List
- `src/lib/auth/session.ts` — updated: added `requireAdmin()` function
- `src/app/(admin)/layout.tsx` — admin route group layout: calls `requireAdmin()`, renders admin nav chrome
- `src/app/(admin)/admin/page.tsx` — admin home page with basic admin panel content

### Change Log
- Updated `src/lib/auth/session.ts`: added `requireAdmin()` that validates session then checks `role === "admin"`, calls `redirect('/dashboard')` on failure.
- Updated `src/app/(admin)/layout.tsx`: Server Component calling `requireAdmin()` at the top; renders admin chrome for authorized users.
- Created `src/app/(admin)/admin/page.tsx`: admin panel home page.

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — A user with `role: "admin"` in the users collection can access `/admin` and sees the admin layout and page content.
- **AC2:** PASS — A user with `role: "user"` (or any non-admin role) is redirected to `/dashboard` by `requireAdmin()` in the layout. No 403 response is issued — a silent redirect is the chosen behavior to avoid revealing what routes exist.
- **AC3:** PASS — `(admin)/layout.tsx` is a Server Component; `requireAdmin()` is called at the top of the component before any rendering, making it an effective layout guard.
- **AC4:** PASS — `src/middleware.ts` matcher includes `/admin(.*)` so the cookie presence check runs before the request reaches the layout layer.

### Review Outcome
PASS

### Review Notes
The two-layer admin guard is the correct architecture for Next.js App Router. The middleware provides a fast first-pass rejection for users with no session at all; the layout provides the authoritative role check. Redirecting non-admins to `/dashboard` rather than returning a 403 is a deliberate UX choice (and also avoids confirming that the `/admin` route exists to unauthorized users). Role seeding via direct DB manipulation is an acceptable MVP constraint — a future admin management story should address this.
