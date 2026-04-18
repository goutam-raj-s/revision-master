---
title: 'Local Video Player'
type: 'feature'
created: '2026-04-19'
status: 'done'
route: 'one-shot'
---

## Intent

**Problem:** The app had no way to play local video files; users needed a built-in player during study sessions without leaving the app.

**Approach:** Add a `/video` route with a client-side HTML5 video player that opens files via `URL.createObjectURL` — no upload or server involvement. Full player controls rendered as a custom overlay.

## Suggested Review Order

- [`src/components/features/video-player-client.tsx`](../../src/components/features/video-player-client.tsx) — full player component: file picker, video element, controls overlay, keyboard shortcuts
- [`src/app/(dashboard)/video/page.tsx`](../../src/app/(dashboard)/video/page.tsx) — route shell (server component)
- [`src/components/features/sidebar.tsx`](../../src/components/features/sidebar.tsx) — nav entry (`Film` icon, `/video` link)
