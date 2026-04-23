---
status: done
---

# Feature: UI Enhancements and Filtering (Docs/Music)

## Goal
Implement dashboard "Pending" tab color changes, "Docs" media type filters, and "Music" revision filters for audio playability based on repetition due dates.

## Implementation Details

1. **Dashboard Pending Tab Color**
   - Modified `src/app/(dashboard)/dashboard/page.tsx`
   - Modified `FilterTabs` component to accept `pendingCount`. If the task queue filter tab is exactly "pending" and `pendingCount > 0`, its styling is highlighted in red/reddish hues `bg-red-500/10 text-red-600` when active, and `text-red-500/80` when inactive.

2. **Search bar & Media filters in Docs Tab**
   - Verified that `DocumentListClient` already contains a robust search bar.
   - Added `mediaFilter` state and a `<select>` dropdown next to the search input allowing the user to filter specifically by `google-doc`, `audio`, `video`, `pdf`, `image`.
   - Updated the filtering logic to properly account for the selected `Media Type`.

3. **Music filter (play today, 2 days, upcoming 3 days)**
   - Modified `src/types/index.ts` to attach an optional `nextReviewDate: string` property strictly for the client-facing UI.
   - Modified `src/actions/audio.ts` -> `getUserAudioDocuments` to perform an aggregate lookup on the `repetitions` collection to map this property into the returned frontend `Document`.
   - Modified `src/components/features/music-library-client.tsx` to include `revFilter` inside the 'tracks' and 'favourites' tabs, mapping options ("due today", "due in 2 days", etc) against the `nextReviewDate` payload.

## Review Notes
All changes were applied at once per user request without human-in-the-loop checkpoints. 
(Note: testing via MCP servers was requested, however direct MCP server testing action isn't available to the agent directly inside this workspace CLI context.)
