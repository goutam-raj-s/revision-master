# Deferred Work

Items surfaced during implementation review that are real issues but out of scope for the current stories.

---

## Rate limiting on forgot-password endpoint

**Source:** Review of spec-auth-forgot-password-oauth.md
**Finding:** `forgotPasswordAction` has no rate limiting. An attacker can send unlimited reset emails to any address. Needs middleware or Redis-based rate limiting (e.g. max 3 attempts per email per hour).
**Suggested approach:** Use Upstash Redis free tier + `@upstash/ratelimit` in the `/forgot-password` server action, or implement a simple in-DB attempt counter on `password_reset_tokens`.

---

## Timing-safe password comparison

**Source:** Review of existing `src/lib/crypto.ts`
**Finding:** `verifyPassword` uses string equality (`===`) for the final hash comparison. While bcrypt/scrypt's slowness dominates in practice, `crypto.timingSafeEqual` is the correct primitive for credential comparison.
**Fix:** Replace final comparison with `crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(derived))`.

---

## Password reset token leakage via email history

**Source:** Review of spec-auth-forgot-password-oauth.md
**Finding:** The reset URL (containing the token) is shown as plain text in the email body. If a user's email is compromised, historical emails expose valid tokens within their 1-hour window.
**Mitigations:** Reduce token TTL to 15–30 minutes; consider single-use click confirmation page that renders token invisible in history.

---

## Bug: Blank Study Page for Internal Documents

**Source:** User feedback
**Finding:** Internally created documents show a blank white page on `/study/` route while rendering fine on `/documents/`. Suspected cause: content typed in the app is saved as "notes" rather than document content. 

---

## yt-dlp Bot Error

**Source:** User feedback
**Finding:** Adding YouTube audio links fails with yt-dlp error "Sign in to confirm you're not a bot". Requires passing cookies or configuring OAuth. Deferred per user instruction if it couldn't be fixed immediately.
