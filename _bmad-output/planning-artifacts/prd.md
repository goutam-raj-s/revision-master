---
stepsCompleted: ['step-01-init.md', 'step-02-discovery.md', 'step-02b-vision.md', 'step-02c-executive-summary.md', 'step-03-success.md', 'step-04-journeys.md', 'step-05-domain.md', 'step-06-innovation.md', 'step-07-project-type.md', 'step-08-scoping.md', 'step-09-functional.md', 'step-10-nonfunctional.md', 'step-11-polish.md', 'step-12-complete.md']
inputDocuments: [
  '/Users/gautam/Desktop/Projects/Revision-Master/_bmad-output/brainstorming/brainstorming-session-2026-04-11-11-52.md',
  '/Users/gautam/Desktop/Projects/Revision-Master/_bmad-output/planning-artifacts/product-brief-Revision-Master.md'
]
briefCount: 1
researchCount: 0
brainstormingCount: 1
projectDocsCount: 0
workflowType: 'prd'
classification:
  projectType: Web Application / Platform
  domain: EdTech / Personal Knowledge Management
  complexity: Medium
  projectContext: Greenfield
---

# Product Requirements Document - Revision-Master

**Author:** Gautam
**Date:** 2026-04-11

## Executive Summary

Learning isn't the problem; remembering is. Revision-Master acts as an active intelligence layer that transforms scattered, unstructured Google Docs into a structured, revisable knowledge graph. Instead of re-learning the same topics or losing track of past insights, users link their public Google Docs to the platform. By leveraging spaced repetition, intelligent tag management, and AI-driven terminology generation via the Gemini API, the platform schedules learning reviews at optimal intervals—ensuring that knowledge consolidates effectively without confining the user to a walled-garden application.

## Project Classification

- **Project Type:** Web Application / Platform
- **Domain:** EdTech / Personal Knowledge Management
- **Complexity:** Medium
- **Context:** Greenfield

## Success Criteria

### User Success
Users experience success when they break out of redundant learning loops. The critical "aha!" moments occur when the system proactively warns them, "You already have X docs on this topic," saving them time, or when a spaced-repetition task surfaces a forgotten concept exactly when their memory begins to fade. Success means users feel confident that their unstructured brain-dumps are securely mapped and scheduled for efficient recall.

### Business Success
Success for the platform is measured by engagement and consolidation:
- **High Task Clearance:** A high daily percentage of users clearing their "Upcoming/Pending Revision" task queues.
- **Merge Adoption:** Frequent and successful actioning of "similarity warnings," indicating users are actively consolidating knowledge.
- **Terminology Growth:** Steady expansion of user-generated or AI-generated terms inside the Terminology Graph.

### Technical Success
- **Semantic Accuracy:** Semantic search must accurately surface relevant documents and similarities even when exact keywords do not match.
- **AI Latency & Reliability:** The Gemini API integrations for terminology generation must return high-quality definitions with minimal latency.
- **Link Integrity:** Flawless ingestion and routing of public Google Doc URLs without breaking the user experience.

### Measurable Outcomes
- **Active Consolidation Rate:** Target 15% of detected duplicate topics resulting in user-driven merges within the first 3 months.
- **Retention Rate:** Target 40% week-over-week retention of users returning to clear their spaced-repetition task list.

## Project Scope & Phased Development

### MVP Philosophy & Approach
**Problem-Solving MVP:** Deliver the minimum set of features that solves the core "forgotten knowledge" problem. If a user can paste a link, get reminded to review it, and tag/note it, the core value loop is proven.
**Resource Requirements:** Solo developer with access to Gemini API. No team dependencies.

### MVP Feature Set (Phase 1)
**Core User Journeys Supported:**
- Journey 1 (Brain-Dump Capture): Full support — URL ingestion, scheduling, tagging, difficulty marking.
- Journey 2 (Consolidation): Partial support — Similarity warnings on creation via simple title/tag matching. Full merge UI deferred.

**Must-Have Capabilities:**
1. Google Doc URL ingestion with auto-title extraction
2. Configurable spaced-repetition scheduling (+n days from today, default 2 days)
3. Task list dashboard with filters: Today, Pending, Upcoming, All Docs
4. State tracking: First Visit → Revision → Updated → Completed
5. Tags and difficulty markers (Easy/Medium/Hard)
6. Independent Notes per document (stored in DB)
7. Basic search (title + tag based)
8. Learning dashboard with summary stats (total, pending, completed)

**Explicitly Deferred from MVP:**
- Full semantic similarity engine (use simple title/tag matching for v1 duplicate warnings)
- Gemini-powered Terminology auto-definition (manual term entry only for v1)
- Advanced semantic search (use keyword search for v1)
- Admin telemetry dashboard

### Post-MVP Features (Growth)
**Phase 2:**
- Gemini API integration for auto-definitions in Terminology section
- FSRS or SM-2 advanced Spaced Repetition Algorithm replacing simple +N scheduling
- "Quiz Me" Auto-Flashcards generation based on document contents
- Semantic auto-tagging and categorization via Gemini
- TL;DR Summarizations of documents for quick context
- Semantic search via vector embeddings
- Full similarity engine with merge/consolidation UI
- Interactive Split-Pane Workspace for side-by-side studying
- Built-in Pomodoro / Focus timer in the Split-Pane workspace
- Enhanced dashboard graphs including Heatmap & Streaks (Github style)

**Phase 3 (Vision & Expansion):**
- Expansion beyond Google Docs (Multi-format ingestion: Notion, PDFs, Web Articles)
- Browser extension for quick "1-Click Add"
- Reading progress tracking for massive documents
- Bi-directional linking ("Backlinks")
- Visual 2D Knowledge Graph View
- Adaptive spaced-repetition algorithm based on difficulty + completion history
- Public knowledge graph sharing / forking functionality.

### Risk Mitigation Strategy
- **Technical Risks:** The semantic engine is the highest-risk component. Mitigated by deferring it to Phase 2 so MVP ships early, substituting simple string/tag matching.
- **Market Risks:** Building for yourself first — if daily task clearance can't be sustained with your own tool, the concept needs rethinking.
- **Resource Risks:** Solo developer constraints mitigated by keeping Phase 1 strictly to 8 must-have features without AI dependencies natively blocking the critical path.

## User Journeys

### 1. Primary User — Capturing the Brain-Dump (Success Path)
**Persona:** Alex, a continuous-learning software engineer.
**Opening Scene:** Alex just read an article on Redis caching strategies and dumped raw notes into a new public Google Doc. He pastes the URL into Revision-Master.
**Rising Action:** The system fetches the document title ("Redis Cache Patterns") and asks, "When should we first review this?" Alex selects "+2 days", adds the tags "Backend" and "Redis", and sets difficulty to "Medium".
**Climax:** Two days later, "Redis" appears at the top of the "Pending Revision" queue. Alex opens it, highlights "Cache Stampede", and defines it via manual entry or Gemini API. The term is saved to his independent DB.
**Resolution:** Alex marks the revision as "Completed," scheduling the next review for "+7 days." The doc is a permanent node in the personalized learning graph.

### 2. Primary User — The Consolidation Moment (Edge Case)
**Persona:** Alex (5 months later).
**Opening Scene:** Forgetting about the original Redis document, Alex learns something new about Redis and creates a brand new Google Doc.
**Rising Action:** Alex pastes the new URL into Revision-Master. The semantic engine analyzes the title and contents against historical docs.
**Climax:** The UI flags a warning: *"You already have a document strongly related to this topic: 'Redis Cache Patterns' (created 5 months ago)."*
**Resolution:** Alex clicks "Merge." The system groups the new doc under the original "Redis Cache Patterns" node, consolidating new learnings organically without overwriting files.

### 3. System Admin — Scale and Reliability (Admin Path)
**Persona:** Sarah (Platform Operator / Developer).
**Opening Scene:** The user base is growing and Gemini API auto-definition requests are spiking. Sarah checks the Admin Dashboard.
**Rising Action:** Telemetry charts show the API nearing rate limits.
**Climax:** Sarah configures rate-limiting levers for free-tier users so the UI gracefully handles errors in the client, while bumping the API quota in the background.
**Resolution:** Costs are managed effectively without degrading the core functionality for enterprise/paid users.

## Functional Requirements

### Document & State Management
- **FR1:** User can add a public Google Doc URL; system automatically extracts and displays the title.
- **FR2:** User can view the rendered contents of any linked Google Doc within the application dashboard.
- **FR3:** User can assign a difficulty level (Easy/Medium/Hard) and delete document links.
- **FR4:** System will cache the last-known title and content snapshot for broken-link resilience.
- **FR5:** System explicitly tracks and displays document status (First Visit, Revision, Updated, Completed).
- **FR6:** System dynamically updates status based on active user interactions (e.g., finishing notes).

### Spaced Repetition Tasks
- **FR7:** User can configure initial review delays (default: 2 days) upon submission.
- **FR8:** System accurately populates documents into the active task list based on schedule dates.
- **FR9:** User can reschedule document availability (+N days) and permanently mark them completed to remove them.
- **FR10:** User can filter the task queue by: Today, Upcoming, All Docs.

### Notes, Tags, & Terminology
- **FR11:** User can securely create independent notes, custom tags, and terminology definitions mapped to specific documents.
- **FR12:** User can filter the whole repository by custom tags and browse a distinct Terminology interface.
- **FR13:** Notes and terms can be independently edited, marked as done, or rescheduled.

### Similarity & Search
- **FR14:** System actively compares new submissions against existing documents using titles and tags (Phase 1) or vector semantics (Phase 2).
- **FR15:** System displays warning banners during submission when duplicate or overlapping insights are detected.
- **FR16:** System provides keyword search on titles and tags, returning accurate result sets within 1 second.
- **FR17:** User can explicitly "Merge" logically overlapping URLs into unified topic trees.

### Dashboard Modules
- **FR18:** System generates core metrics: Total Documents, Pending Revisions, Total Completed.
- **FR19:** System aggregates metrics for "Most Repeated Topics" and "Least Revised Areas."
- **FR20:** User can explicitly securely provide and store a Gemini API key within their profile/settings.

### Advanced Learning Features (Phase 2 & 3)
- **FR21:** System generates automatic terminology glossaries via Gemini AI upon document submission.
- **FR22:** System generates contextual active-recall flashcards ("Quiz Me" mode).
- **FR23:** System provides auto-tag suggestions to prevent taxonomy duplication.
- **FR24:** System produces TL;DR summaries visible in the task queue preview.
- **FR25:** System incorporates an FSRS or SM-2 algorithm for precise exponential revision intervals.
- **FR26:** User can track learning streaks via a Git-style contribution heatmap.
- **FR27:** User can activate a built-in Pomodoro/Focus timer during document review.
- **FR28:** System supports multi-format ingestion (Notion, PDF) and provides a "1-Click Add" browser extension.
- **FR29:** System establishes bi-directional backlinks and renders an interactive visual knowledge graph.

## Non-Functional Requirements & Platform Standards

### Performance & Web Delivery
- **NFR1:** Initial page load time for the dashboard under 3 seconds on standard broadband.
- **NFR2:** Google Doc iframe fetching and client-ready rendering must complete within 5 seconds for typical files.
- **NFR3:** Keyword searches return in < 1 second; similarity checks during submission under 3 seconds.
- **NFR4:** Fully mobile-responsive layouts emphasizing task-clearance on the go, with desktop-first design for heavy reading. Browser targets: Modern Chrome/Firefox/Safari/Edge.

### Security, Privacy, & Compliance
- **NFR5:** User Gemini API keys are encrypted at rest and strictly omitted from all client-side network telemetry or public logs.
- **NFR6:** Mandatory transport layer security (HTTPS) for all authenticated sessions and API routing operations.
- **NFR7:** Full support for GDPR "Right to Erasure" policies for all user-generated graph data.
- **NFR8:** Complete separation between the platform and native Google Doc mutation—URL usage strictly honors public Read-Only principles in accordance with Google Terms of Service.

### System Architecture & Scalability
- **NFR9:** Graceful degradation on dead Google Docs using cached artifact history.
- **NFR10:** Phase 1 database schema natively structured for multi-tenant users allowing for multi-user expansion later.
- **NFR11:** Gemini API integrations defensively coded for timeouts, rate-limiting HTTP headers, and silent failovers.
- **NFR12:** Persistent queues guarantee that once scheduled, revision reminders are never silently skipped or lost.

### Accessibility Standards
- **NFR13:** All primary interactive elements adhere to WCAG 2.1 Level AA conformance criteria.
- **NFR14:** Standardized ARIA labels for task list actions and spaced repetition schedule manipulators.
- **NFR15:** Fully semantic DOM structure guaranteeing keyboard navigability across core workflows natively without mouse interaction.

## Domain-Specific Requirements

### Compliance & Regulatory
- **Student Privacy:** Should the application expand horizontally to minors/institutions, COPPA and FERPA scoping will be required. Explicitly out of scope for the solo-developer MVP.
- **Google Ecosystem Binding:** Maintaining strict policy compliance concerning automated access to web-published Google Documents.

## Innovation & Novel Patterns

### Strategic Value Drivers
1. **BYOS (Bring Your Own Storage) Spaced Repetition:** Unlike competitors (RemNote, Obsidan, Roam) that tightly couple learning intervals to proprietary flashcard containers, Revision-Master empowers spaced repetition workflows *over* natural, unstructured external assets.
2. **Pre-Emptive Consolidation Pipeline:** Running document-scale deduplication and theme matching strictly upstream upon creation protects the user from duplicating long-form notes prematurely—an intelligence leap over single-flashcard duplicate checks.
3. **In-Context AI Extraction:** Marrying natural document review with instantly generated AI definitions prevents passive-reading syndrome by converting highlights directly into indexable knowledge graphs.

### Market Validation
- By shipping the ingestion + manual scheduling core natively, user retention inside the single-player daily loop proves the initial value proposition ahead of the hefty vector embedding engineering required for automated Phase 2 consolidation.

---

## Feature Addendum — Phase 1.5 Enhancements

*Added: 2026-04-18. These features extend the shipped MVP to broaden content ingestion, improve authentication UX, and introduce YouTube-native study workflows.*

---

### Feature A: Authentication Overhaul — Supabase Auth with OAuth & Password Recovery

#### Background & Motivation
The current MVP uses basic credential auth. Users need a polished, trustworthy authentication experience to commit to long-term daily use. Forgotten passwords and friction at login are among the highest-churn triggers in productivity tools.

#### Solution
Migrate authentication entirely to **Supabase Auth** — a free, zero-paid-API-key service that handles the full auth lifecycle with data stored in the project's own Postgres database.

#### Key Requirements

**FR-A1 — Forgot Password Flow:**
- User can request a password reset from the login screen via their registered email.
- Supabase sends a secure time-limited reset link using its built-in email delivery (no third-party email service or paid key required).
- Reset link routes to an in-app `/auth/reset-password` page where the user sets a new password.
- Expired or already-used links show a clear error with a prompt to re-request.

**FR-A2 — OAuth Sign-In / Sign-Up:**
- Users can authenticate using any of the following OAuth providers via Supabase's OAuth integration:
  - Google
  - GitHub
  - Discord
  - (Extensible: Apple, Twitter/X, Notion, Slack — configurable via Supabase dashboard without code changes)
- OAuth flow is fully redirect-based; no tokens are exposed client-side.
- On first OAuth sign-in, a user record is created in the application's own DB (users table), linked to the Supabase auth UID.
- On subsequent OAuth sign-ins, the existing user record is fetched by UID — no duplicate accounts.

**FR-A3 — Session & Storage:**
- All user identity data (id, email, display name, avatar URL, provider) stored in the application's own Postgres DB, not solely in Supabase's internal auth schema.
- Sessions managed via Supabase's server-side session helpers (`@supabase/ssr`) compatible with Next.js App Router.
- JWT tokens refreshed transparently; users stay logged in across sessions without manual re-auth.

**FR-A4 — Account Settings:**
- Authenticated users can update their display name and avatar from a profile/settings page.
- Users who signed up via email/password can change their password from settings (requires current password confirmation).
- Users who signed up via OAuth are shown their linked provider and cannot set a password until they add one explicitly.

#### Non-Functional Requirements
- **NFR-A1:** Auth pages (login, register, forgot password, reset password) are fully accessible (WCAG 2.1 AA) with clear error states and loading indicators.
- **NFR-A2:** All auth routes are protected server-side; unauthenticated requests to protected pages redirect to `/login` with the intended path preserved as a `next` query param.
- **NFR-A3:** No user credentials or tokens logged anywhere in application logs or error reporting.

---

### Feature B: Universal File Ingestion — Audio, Video & Standard Files

#### Background & Motivation
The current system only queues Google Doc URLs for spaced revision. Users accumulate knowledge across diverse formats — recorded lectures, podcast episodes, PDFs, research papers, presentation slides. These assets should be first-class citizens in the revision queue, stored and managed identically to documents.

#### Solution
Extend the ingestion pipeline to accept any standard file type. Files are uploaded to the application's own storage (Supabase Storage, free tier), metadata stored in the DB, and the file entry participates in the spaced-repetition queue identically to a Google Doc entry.

#### Supported File Types (MVP)

| Category | Formats |
|---|---|
| Documents | PDF, DOCX, TXT, MD |
| Presentations | PPTX, KEY |
| Audio | MP3, M4A, WAV, OGG |
| Video | MP4, MOV, WEBM, MKV |
| Images | PNG, JPG, JPEG, GIF, WEBP |

#### Key Requirements

**FR-B1 — File Upload UI:**
- Upload entry point available from the same "Add Item" flow used for Google Doc URLs.
- User can drag-and-drop or click-to-browse to select a file.
- Multi-file upload supported (up to 5 files per batch upload).
- Upload progress indicator shown per file; errors (size exceeded, unsupported type) shown inline without disrupting other uploads.
- Maximum file size: 100 MB per file (configurable).

**FR-B2 — Storage & Metadata:**
- Files stored in Supabase Storage under a per-user scoped bucket path (`/user-{id}/files/`).
- DB record created per file with: original filename, storage URL, MIME type, file size, upload timestamp, user-assigned title (defaults to filename), tags, difficulty, and scheduled revision date.
- Files are private by default; access URLs are signed and time-limited.

**FR-B3 — Revision Queue Participation:**
- Uploaded files appear in the task list dashboard identically to Google Doc entries.
- All spaced-repetition scheduling logic (initial delay, reschedule, complete) applies equally.
- File type is surfaced visually in the task list (icon per category: document, audio, video, image).

**FR-B4 — In-App Viewing / Playback:**
- **Documents (PDF, TXT, MD):** Rendered inline in the study/detail panel using a PDF viewer or plain text renderer.
- **Audio:** HTML5 `<audio>` player embedded in the detail panel with playback controls (play/pause, scrub, speed control: 0.5×–2×).
- **Video:** HTML5 `<video>` player embedded in the detail panel with the same controls as audio plus fullscreen toggle.
- **Presentations (PPTX/KEY):** Displayed as a download link with thumbnail preview if possible; full in-browser rendering deferred to Phase 2.
- **Images:** Displayed inline in the detail panel.

**FR-B5 — Notes & Tags on Files:**
- All existing Notes, Tags, Terminology, and Difficulty features work identically on file-type entries.

**FR-B6 — File Management:**
- User can rename, re-tag, reschedule, or delete a file entry.
- Deleting a file entry removes both the DB record and the stored file from Supabase Storage.

#### Non-Functional Requirements
- **NFR-B1:** Upload requests are chunked for large files; UI remains responsive during background uploads.
- **NFR-B2:** File access URLs are never exposed publicly; always routed through signed Supabase Storage URLs with short TTLs.
- **NFR-B3:** Storage quota warnings surfaced to user when approaching free-tier limits.

---

### Feature C: YouTube Study Route — Watch & Annotate

#### Background & Motivation
YouTube is among the most-used learning platforms globally. Users regularly watch tutorials, lectures, and conference talks as part of their learning workflow. However, notes taken during YouTube sessions are scattered across external tools. Revision-Master should offer a native, distraction-reduced YouTube study environment where video and note-taking coexist, with notes stored in the DB and linked to the video for future retrieval and revision scheduling.

#### Design Philosophy
The video itself is **never stored** — only the YouTube URL and a reference ID are persisted. Notes, tags, timestamps, and revision schedules are stored entirely in the application DB and are the primary knowledge artifact.

#### Route Design
A dedicated route: `/study/youtube` (or `/youtube` at top-level nav).

The page is a **split-pane workspace**:
- **Left pane (60%):** Embedded YouTube player via the YouTube IFrame API.
- **Right pane (40%):** Note-taking panel with timestamped note capture.

The pane split should be resizable by the user (drag divider).

#### Key Requirements

**FR-C1 — Video Loading:**
- User pastes a YouTube URL (standard, shortened `youtu.be`, or embed format) into an input at the top of the page.
- System extracts the video ID, fetches the video title and thumbnail via YouTube oEmbed (no API key required — oEmbed is a free public endpoint).
- Player loads the video in the embedded IFrame.
- URL updates to `/study/youtube?v={videoId}` for shareable/bookmarkable state.

**FR-C2 — Embedded Player:**
- Full YouTube IFrame player with standard controls.
- Player supports: play/pause (keyboard shortcut: Space), seek, volume, fullscreen toggle, playback speed (0.5×–2×).
- The player does NOT autoplay on page load; user initiates playback.

**FR-C3 — Note-Taking Panel:**
- Notes panel is always visible alongside the player (not a modal, not a separate page).
- User can type free-form notes in a text area at any time during playback.
- **Timestamp capture:** A "📍 Add Timestamp" button (keyboard shortcut: `T`) captures the current video playback position and inserts a clickable timestamp marker into the note (e.g., `[12:34]`). Clicking the timestamp in the notes panel seeks the video to that position.
- Notes are saved automatically (debounced auto-save, 2-second delay after last keystroke).
- Notes panel shows the video title and thumbnail at the top for visual context.

**FR-C4 — DB Storage:**
- A `youtube_sessions` DB table stores: user ID, YouTube video ID, video title, video thumbnail URL, YouTube URL, notes content (text), tags, created at, updated at, scheduled revision date.
- The video file itself is never stored — only metadata and user-generated notes.

**FR-C5 — Revision Queue Integration:**
- YouTube sessions appear in the task list dashboard as a distinct entry type (YouTube icon).
- User can schedule a "re-watch reminder" via the same spaced-repetition scheduling system.
- Opening a scheduled YouTube entry from the task list navigates to `/study/youtube?v={videoId}` and restores the previous notes.

**FR-C6 — Session Management:**
- User can view all their YouTube sessions in a dedicated list view (`/study/youtube/history` or within the main doc list filtered by type).
- Sessions can be searched by video title or tags.
- Sessions can be deleted (removes DB record; no storage cleanup needed since video was never stored).

**FR-C7 — Add Without Watching:**
- User can add a YouTube URL directly from the main dashboard "Add Item" flow (same as adding a Google Doc or file), without navigating to the YouTube study route first.
- This creates the `youtube_sessions` record with no notes, allowing them to schedule a "watch later" reminder.

#### Non-Functional Requirements
- **NFR-C1:** YouTube IFrame API loaded asynchronously; page renders immediately, player hydrates after API is ready.
- **NFR-C2:** oEmbed fetch for video metadata cached in DB on first load to avoid repeated external calls.
- **NFR-C3:** The split-pane layout is fully responsive — on mobile, the player stacks above the notes panel (no side-by-side below 768px viewport width).
- **NFR-C4:** Timestamp links in notes are rendered as tappable elements on mobile, seeking the player correctly.
- **NFR-C5:** Auto-save indicator (subtle "Saving…" / "Saved ✓") visible in the notes panel to give users confidence their notes are persisted.

---

## Feature Addendum — Phase 1.6: Music & Audio Player

*Added: 2026-04-18. Transforms uploaded audio files into a first-class, always-available listening experience — a personal music layer woven into the study workflow.*

---

### Feature D: Persistent Audio Player with Music Library

#### Background & Motivation

Users upload audio files (lectures, podcasts, study music, ambient soundscapes) as revision items. But audio is fundamentally different from documents — it is consumed passively and continuously. Forcing users to navigate to a study page every time they want to play a track, and losing playback when they navigate away, makes audio a second-class citizen. A persistent, always-visible audio player that works in the background across every page — while the user reads docs, watches YouTube, or reviews terminology — is the right UX model. This is the standard users expect from Spotify, Apple Music, and YouTube Music.

#### Architecture: Persistent Player Layer

The player lives **outside the page routing tree** — mounted once in the root dashboard layout, never unmounted on navigation. Audio state (current track, queue, volume, position) is held in a React Context (`AudioPlayerContext`) accessible from any component in the app. This ensures true background playback: navigating between pages does not interrupt audio.

A **Mini-Player bar** is persistently docked at the bottom of the screen (above the mobile nav, below the desktop content area) whenever audio is loaded. It is always visible regardless of which page the user is on.

---

#### Route: `/music` — Music Library Page

A dedicated full-page music library, accessible from the sidebar as "Music". This is the audio-first experience — a rich interface for browsing, organizing, and playing audio content.

---

#### Key Requirements

**FR-D1 — Music Library Page (`/music`):**
- Displays all of the user's uploaded audio files in a rich grid/list view (user-toggleable).
- Each track card shows: title, duration, tags, difficulty, upload date, and album art (auto-generated from file metadata or a colour-hash avatar as fallback).
- Tabs at the top of the page:
  - **All Tracks** — complete audio library
  - **Playlists** — user-created playlists
  - **Favourites** — tracks the user has starred
  - **Recently Played** — last 20 distinct tracks played, in order
- Search bar filters tracks by title or tag in real time (client-side, no server round-trip for <500 items).
- Sort options: Recently Added, Title (A–Z), Duration, Most Played.

**FR-D2 — Full-Feature Audio Player:**

The player has two states: **Mini-Player** (always visible, docked to bottom) and **Expanded Player** (full overlay, triggered by clicking the album art or an expand chevron).

*Mini-Player (persistent, all pages):*
- Album art / colour avatar (40×40px)
- Track title + artist/source label (scrolls if truncated)
- **Previous track** button
- **Play / Pause** button (primary action, large hit target)
- **Next track** button
- Progress bar (scrubable, shows elapsed / total time)
- Volume slider
- **Heart (Favourite)** toggle
- Expand chevron → opens Expanded Player overlay

*Expanded Player (full-screen overlay):*
- Large album art / visualizer
- Track title, tags
- Full progress bar with timestamps
- Play/Pause, Previous, Next, Shuffle, Repeat (Off / Repeat All / Repeat One)
- Volume control with mute toggle
- Playback speed selector (0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×)
- **Sleep Timer**: set auto-stop after 15 / 30 / 45 / 60 / 90 minutes — ideal for studying
- **Add to Playlist** button
- **Favourite** toggle
- **Up Next** queue panel: shows the current playback queue, allows drag-to-reorder, remove, or clear
- Keyboard shortcuts displayed as tooltips (Space = play/pause, ← → = seek ±10s, N = next, P = previous, M = mute, F = favourite, S = open sleep timer)

**FR-D3 — Playlist Management:**
- User can create a named playlist from: the Playlists tab, a track's context menu, or the Expanded Player's "Add to Playlist" button.
- Playlist detail view shows ordered track list; user can drag-to-reorder, remove tracks, and rename or delete the playlist.
- **Smart Playlists (auto-generated, read-only):**
  - "Due Today" — audio files scheduled for revision today
  - "Unplayed" — audio files never opened
  - "Favourites" — mirrors the Favourites tab
  - These update dynamically; user cannot edit their contents.
- Playlist can be played from its first track or shuffled.
- Sharing playlists is out of scope for this phase.

**FR-D4 — Favourites:**
- Any track can be toggled as a Favourite from: the track card, the Mini-Player heart button, or the Expanded Player.
- Favourites are persisted in the DB (`audio_favourites` collection or a `isFavourite` field on the document record).
- The Favourites tab on `/music` shows all favourited tracks, sorted by most recently favourited.

**FR-D5 — Queue Management:**
- **Play Now** — replaces the current queue with the selected track and plays immediately.
- **Play Next** — inserts the selected track as the next item in the current queue.
- **Add to Queue** — appends the selected track to the end of the queue.
- **Play Playlist / Shuffle Playlist** — replaces queue with playlist contents (in order or shuffled).
- Queue state is preserved in React Context (in-memory); it does not need to survive page refresh.

**FR-D6 — Persistent Mini-Player Across All Pages:**
- Mini-Player is rendered in the dashboard layout shell, outside `<main>`, so it is never unmounted during client-side navigation.
- On desktop: docked as a fixed bottom bar (64px height), the main content area has `padding-bottom: 64px` to avoid overlap.
- On mobile: docked above the bottom navigation bar.
- When no audio is loaded or the queue is empty, the Mini-Player is hidden (zero height, no layout shift).
- Clicking a track title in the Mini-Player navigates to the track's study page (does not stop playback).

**FR-D7 — Track Context Menu:**
Available on right-click or long-press on any track card in the library or queue. Options:
- Play Now
- Play Next
- Add to Queue
- Add to Playlist → submenu of existing playlists + "New Playlist…"
- Toggle Favourite
- Go to Study Page (opens `/study/{docId}`)
- Reschedule Revision
- Delete (with confirmation)

**FR-D8 — Audio Bookmarks:**
- While a track is playing (from the Expanded Player or the study page), user can press `B` or click a Bookmark button to save a timestamped bookmark with an optional label.
- Bookmarks stored in DB alongside notes (`audio_bookmarks` collection or as a special note type with `noteType: "bookmark"`).
- Bookmarks visible in the track's study page sidebar and in the Expanded Player's info panel.
- Clicking a bookmark seeks playback to that position.

**FR-D9 — Recently Played & Play Count:**
- Every time a track starts playing, a `last_played_at` timestamp and `play_count` integer are updated on its document/media record.
- Recently Played tab shows the last 20 distinct tracks in reverse chronological order.
- Play count visible on each track card (small badge or tooltip).

**FR-D10 — Keyboard Shortcuts (global, active when Mini-Player is visible):**

| Key | Action |
|---|---|
| `Space` | Play / Pause (when not focused in an input) |
| `N` | Next track |
| `P` | Previous track |
| `M` | Mute / Unmute |
| `F` | Toggle Favourite on current track |
| `←` / `→` | Seek backward / forward 10 seconds |
| `↑` / `↓` | Volume up / down 10% |

**FR-D11 — Cross-Fade (optional, user-configurable):**
- User can enable a 2-second cross-fade between tracks in Settings → Music.
- When enabled, the outgoing track fades out over 2 seconds as the incoming track fades in.
- Default: off.

**FR-D12 — Sleep Timer:**
- Accessible from the Expanded Player and from the Mini-Player's overflow menu (···).
- Presets: 15 min, 30 min, 45 min, 60 min, 90 min, End of Track.
- Countdown shown in the Expanded Player and as a subtle badge on the Mini-Player.
- Timer auto-pauses playback when it expires; a toast confirms "Sleep timer ended."
- User can cancel the timer at any time.

---

#### Non-Functional Requirements

- **NFR-D1:** Audio playback must not be interrupted by client-side route transitions. The `<audio>` element is mounted once at the layout level and persists for the lifetime of the session.
- **NFR-D2:** Mini-Player renders within 50ms of layout mount (no async data needed beyond what's in Context).
- **NFR-D3:** Music library page loads track metadata in a single server fetch; client-side filtering/sorting is instant for up to 500 tracks.
- **NFR-D4:** AudioPlayerContext exposes a stable API so any component can call `play(track)`, `pause()`, `next()`, `prev()`, `addToQueue(track)`, `playNext(track)` without prop-drilling.
- **NFR-D5:** Sleep timer uses `setTimeout`; the exact elapsed time is displayed as a live countdown in the UI — does not require server-side scheduling.
- **NFR-D6:** All interactive elements in the Mini-Player meet WCAG 2.1 AA touch target size (44×44px minimum) for mobile usability.
- **NFR-D7:** Volume and playback speed preferences persisted in `localStorage` and restored on next session.
- **NFR-D8:** The player gracefully handles deleted/unavailable Cloudinary assets (shows "Track unavailable" in Mini-Player, skips to next in queue).

---

#### Delight & Convenience Features (Recommended for Implementation)

These are beyond the functional baseline but make the feature genuinely memorable:

1. **Colour-Extracted Theming:** When a track has album art (from audio file metadata), extract the dominant colour using a canvas pixel sample and apply it as a subtle gradient background to the Expanded Player. Creates a Spotify-like visual identity per track.
2. **Ambient Mode:** In the Expanded Player, a blurred, animated version of the album art fills the background (low-opacity). Gives the player a cinematic feel during long study sessions.
3. **"Study Mix" Smart Queue:** A one-tap button on the dashboard that auto-queues all audio files due for revision today, in difficulty order (Easy → Hard). Helps users combine active revision with passive listening in a single action.
4. **Waveform Preview:** On hover of a track card, show a static SVG waveform generated from the audio file's peak data (computed once on upload, stored in DB). Gives instant visual identity to each track.
5. **Continue Where You Left Off:** On page load (fresh session), if the user had a track paused, restore the last track + position from `localStorage` and show a "Continue listening?" prompt in the Mini-Player rather than auto-playing.
6. **Drag Tracks to Playlist:** In the Music library, user can drag a track card directly onto a playlist name in the sidebar to add it without opening a menu.
