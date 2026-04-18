---
title: 'Persistent Music Player & Audio Library'
type: 'feature'
created: '2026-04-18'
status: 'done'
baseline_commit: 'b1dd6cf22b73a1e3cb8745d7f591dbe7d9ae4db8'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Audio files uploaded for revision play inline on a single study page and stop the moment the user navigates away — making background listening while reading docs, reviewing terminology, or watching YouTube impossible.

**Approach:** Introduce a Zustand audio-player store and a single persistent `<audio>` element mounted in the dashboard layout (never unmounted on navigation). A fixed Mini-Player bar docks at the bottom of every page. A full `/music` library page provides playlist management, favourites, recently played, and a rich Expanded Player overlay. All player state persists in-memory across navigation; volume and speed survive page refresh via `localStorage`.

## Boundaries & Constraints

**Always:**
- The `<audio>` element is mounted exactly once in `(dashboard)/layout.tsx` and never re-mounted. Navigation must not interrupt playback.
- All audio data (tracks, favourites, playlists, play counts) comes from the existing `documents` collection extended with new optional fields — no new collection for tracks.
- Playlists stored in a new `playlists` MongoDB collection (`{ _id, userId, name, trackIds[], createdAt, updatedAt }`).
- Zustand store is the single source of truth for player state; components read from it, never from local `useState` for player concerns.
- `isFavourite`, `playCount`, `lastPlayedAt` added as optional fields to `DbDocument`/`Document`.
- Sleep timer implemented client-side with `setTimeout`; no server involvement.
- Global keyboard shortcuts (Space, N, P, M, F, ←/→, ↑/↓) active whenever Mini-Player is visible and no `<input>` / `<textarea>` is focused.
- Volume and playback speed persisted to `localStorage` on change, restored on store init.

**Ask First:**
- If the user wants crossfade, waveform SVG generation, or colour-extracted theming — these are deferred; ask before adding scope.

**Never:**
- Do not re-mount the `<audio>` element on route change.
- Do not use the browser's native audio controls UI — build custom controls.
- Do not store queue state in the DB — queue is in-memory only.
- Do not block navigation waiting for audio state.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Navigate away while playing | User clicks Documents link mid-track | Playback continues; Mini-Player shows current track | — |
| Play unavailable track | Cloudinary URL returns 404 | "Track unavailable" shown in Mini-Player; auto-skip to next | If queue empty, stop and show toast |
| Empty library | User has no audio documents | `/music` shows empty state with upload CTA | — |
| Sleep timer expires | Timer reaches 0 | Playback pauses; toast "Sleep timer ended" | — |
| Queue end, no repeat | Last track finishes | Playback stops; Mini-Player stays visible with replay button | — |
| Repeat One | Single track ends | Same track restarts from 0 | — |
| Favourite toggle | User clicks heart | `isFavourite` flipped in DB; UI updates optimistically | Revert on DB error |

</frozen-after-approval>

## Code Map

- `src/store/audio-player.ts` — NEW: Zustand store; state: `{ queue, currentIndex, isPlaying, volume, isMuted, speed, repeatMode, shuffleMode, sleepTimerEndsAt }`; actions: `play`, `pause`, `next`, `prev`, `setQueue`, `playNow`, `playNext`, `addToQueue`, `seek`, `setVolume`, `toggleMute`, `setSpeed`, `setRepeat`, `setShuffle`, `setSleepTimer`
- `src/components/features/audio-engine.tsx` — NEW: client component rendered in layout; mounts `<audio ref>`, wires all HTMLAudioElement events to Zustand store (timeupdate, ended, error); no visible UI
- `src/components/features/mini-player.tsx` — NEW: fixed bottom bar; reads from Zustand; prev/play-pause/next, scrub bar, volume, heart, expand chevron
- `src/components/features/expanded-player.tsx` — NEW: full-screen overlay (dialog/sheet); all controls + Up Next queue panel + sleep timer UI + speed selector
- `src/app/(dashboard)/layout.tsx` — add `<AudioEngine />` and `<MiniPlayer />` as siblings after `<CommandPalette />`; add `pb-16` to `<main>` when player is active
- `src/app/(dashboard)/music/page.tsx` — NEW: server component; fetches user audio docs + playlists; renders `MusicLibraryClient`
- `src/components/features/music-library-client.tsx` — NEW: client component; tabs (All Tracks, Playlists, Favourites, Recently Played); track cards with context menu; search + sort
- `src/components/features/track-card.tsx` — NEW: individual track card with title, duration, play count, heart, context menu (Play Now / Play Next / Add to Queue / Add to Playlist / Favourite / Delete)
- `src/components/features/playlist-panel.tsx` — NEW: playlist detail view with ordered track list, drag-to-reorder (html5 drag API), rename, delete
- `src/types/index.ts` — extend `DbDocument`/`Document` with `isFavourite?`, `playCount?`, `lastPlayedAt?`; add `DbPlaylist`/`Playlist` types
- `src/lib/db/collections.ts` — add `getPlaylistsCollection()`, indexes; add `{ userId: 1, mediaType: 1 }` index on documents; update `serializeDoc`
- `src/actions/audio.ts` — NEW: `getUserAudioDocuments()`, `toggleAudioFavourite(docId)`, `recordPlay(docId)`, `createPlaylist(name)`, `addToPlaylist(playlistId, docId)`, `removeFromPlaylist(playlistId, docId)`, `reorderPlaylist(playlistId, trackIds[])`, `deletePlaylist(playlistId)`, `getUserPlaylists()`
- `src/components/features/sidebar.tsx` — add Music nav item (Music2 icon) linking to `/music`

## Tasks & Acceptance

**Execution:**
- [ ] `src/types/index.ts` -- add `isFavourite?`, `playCount?`, `lastPlayedAt?` to `DbDocument` and `Document`; add `DbPlaylist { _id, userId, name, trackIds: ObjectId[], createdAt, updatedAt }` and `Playlist { id, name, trackIds: string[], createdAt, updatedAt }` -- data model foundation
- [ ] `src/lib/db/collections.ts` -- add `getPlaylistsCollection()` with `{ userId: 1, createdAt: -1 }` index; add `{ userId: 1, mediaType: 1 }` index on documents; update `serializeDoc` to include new fields (defaults: `isFavourite: false, playCount: 0, lastPlayedAt: undefined`) -- collection setup
- [ ] `src/actions/audio.ts` -- implement all audio server actions; `recordPlay` updates `playCount + 1` and `lastPlayedAt: now`; `toggleAudioFavourite` flips the boolean; playlist CRUD validates ownership on every mutation -- audio data layer
- [ ] `src/store/audio-player.ts` -- Zustand store with full state + actions; `init()` restores volume and speed from localStorage; `next()` respects shuffleMode (Fisher-Yates index) and repeatMode; `setSleepTimer(minutes)` stores `Date.now() + minutes * 60000` as `sleepTimerEndsAt` -- player brain
- [ ] `src/components/features/audio-engine.tsx` -- `"use client"` component; uses `useRef<HTMLAudioElement>`; on mount wires `timeupdate → store.setCurrentTime`, `ended → store.next()`, `error → store.handleError()`; watches `store.currentTrack` and calls `audio.src = url` + `audio.play()`; watches `store.isPlaying` to call `play()`/`pause()`; renders nothing visible -- headless audio bridge
- [ ] `src/components/features/mini-player.tsx` -- fixed bottom bar `h-16 z-50`; hidden when `!store.currentTrack`; shows album-art avatar (colour-hash from title), title (marquee if long), prev/play-pause/next buttons, progress bar (click-to-seek), volume slider, heart toggle (calls `toggleAudioFavourite`), expand button -- persistent controls
- [ ] `src/components/features/expanded-player.tsx` -- full-screen sheet/dialog; large avatar, full controls, speed selector, repeat/shuffle toggles, sleep timer picker (presets + live countdown), Up Next list (ordered, click to jump, remove button) -- full player UI
- [ ] `src/app/(dashboard)/layout.tsx` -- import and render `<AudioEngine />` and `<MiniPlayer />`; add `data-player-active` class to `<main>` when player has a track loaded, giving it `pb-16` via Tailwind -- persistent mounting
- [ ] `src/app/(dashboard)/music/page.tsx` -- server component; calls `getUserAudioDocuments()` and `getUserPlaylists()`; renders `<MusicLibraryClient>` -- route entry point
- [ ] `src/components/features/music-library-client.tsx` -- tabs with shadcn-style tab switcher; All Tracks: track list/grid with search (client filter) and sort; Playlists: playlist cards; Favourites: filtered view; Recently Played: sorted by `lastPlayedAt` -- library UI
- [ ] `src/components/features/track-card.tsx` -- card with play button (calls `store.playNow`), title, duration (formatted), play count badge, heart toggle, context menu (radix DropdownMenu) with all queue/playlist actions -- track interaction unit
- [ ] `src/components/features/playlist-panel.tsx` -- playlist detail with HTML5 drag-to-reorder (`draggable`, `dragover`, `drop` events), calls `reorderPlaylist` on drop, `removeFromPlaylist` on remove -- playlist management
- [ ] `src/components/features/sidebar.tsx` -- add `{ href: "/music", label: "Music", icon: Music2 }` nav item after YouTube -- navigation entry
- [ ] `src/components/features/mini-player.tsx` -- add global `keydown` listener: Space=play/pause, N=next, P=prev, M=mute, F=favourite, ←/→=seek±10s, ↑/↓=volume±10%; guard: skip if `e.target` is input/textarea/[contenteditable] -- keyboard shortcuts

**Acceptance Criteria:**
- Given audio is playing, when the user navigates to /documents, then playback continues and the Mini-Player remains visible at the bottom.
- Given the Mini-Player is visible, when the user presses Space (not in an input), then playback toggles.
- Given the Mini-Player is visible, when the user presses N, then the next track in queue plays.
- Given a track plays to completion with Repeat One enabled, then the same track restarts.
- Given a user clicks heart on a track, then `isFavourite` is toggled in MongoDB and the Favourites tab reflects the change.
- Given a user sets a 15-minute sleep timer, when 15 minutes elapse, then playback pauses and a toast confirms.
- Given a Cloudinary audio URL returns an error, when the track is loaded, then Mini-Player shows "Track unavailable" and auto-advances to the next queued track.
- Given the user creates a playlist and adds 3 tracks, when they drag-to-reorder, then the new order persists after page refresh.

## Design Notes

**Colour-hash avatar:** In absence of album art, generate a deterministic background colour from `title.charCodeAt(0) % 360` as an HSL hue. Renders a circle with the first letter of the title. Consistent per track, zero async cost.

**Marquee title:** If Mini-Player title overflows its container, apply a CSS `@keyframes marquee` scroll animation (translate-x from 0 to -100%) on a 6s loop with 1s pause. Use `overflow: hidden` on the parent.

**Duration display:** Computed client-side from `<audio>.duration` on `loadedmetadata` event, stored in Zustand as `currentDuration`. Format as `M:SS` (under 1h) or `H:MM:SS`.

## Verification

**Commands:**
- `npm run build` -- expected: no TypeScript errors, build succeeds

**Manual checks:**
- Play a track → navigate to /documents → audio continues, Mini-Player visible
- Space/N/P/M/F keyboard shortcuts work from /documents page
- Sleep timer counts down and pauses at 0
- Playlist reorder persists after page refresh
- Unavailable Cloudinary URL: Mini-Player shows error and skips
