---
title: 'Share Document Feature'
type: 'feature'
created: '2026-05-31'
status: 'done'
baseline_commit: 'cf811e00f260e2f8452fd18b88111229bc0d42f5'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Documents have no sharing mechanism — there is no way to give someone access to a document without giving them your account credentials.

**Approach:** Add a share token system. The owner creates a share (public or email-restricted by token link) on any document. The token covers that document and all its recursive sub-pages. Visitors land on `/shared/[token]` without needing an account; clicking a document outside the shared tree redirects to `/register`.

## Boundaries & Constraints

**Always:**
- A share token is tied to the root document at creation time. All recursive descendants are automatically included.
- Visitors viewing a shared page are never required to log in unless they navigate to a document not covered by the share.
- Email share type still uses a link (the token IS the access key); the email simply delivers that link to the recipient.
- Revoking a share token immediately makes `/shared/[token]` return a 404-style "link expired" view.
- `requireAuth()` must never be called on the public shared page or its server actions.

**Ask First:**
- Should share tokens expire? (No expiry implemented now unless user confirms.)
- Should email-shared docs be accessible to anyone with the link, or only to the invited email? (Default: anyone with the link, since we can't verify email without login.)

**Never:**
- Do not add authentication to the `/shared/[token]` route.
- Do not modify the existing dashboard document routes or their auth guards.
- Do not send raw document content to unauthenticated users via API routes — render server-side only.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create public share | Owner clicks Share → Public → Copy Link | Token created in DB; shareable URL copied to clipboard | Toast error if DB write fails |
| Create email share | Owner selects Email, enters addresses, clicks Send | Token created; email sent to each address with link | Toast error if email fails; token still created |
| Viewer opens valid share link | GET `/shared/[token]` | Document content rendered without auth prompt | — |
| Viewer clicks sub-page within share tree | Sub-page docId is a descendant of shared root | Navigate to `/shared/[token]?page=[subDocId]` | — |
| Viewer clicks a doc outside share tree | Link to a sibling/parent not covered by token | Redirect to `/register?from=/shared/[token]` | — |
| Invalid or revoked token | GET `/shared/[token]` | Show "Link expired or not found" message (no 500) | — |
| Owner revokes share | Clicks Revoke in Share modal | Token deleted; all visitors get "expired" view immediately | Toast confirmation |
| Duplicate share | Owner opens Share modal when share already exists | Modal shows existing link + Revoke option instead of create form | — |

</frozen-after-approval>

## Code Map

- `src/types/index.ts` — add `DbDocumentShare` (Mongo shape) and `DocumentShare` (serialized)
- `src/lib/db/collections.ts` — add `getDocumentSharesCollection()` + `getShareByToken(token)`
- `src/lib/email.ts` — add `sendDocumentShareEmail(to, shareUrl, docTitle)`
- `src/actions/shares.ts` — new file: `createShareAction`, `revokeShareAction`, `getDocShareAction`
- `src/middleware.ts` — add `/shared` to `PUBLIC_PATHS`
- `src/app/shared/[token]/page.tsx` — new public page: resolve token → render doc
- `src/components/features/share-modal.tsx` — new modal: Public / Email tabs, copy-link, revoke
- `src/components/features/share-button.tsx` — replace clipboard logic with modal trigger

## Tasks & Acceptance

**Execution:**
- [x] `src/types/index.ts` — add `DbDocumentShare` and `DocumentShare` interfaces (fields: `_id`, `token`, `docId`, `ownerId`, `shareType: "public"|"email"`, `emails?`, `createdAt`) and export them
- [x] `src/lib/db/collections.ts` — add `getDocumentSharesCollection()` accessor and a `getShareByToken(token)` helper that returns the `DbDocumentShare` or null
- [x] `src/lib/email.ts` — add `sendDocumentShareEmail(to: string, shareUrl: string, docTitle: string)` following the same nodemailer pattern as `sendPasswordResetEmail`
- [x] `src/actions/shares.ts` — create with three server actions:
  - `createShareAction(docId: string, shareType: "public"|"email", emails?: string[]): ActionResult<{token: string}>` — requires auth, verifies doc ownership, generates crypto token, inserts share doc, sends emails if type=email
  - `revokeShareAction(token: string): ActionResult` — requires auth, verifies token ownership, deletes share doc
  - `getDocShareAction(docId: string): ActionResult<{token: string; shareType: string; emails?: string[]} | null>` — requires auth, returns existing share for this doc's root (or null)
- [x] `src/middleware.ts` — add `/shared` to `PUBLIC_PATHS` array
- [x] `src/app/shared/[token]/page.tsx` — new server component: look up share by token (no auth); if missing, render "Link expired" card; load root doc + all descendants using existing `getDocumentTree`; accept optional `?page=[docId]` query param to render a sub-page; render document content (native-doc → Tiptap read-only view, google-doc → iframe embed, pdf → PDF viewer) with a sidebar listing sub-pages as `/shared/[token]?page=[id]` links; non-owned adjacent docs must not appear in nav
- [x] `src/components/features/share-modal.tsx` — new Dialog component with two tabs: "Public Link" (copy-link button) and "Email" (multi-email input + Send button); if a share already exists, show current link + Revoke button; calls `createShareAction` / `revokeShareAction` / `getDocShareAction`
- [x] `src/components/features/share-button.tsx` — replace current clipboard handler with a state-driven opener for `ShareModal`; pass `docId` prop (add to interface); keep visual appearance identical

**Acceptance Criteria:**
- Given an authenticated owner on `/documents/[docId]`, when they click Share, then a modal appears with Public Link and Email tabs.
- Given the owner selects Public and clicks Copy Link, when the action succeeds, then a URL of the form `[origin]/shared/[token]` is in their clipboard and a success toast fires.
- Given the owner enters one or more emails and clicks Send, when the action succeeds, then each address receives an email containing the share link, and the modal shows the generated link.
- Given a visitor navigates to `/shared/[token]` with a valid token, when the page loads, then the document content is visible and no login prompt appears.
- Given a valid share with sub-pages, when a visitor clicks a sub-page link in the sidebar, then they navigate to `/shared/[token]?page=[subDocId]` and see that page's content — still without auth.
- Given a visitor on a shared page clicks a document link not covered by the share token, then they are redirected to `/register?from=/shared/[token]`.
- Given the owner revokes the token, when a visitor (or the owner) loads `/shared/[token]`, then they see a "Link expired or not found" message.

## Spec Change Log

## Design Notes

The share token is stored in a separate `document_shares` collection rather than on the document itself to allow multiple share configs per document in future and clean revocation without mutating the document record.

Sub-page navigation inside the shared context always stays within `/shared/[token]?page=...` — never crosses back to `/documents/[id]` — to ensure the unauthenticated visitor never hits an auth-guarded route accidentally.

`getDocumentTree` already exists in `collections.ts`; the shared page reuses it directly (passing the ownerId from the share record, not a session user).

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: zero type errors

**Manual checks (if no CLI):**
- Open `/shared/[token]` in an incognito window → document renders, no redirect to login
- Click a sub-page link → stays on `/shared/[token]?page=...`, content switches
- Revoke token in modal → incognito tab refresh shows "Link expired"
- Enter invalid token in URL → "Link expired" message, no 500

## Suggested Review Order

**Core share logic (entry point)**

- Share actions: auth guard, root-doc resolution, token creation and revocation
  [`shares.ts:1`](../../src/actions/shares.ts#L1)

**Public access boundary**

- Middleware: /shared added to PUBLIC_PATHS — no auth cookie required
  [`middleware.ts:4`](../../src/middleware.ts#L4)

- Shared page: token lookup → doc render → sub-page nav without auth
  [`page.tsx:1`](../../src/app/shared/%5Btoken%5D/page.tsx#L1)

- ObjectId validation guard before `new ObjectId(pageDocId)` — prevents 500 on bad input
  [`page.tsx:65`](../../src/app/shared/%5Btoken%5D/page.tsx#L65)

**UI bindings**

- ShareModal: Public/Email tabs, copy-link, revoke, loading states
  [`share-modal.tsx:1`](../../src/components/features/share-modal.tsx#L1)

- ShareButton: now opens modal instead of clipboard copy
  [`share-button.tsx:1`](../../src/components/features/share-button.tsx#L1)

**Supporting types & DB**

- DbDocumentShare and DocumentShare types
  [`index.ts:339`](../../src/types/index.ts#L339)

- Collection accessor + getShareByToken helper
  [`collections.ts:101`](../../src/lib/db/collections.ts#L101)

- Email helper: sendDocumentShareEmail
  [`email.ts:14`](../../src/lib/email.ts#L14)
