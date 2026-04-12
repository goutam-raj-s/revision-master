# Story 1.3: User Registration and Login

Status: done

## Story

As a **user**,
I want to create an account and securely log in,
so that my documents, schedules, and settings are persisted and protected.

## Acceptance Criteria

1. Submitting valid credentials (email + password) creates a user record or establishes a session.
2. Sessions are managed with secure HTTP-only cookies.
3. Invalid credentials produce a clear, non-leaking error message (no confirmation of whether email exists).
4. After successful login, the user is redirected to the dashboard.

## Tasks / Subtasks

- [x] Task 1: Implement password hashing and session token crypto (AC: 1, 2)
  - [x] 1.1: Create `src/lib/crypto/index.ts` with `hashPassword`, `verifyPassword`, `generateToken`, and `encryptApiKey`/`decryptApiKey` functions
  - [x] 1.2: Use `crypto.scrypt` for password hashing (salt + hash stored together)
  - [x] 1.3: Use `crypto.randomBytes(32)` for session token generation
  - [x] 1.4: Use AES-256-GCM for Gemini API key encryption (keyed from `BETTER_AUTH_SECRET` env var)
- [x] Task 2: Implement session management (AC: 2)
  - [x] 2.1: Create `src/lib/auth/session.ts` with `createSession`, `getSession`, `deleteSession`, `requireSession`, and `requireAdmin`
  - [x] 2.2: Session stored in `sessions` MongoDB collection with `token`, `userId`, `expiresAt` fields
  - [x] 2.3: Session cookie named `rm_session`, HTTP-only, Secure, SameSite=Lax, 30-day expiry
  - [x] 2.4: TTL index on `sessions.expiresAt` handles automatic server-side expiry
- [x] Task 3: Implement registration and login Server Actions (AC: 1, 3, 4)
  - [x] 3.1: Create `src/actions/auth.ts` with `registerAction` and `loginAction`
  - [x] 3.2: Validate inputs with Zod (email format, password min length)
  - [x] 3.3: On registration: check for existing email, hash password, insert user, create session, set cookie, redirect
  - [x] 3.4: On login: look up user, verify password, create session, set cookie, redirect to `/dashboard`
  - [x] 3.5: Return generic error messages that do not confirm or deny email existence
- [x] Task 4: Build login and register pages (AC: 1, 3, 4)
  - [x] 4.1: Update `src/app/(auth)/login/page.tsx` with form using `useActionState`
  - [x] 4.2: Update `src/app/(auth)/register/page.tsx` with form using `useActionState`
  - [x] 4.3: Display field-level and form-level errors from action state
  - [x] 4.4: Show loading state while action is in-flight

## Dev Notes

- **DEVIATION — better-auth not used:** The original plan specified using the `better-auth` library. After evaluation, it was determined that `better-auth`'s setup complexity and opinionated session handling were not worth the overhead for this project's needs. A custom session management system was implemented instead, providing full control and zero external auth dependencies beyond Node.js built-ins.

- **Custom crypto stack:**
  - Passwords: `crypto.scrypt` (N=16384, r=8, p=1) — output stored as `salt:hash` hex string in `users.passwordHash`
  - Session tokens: `crypto.randomBytes(32).toString('hex')` — 64-character hex token stored in `sessions.token`
  - Gemini API key: AES-256-GCM, IV per encryption, stored as `iv:authTag:ciphertext` hex string

- **Session cookie:** `rm_session` — HTTP-only, Secure (in production), SameSite=Lax, `Max-Age` 30 days. The cookie value is the raw session token (not a JWT).

- **React 19 useActionState quirk:** The `_prev` parameter type in `useActionState` must exactly match the generic return type of the action. For auth actions returning `ActionResult<void>`, the `_prev` type must be `ActionResult<void>` — using `undefined` or `null` causes a TypeScript error.

- **Error message design:** Both login failures (wrong password) and lookup failures (email not found) return the identical message: "Invalid email or password." This prevents user enumeration attacks.

- **Environment variable:** `BETTER_AUTH_SECRET` is reused as the AES-256-GCM encryption key (32-byte hex). The name is kept for historical reasons since the architecture doc originally specified better-auth.

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- **better-auth pivot:** Attempted to integrate `better-auth` but encountered significant friction with its MongoDB adapter, session schema expectations, and Next.js App Router middleware integration. Decision made to implement custom session management using Node.js `crypto` built-ins — simpler, fully understood, zero additional dependencies.
- **useActionState type error:** React 19's `useActionState` hook requires `_prev` parameter type to exactly match the action's return type generic. Resolved by defining a shared `ActionResult<T>` type and using it consistently across action signatures and form component state.

### Completion Notes List
- Implemented `src/lib/crypto/index.ts` with scrypt password hashing, random token generation, and AES-256-GCM encryption/decryption for Gemini API keys.
- Implemented `src/lib/auth/session.ts` with full session lifecycle: create, get, delete, requireSession (redirects to login if no session), and requireAdmin (redirects to dashboard if not admin role).
- Implemented `src/actions/auth.ts` with Zod-validated `registerAction` and `loginAction` Server Actions.
- Updated `src/app/(auth)/login/page.tsx` and `src/app/(auth)/register/page.tsx` with `useActionState`-driven forms, error display, and loading states.

### File List
- `src/lib/crypto/index.ts` — `hashPassword`, `verifyPassword`, `generateToken`, `encryptAES256GCM`, `decryptAES256GCM`
- `src/lib/auth/session.ts` — `createSession`, `getSession`, `deleteSession`, `requireSession`, `requireAdmin`
- `src/actions/auth.ts` — `registerAction`, `loginAction` Server Actions with Zod validation
- `src/app/(auth)/login/page.tsx` — login form page with `useActionState`
- `src/app/(auth)/register/page.tsx` — registration form page with `useActionState`

### Change Log
- Replaced planned `better-auth` integration with custom session management using Node.js `crypto` built-ins.
- Created `src/lib/crypto/index.ts`: scrypt password hashing, random 32-byte token generation, AES-256-GCM API key encryption.
- Created `src/lib/auth/session.ts`: full session CRUD with `rm_session` HTTP-only cookie management and `requireAdmin` role guard.
- Created `src/actions/auth.ts`: Zod-validated register and login actions with generic error messages.
- Updated auth pages: `login/page.tsx` and `register/page.tsx` rebuilt with React 19 `useActionState`.

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `registerAction` creates a user record and establishes a session; `loginAction` verifies credentials and establishes a session.
- **AC2:** PASS — `rm_session` cookie is HTTP-only, Secure (production), SameSite=Lax, 30-day Max-Age. Session data lives in MongoDB, not the cookie.
- **AC3:** PASS — Both wrong-password and unknown-email cases return "Invalid email or password." — no enumeration possible.
- **AC4:** PASS — Successful `loginAction` calls `redirect('/dashboard')` via Next.js navigation.

### Review Outcome
PASS

### Review Notes
The pivot away from `better-auth` to custom session management is a deliberate and well-reasoned deviation. The implementation is secure: scrypt for passwords (better than bcrypt for GPU resistance), AES-256-GCM for API key encryption (authenticated encryption, no padding oracle risk), random 32-byte session tokens (sufficient entropy). The TTL index on the sessions collection means expired sessions are cleaned up automatically. The only inherited oddity is the `BETTER_AUTH_SECRET` env var name being reused as the AES key — functionally correct but slightly confusing; noted as technical debt.
