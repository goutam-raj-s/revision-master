# UX & Convenience Practices Log

The following is a curated, up-to-date list of modern UX power features and convenience practices implemented across the **lostbae** application.

*Last updated: 2026-05-02 — reflects bulk actions, keyboard shortcuts audit, and Power UX feature status.*

---

## 1. Global Navigation & Layout

- **Clickable Brand Logo**: The sidebar logo links directly to `/dashboard`, returning home from anywhere.
- **Global Command Palette (`⌘K / Ctrl+K / /`)**: Triggers from anywhere; searches documents, tags, and navigates to primary routes. Glassmorphism backdrop, slide-up animation, keyboard hint footer.
- **Responsive Navigation**: Sidebar collapses to hamburger on mobile; backdrop tap closes it.
- **Active Navigation States**: Sidebar links dynamically highlight the current route.
- **Sticky Breadcrumb Header**: Every dashboard page shows a sticky top header with breadcrumbs (Dashboard > Documents > [Title]).

---

## 2. Bulk Actions

- **Multi-select Checkboxes**: Per-row checkboxes appear on hover; select-all in table header with indeterminate state when partially selected.
- **Floating Dark Action Bar**: Slides up from bottom when ≥1 document is selected. Contains: selection count · Export CSV · Delete N · Dismiss.
- **Export CSV**: Client-side CSV generation, instant download, no server round-trip.
- **Bulk Delete**: Server action `bulkDeleteDocumentsAction` — cascades deletion of notes, terms, repetitions, and Cloudinary assets with a confirmation dialog.

---

## 3. Keyboard Shortcuts

| Shortcut | Context | Action |
|---|---|---|
| `⌘K` / `Ctrl+K` | Global | Open Command Palette |
| `/` | Global | Open Command Palette |
| `Esc` | Modal / Palette | Close |
| `E` | Task Queue (expanded item) | Mark complete |
| `Ctrl+Enter` | Note / Term inputs | Submit |
| `Space` / `K` | Video player | Play/Pause |
| `←` / `→` | Video player | Seek 10s |
| `↑` / `↓` | Video player | Volume |
| `M` | Video player | Mute |
| `F` | Video player | Fullscreen |
| `Space`, `N`, `P`, `M`, `F`, `←→`, `↑↓` | Music player | Standard controls |
| `B` | Audio/YouTube player | Bookmark timestamp |
| `Enter` / `,` | Tag inputs | Add tag |

---

## 4. Forms & Inputs

- **Auto-focus**: Primary inputs in high-intent forms (`autoFocus`) — paste URL immediately on landing.
- **Clearable Search Bars**: Contextual `X` clear button appears only when text is present.
- **Submit on Enter**: All forms support `Enter` key submission.
- **Inline Validation**: URL, email, and required-field validation with contextual error messages on blur — input not wiped.
- **Show/Hide Password**: Eye toggle on login and register forms.
- **Tag autocomplete input**: Add tags with `Enter` or `,`; remove with `×` badge button.
- **Smart Defaults**: Difficulty defaults to `medium`; review delay defaults to `2 days`; URL params pre-populate filters.

---

## 5. Interactive Feedback & States

- **Disabled Loading States**: Submit buttons disable and show `Loader2` spinner while pending — no double-submit.
- **Toast Notifications**: Non-blocking bottom toasts for all success/error/info states.
- **Bouncy Hover Micro-animations**: `bouncy-hover` scale on buttons and cards.
- **Sweep-out Animation**: Task row slides right + fades when marked complete (`animate-sweep-out`).
- **Tooltips on Icon-only Buttons**: `<SimpleTooltip>` wraps every icon button across the entire app.

---

## 6. Safety & Fallbacks

- **Destructive Action Confirmations**: Single-delete and bulk-delete both require confirmation dialogs with irreversibility warnings.
- **Smart Empty States**:
  - `<InboxZero />` — when task queue is empty, calming "All caught up!" state with CTA.
  - Documents empty library — "Add your first document →" CTA button.
  - No-search-results — "Clear filters" CTA.
  - Notes/Terms sections — "No [items] yet. Add one!" placeholder.
  - Analytics — "Complete some reviews to see insights."
- **Graceful Error Boundaries**: `error.tsx` at route level; server action errors surface in toasts or inline alerts.
- **Broken Link Graceful Degradation**: Cached document title shown when Google Doc URL becomes inaccessible.

---

## 7. Performance UX

- **Background Prefetching**: High-priority nav links use `prefetch={true}` for near-instant transitions.
- **Deferred Heavy UI**: `RichTextEditor` and `PDFAnnotator` are `next/dynamic` lazy-loaded — page stays interactive while chunks download.
- **Skeleton Loading**: `<Skeleton>` components on document list and dashboard transitions — reduces perceived latency, prevents layout shift.
- **Auto-save (Debounced)**: Rich Text Editor auto-saves after 2 seconds of inactivity — no data loss.

---

## 8. Filtering & Search

- **Combo Filtering**: Search by keyword + filter by tag + filter by media type + sort order — all simultaneously, client-side (instant).
- **URL-persisted Filters**: Tag and search params survive page refresh and are shareable/bookmarkable (`?tag=x&search=y`).
- **Paginated Tables**: Documents list uses proper pagination (10 per page) with smart ellipsis.
- **Client-side Sort**: Newest / Oldest / A-Z / Z-A without any server round-trip.

---

## 9. Inline Editing (Partial — In Progress)

- ✅ Tags: add/remove inline on document detail (no reload).
- ✅ Difficulty: inline `<Select>` on document detail and glass modal.
- ✅ Notes: inline create/delete inside glass modal and document detail.
- ✅ Rich Text Editor with auto-save.
- ⚠️ Document title inline editing not yet implemented (navigates to detail page).

---

## 10. Export / Data Portability

- **Export CSV**: Bulk export selected documents with title, tags, status, difficulty, created date.
- **Export PDF**: From rich text editor via jsPDF + html2canvas.
- **PDF Annotator**: Highlight and save annotations to native PDF documents.

---

## 11. Role-based Access

- **Admin Route Gating**: `/admin` is middleware-protected — only `role: "admin"` users can access.
- **Admin Panel**: Platform-wide stats (user count, doc count, note count), system status indicators.
- **Regular User Isolation**: All data queries scoped to `userId` — users cannot access each other's data.

---

## 12. Progressive Disclosure

- **Task Row**: Collapsed (title + urgency dot) → expanded (full metadata, notes, reschedule buttons, actions).
- **Glass Modal**: Metadata sidebar opens on demand from task row.
- **Document Detail Tabs**: Notes / Terms tabs avoid overwhelming one view.
- **Music Player**: Mini-Player (collapsed) → Expanded Player (full).
- **Add Document Form**: Basic fields shown first; advanced options (initial delay, parent merge) revealed below.

---

## 13. Resizable Split Panes

- **Glass Modal Split View**: Drag the divider to resize the Google Doc iframe (default 70%) vs. metadata sidebar (default 30%). Preference persisted to `localStorage`.

---

## 14. Multi-context Players

- **Persistent Mini-Player**: Mounted in layout shell, never unmounted during navigation — audio never interrupts on route change.
- **Expanded Player**: Full-screen overlay with queue management, sleep timer, playback speed, volume.
- **YouTube Study Mode**: Split-pane YouTube player + notes/bookmarks sidebar.
- **Video Player**: Full-featured HTML5 video with keyboard controls, speed control, bookmark system.

---

## 🔲 Not Yet Implemented (Planned)

| Feature | Priority | Notes |
|---|---|---|
| Fuzzy search (typo-tolerant) | 🔶 Medium | Add `fuse.js` to command palette + document list |
| Activity Timeline | 🔶 Medium | New `activity_logs` collection + dashboard widget |
| Guided Onboarding | 🔶 Medium | 3-step banner for first-time users (0 docs) |
| `Ctrl+S` save shortcut | 🔴 Quick win | In `RichTextEditor` only |
| Undo / Soft-delete | 🔴 Quick win | `deletedAt` field + toast "Undo" button (5s window) |
| Global FAB (`+` button) | 🔴 Quick win | Floating "Add Document" from any page |
| Auto-refresh toggle | 🔴 Quick win | 30s `setInterval` on dashboard, user-controlled |
| Notifications Center | 🔶 Medium | Bell icon, `notifications` collection |
| Predictive tag suggestions | 🔶 Medium | Show matching existing tags as you type |
| Inline chart (review trend) | 🔶 Medium | `recharts` sparkline on dashboard |
| Saved filter presets | 🔶 Medium | Named views persisted in localStorage |
| Dashboard widget customization | 🔷 Low | Show/hide sections, localStorage |
| Multi-workspace | ⛔ Phase 2 | Requires schema changes |
| Presence indicators | ⛔ Phase 2 | Requires WebSocket layer |
