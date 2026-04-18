---
title: 'Auth — Forgot Password & OAuth Sign-In'
type: 'feature'
created: '2026-04-18'
status: 'done'
baseline_commit: '99da7610537c52351679718424c64565fb8cb982'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users have no way to recover a lost password, and sign-in is limited to email/password — no OAuth, creating friction that drives churn in a daily-use app.

**Approach:** Keep the existing MongoDB custom-session auth as the core. Add (1) a forgot-password flow: secure token stored in MongoDB + email sent via Nodemailer + Gmail SMTP; (2) OAuth sign-in for Google, GitHub, and Discord via a lightweight OAuth2 callback route that creates/finds users in the existing `users` collection and issues a standard `rm_session` cookie.

## Boundaries & Constraints

**Always:**
- All user records (OAuth and email/password) land in the existing `users` MongoDB collection.
- Sessions continue to use the existing `rm_session` cookie + `sessions` collection — no new session mechanism.
- OAuth users get `passwordHash: ""` in the DB; forgot-password is disabled for them (UI shows "Sign in with [provider]" instead).
- Password reset tokens expire after 1 hour and are single-use; token is deleted on use or expiry.
- Nodemailer uses Gmail SMTP via `GMAIL_USER` + `GMAIL_APP_PASSWORD` env vars (free, no paid API key).
- OAuth credentials (`GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, `DISCORD_CLIENT_ID/SECRET`) stored in env vars; all three providers configured.
- `DbUser` gains two new optional fields: `provider?: "email" | "google" | "github" | "discord"` and `providerAccountId?: string`.

**Ask First:**
- If an OAuth email matches an existing email/password account, ask before auto-linking — do not silently merge.

**Never:**
- Do not introduce Auth.js / NextAuth as a dependency — this keeps the session model simple.
- Do not expose reset tokens in URLs after they're used.
- Do not send password reset emails to OAuth-only accounts.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Forgot password — valid email | Registered email/password user submits forgot-password form | Reset email sent; generic success message shown regardless of whether email exists | Never reveal if email is registered |
| Forgot password — OAuth user | Email belonging to OAuth account submitted | Generic success message; no email sent | Same — no info leak |
| Reset password — valid token | User follows link within 1 hour, sets new password | Password updated, token deleted, user redirected to login | — |
| Reset password — expired/used token | Stale or already-used token in URL | Error page: "This link has expired. Request a new one." | Link to /forgot-password |
| OAuth sign-in — new user | First-time OAuth sign-in | User record created in MongoDB, session created, redirect to /dashboard | Provider error → redirect to /login?error=oauth |
| OAuth sign-in — returning user | Matching `providerAccountId` found | Existing user fetched, new session created | — |
| OAuth sign-in — email collision | OAuth email matches existing email/password account | HALT — show "An account with this email already exists. Sign in with email/password." | Do not auto-link |

</frozen-after-approval>

## Code Map

- `src/types/index.ts` — add `provider`, `providerAccountId` fields to `DbUser`; add `DbPasswordResetToken` interface
- `src/lib/db/collections.ts` — add `getPasswordResetTokensCollection()`, `ensureIndexes` for TTL on reset tokens
- `src/lib/email.ts` — NEW: Nodemailer transport configured from `GMAIL_USER` + `GMAIL_APP_PASSWORD`; `sendPasswordResetEmail(to, resetUrl)` function
- `src/actions/auth.ts` — add `forgotPasswordAction`, `resetPasswordAction`; add `oauthCallbackAction` helper
- `src/app/(auth)/forgot-password/page.tsx` — NEW: form with email input + submit
- `src/app/(auth)/reset-password/page.tsx` — NEW: form with new-password input, reads `token` from query param
- `src/app/api/auth/[provider]/route.ts` — NEW: GET handler that redirects to provider OAuth URL with state param
- `src/app/api/auth/[provider]/callback/route.ts` — NEW: GET handler that exchanges code for token, fetches user profile, creates/finds DB user, issues session cookie, redirects
- `src/app/(auth)/login/page.tsx` — add "Forgot password?" link + OAuth sign-in buttons (Google, GitHub, Discord)
- `src/app/(auth)/register/page.tsx` — add OAuth sign-in buttons
- `src/middleware.ts` — no change needed; `/api/auth/*` routes are public by default

## Tasks & Acceptance

**Execution:**
- [ ] `src/types/index.ts` -- add `provider`, `providerAccountId` to `DbUser`; add `DbPasswordResetToken { _id, userId, token, expiresAt, createdAt }` -- supports forgot-password and OAuth user creation
- [ ] `src/lib/db/collections.ts` -- add `getPasswordResetTokensCollection()`; add TTL index (`expiresAt`, expireAfterSeconds: 0) and unique index on `token`; add sparse unique index on `users.providerAccountId` -- ensures token expiry and no duplicate OAuth accounts
- [ ] `src/lib/email.ts` -- create Nodemailer transport using `GMAIL_USER`/`GMAIL_APP_PASSWORD`; export `sendPasswordResetEmail(to: string, resetUrl: string)` -- decoupled email sending, easy to swap transport later
- [ ] `src/actions/auth.ts` -- add `forgotPasswordAction`: generates crypto token, stores in `password_reset_tokens`, calls `sendPasswordResetEmail`; add `resetPasswordAction`: validates token (exists + not expired), updates `passwordHash`, deletes token -- full forgot/reset flow
- [ ] `src/app/(auth)/forgot-password/page.tsx` -- create page with email form using `forgotPasswordAction`; show generic success message after submit regardless of outcome -- prevents email enumeration
- [ ] `src/app/(auth)/reset-password/page.tsx` -- create page that reads `?token=` from URL; shows new-password form; calls `resetPasswordAction`; on success redirect to `/login`; on invalid token show error with link back to forgot-password -- full reset UX
- [ ] `src/app/api/auth/[provider]/route.ts` -- GET: validate `provider` ∈ {google, github, discord}; build OAuth authorization URL with `client_id`, `redirect_uri`, `scope`, random `state` stored in a short-lived cookie; redirect -- initiates OAuth flow
- [ ] `src/app/api/auth/[provider]/callback/route.ts` -- GET: validate `state` cookie, exchange `code` for access token, fetch user profile from provider API, run email-collision check, create or find `DbUser` (with `provider`/`providerAccountId`), call `createSession`, redirect to `/dashboard` -- completes OAuth flow
- [ ] `src/app/(auth)/login/page.tsx` -- add "Forgot password?" link below password field; add OAuth buttons (Google/GitHub/Discord) with divider above existing form; OAuth buttons link to `/api/auth/{provider}` -- full login page UX
- [ ] `src/app/(auth)/register/page.tsx` -- add same OAuth buttons block -- consistent auth entry points

**Acceptance Criteria:**
- Given a registered email/password user, when they submit forgot-password with their email, then they receive a reset email within 30 seconds and the success message is shown.
- Given a valid unexpired reset token URL, when the user sets a new password and submits, then the password is updated and they are redirected to `/login`.
- Given an expired or already-used token, when the user visits the reset URL, then an error page is shown with a link to request a new reset.
- Given a new user, when they click "Sign in with Google" and complete the OAuth flow, then a user record is created in MongoDB and they land on `/dashboard`.
- Given a returning OAuth user, when they sign in again, then no duplicate user record is created.
- Given an OAuth email that matches an existing email/password account, when the OAuth callback fires, then the user sees a collision error and is NOT logged in.

## Design Notes

**OAuth flow without Auth.js:**
Each provider uses standard Authorization Code flow. State param is a random hex stored as an HTTP-only cookie (`oauth_state`) to prevent CSRF. After callback, state cookie is cleared. Provider-specific profile endpoints: Google → `https://www.googleapis.com/oauth2/v2/userinfo`, GitHub → `https://api.github.com/user` + `/user/emails`, Discord → `https://discord.com/api/users/@me`.

**Email collision handling:**
On OAuth callback, if `profile.email` matches an existing user with `provider: "email"` (or no provider), reject the OAuth sign-in with a clear message. Do not auto-link to prevent account takeover via provider-side email-unverified flows.

## Verification

**Commands:**
- `npm run build` -- expected: no TypeScript errors, build succeeds
- `npm run dev` -- expected: server starts cleanly

**Manual checks:**
- Forgot-password email arrives with working reset link (test with real Gmail)
- OAuth sign-in with each provider completes and user appears in MongoDB `users` collection
- Expired token page shows error correctly
- OAuth collision scenario shows error, does not create session
