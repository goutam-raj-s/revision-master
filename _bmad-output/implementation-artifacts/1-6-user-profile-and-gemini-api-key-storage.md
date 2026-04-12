# Story 1.6: User Profile and Gemini API Key Storage

Status: done

## Story

As a **user**,
I want to securely provide and store my Gemini API key in my profile settings,
so that AI-powered features can use my personal API key without exposing it.

## Acceptance Criteria

1. The Gemini API key is encrypted at rest in the Users MongoDB collection (NFR5).
2. The decrypted key is never included in client-side responses.
3. The stored key displays as masked in the UI (e.g., `sk-****...1234`).
4. The user can update or delete their stored Gemini API key.
5. Zod validation enforces the Gemini API key format before storing.

## Tasks / Subtasks

- [x] Task 1: Implement API key encryption/decryption (AC: 1, 2)
  - [x] 1.1: Add `encryptAES256GCM` and `decryptAES256GCM` to `src/lib/crypto/index.ts`
  - [x] 1.2: Derive 32-byte encryption key from `BETTER_AUTH_SECRET` env var
  - [x] 1.3: Store encrypted key as `iv:authTag:ciphertext` hex string in `users.geminiKeyEncrypted`
  - [x] 1.4: Ensure decrypted key is never returned to any client component or serialized to JSON
- [x] Task 2: Implement `maskApiKey` display helper (AC: 3)
  - [x] 2.1: Add `maskApiKey(key: string): string` function that returns first 3 chars + `****...` + last 4 chars
  - [x] 2.2: Return `null` or empty string if no key is stored
- [x] Task 3: Implement Server Actions for key management (AC: 4, 5)
  - [x] 3.1: Add `saveGeminiKeyAction` to `src/actions/auth.ts` (or a dedicated settings action file)
  - [x] 3.2: Zod schema validates key starts with `AIza` (Gemini key format) and meets minimum length
  - [x] 3.3: Action encrypts the key with AES-256-GCM, updates `users.geminiKeyEncrypted`, returns masked key
  - [x] 3.4: Add `deleteGeminiKeyAction` that sets `geminiKeyEncrypted` to `null` in the user document
  - [x] 3.5: `saveGeminiKeyAction` return type is `ActionResult<{ maskedKey: string }>` — used as `_prev` type in `useActionState`
- [x] Task 4: Build settings page (AC: 3, 4)
  - [x] 4.1: Create `src/app/(dashboard)/settings/page.tsx` as a Server Component
  - [x] 4.2: Fetch current user, compute masked key (if any), pass to client component
  - [x] 4.3: Create `src/components/features/settings-client.tsx` as a Client Component
  - [x] 4.4: Render Gemini API key input field, save button, delete button, masked key display
  - [x] 4.5: Use `useActionState` for save and delete actions with inline feedback

## Dev Notes

- **Encryption scheme:** AES-256-GCM with a random 16-byte IV per encryption. Output format: `<iv_hex>:<authTag_hex>:<ciphertext_hex>`. The GCM authentication tag ensures tamper detection. Encryption key is derived from the `BETTER_AUTH_SECRET` environment variable (expected to be a 32-byte hex string or similar high-entropy value).

- **Key masking:** `maskApiKey("AIzaSyABCDEF1234")` → `"AIz****...1234"`. Shows first 3 characters + `****...` + last 4 characters. If the key is shorter than 7 characters, it is fully masked.

- **useActionState type constraint:** `saveGeminiKeyAction` must return `ActionResult<{ maskedKey: string }>` (not `ActionResult<void>`) because the settings UI needs to display the new masked key immediately after saving without a full page reload. The `_prev` parameter in the `useActionState` callback must have the same type as the action's return type — using `undefined` or a different type causes a TypeScript error in React 19.

- **Server/client split:** `settings/page.tsx` is a Server Component that reads the session, fetches the user, computes the masked key, and passes it as a prop to `settings-client.tsx`. The client component handles all interactive state (form inputs, action submission, optimistic UI). This ensures the raw decrypted key never touches the client bundle.

- **Key never leaves the server:** The decrypt function is only called server-side when the key is needed to make a Gemini API call. The settings page only ever reads `users.geminiKeyEncrypted`, masks it on the server, and passes the masked string to the client.

- **Zod validation:** The key format schema checks that the value is a non-empty string starting with `AIza` (Google's standard prefix for Gemini/AI Platform API keys) with a minimum length of 20 characters. This provides format validation without making a live API call.

- **BETTER_AUTH_SECRET naming:** This env var name is inherited from the original `better-auth` plan and serves as the AES encryption key. It is kept as-is for config stability, but is a minor naming inconsistency to note.

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Security & NFRs]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- **useActionState return type:** Initial implementation used `ActionResult<void>` for `saveGeminiKeyAction`, which caused a TypeScript error in the settings client component where `_prev` was typed as `ActionResult<void>` but the UI needed access to `maskedKey` from the result. Fixed by changing the return type to `ActionResult<{ maskedKey: string }>` and threading the masked key through the action result.
- **Encryption key length:** `BETTER_AUTH_SECRET` is passed directly as the AES key buffer. If the secret is not exactly 32 bytes when encoded, Node.js throws `Invalid key length`. Added a `crypto.createHash('sha256').update(secret)` normalization step to always produce a 32-byte key regardless of input length.

### Completion Notes List
- Added `encryptAES256GCM` and `decryptAES256GCM` to `src/lib/crypto/index.ts` with SHA-256 key normalization.
- Added `maskApiKey` helper function to `src/lib/crypto/index.ts`.
- Added `saveGeminiKeyAction` and `deleteGeminiKeyAction` to `src/actions/auth.ts` (or settings actions file) with Zod validation, AES-256-GCM encryption, and masked key return.
- Created `src/app/(dashboard)/settings/page.tsx` as a Server Component that fetches user and passes masked key to client.
- Created `src/components/features/settings-client.tsx` as a Client Component with API key form, `useActionState`-driven save/delete, and inline feedback.

### File List
- `src/lib/crypto/index.ts` — updated: added `encryptAES256GCM`, `decryptAES256GCM`, `maskApiKey`
- `src/actions/auth.ts` — updated: added `saveGeminiKeyAction` (returns `ActionResult<{ maskedKey: string }>`), `deleteGeminiKeyAction`
- `src/app/(dashboard)/settings/page.tsx` — settings Server Component: session check, masked key fetch, renders settings-client
- `src/components/features/settings-client.tsx` — settings Client Component: Gemini key form, save/delete actions, masked key display

### Change Log
- Updated `src/lib/crypto/index.ts`: added AES-256-GCM encrypt/decrypt with SHA-256 key normalization; added `maskApiKey` display helper.
- Updated `src/actions/auth.ts`: added `saveGeminiKeyAction` with Zod format validation, AES-256-GCM encryption, masked key return; added `deleteGeminiKeyAction`.
- Created `src/app/(dashboard)/settings/page.tsx`: Server Component fetching user and pre-computing masked key for client.
- Created `src/components/features/settings-client.tsx`: interactive Gemini API key management form using `useActionState`.

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — Gemini API key stored in `users.geminiKeyEncrypted` as an AES-256-GCM ciphertext string (`iv:authTag:ciphertext`). Plaintext key never written to DB.
- **AC2:** PASS — `saveGeminiKeyAction` returns only `{ maskedKey: string }`; the decrypted key is never serialized or returned to the client. The settings page passes only the masked string to the client component.
- **AC3:** PASS — `maskApiKey()` produces the `sk-****...1234` style display (first 3 + `****...` + last 4). Displayed in the settings UI.
- **AC4:** PASS — `saveGeminiKeyAction` updates the encrypted key; `deleteGeminiKeyAction` sets `geminiKeyEncrypted` to `null`. Both are accessible from the settings UI.
- **AC5:** PASS — Zod schema in `saveGeminiKeyAction` validates that the key starts with `AIza` and meets minimum length. Invalid format returns a field-level error before any DB write.

### Review Outcome
PASS

### Review Notes
The server/client split is well-executed: all sensitive key operations (decrypt, encrypt, mask) occur server-side in Server Components and Server Actions; the client component only receives the masked string. The AES-256-GCM authentication tag provides tamper detection in addition to confidentiality. The SHA-256 key normalization fix is a necessary robustness improvement over the initial implementation. The `useActionState` type fix (returning `ActionResult<{ maskedKey: string }>` instead of `ActionResult<void>`) is a React 19 quirk that is correctly handled. NFR5 (key encryption at rest) is fully satisfied.
