---
title: 'Fix dark mode surfaces'
type: 'bugfix'
created: '2026-07-21'
status: 'done'
route: 'one-shot'
---

# Fix dark mode surfaces

## Intent

**Problem:** Some UI surfaces used `forest-slate` as a dark background, but that token intentionally flips to a light foreground color in dark mode. This made the lostbae.com CTA/dashboard-adjacent surfaces render pale while white text remained applied.

**Approach:** Add a stable `ink` color token for truly dark backgrounds and migrate only surfaces, overlays, tooltips, and controls that require stable dark contrast.

## Suggested Review Order

1. [Theme token](../../src/app/globals.css) -- confirm `--color-ink` stays dark in both themes while foreground tokens continue to adapt.
2. [Landing CTA](../../src/app/page.tsx) -- confirm the screenshot issue is fixed by using `bg-ink` for the bottom CTA band.
3. [Overlay and tooltip surfaces](../../src/components/ui/tooltip.tsx) -- spot-check representative shared surfaces that use white text or dimming overlays.
4. [YouTube controls](../../src/components/features/youtube-study-client.tsx) -- confirm button base and hover states use the same stable background family after review patches.
