# lostbae — Complete Feature Specification

> Every feature, micro-interaction, hover state, and behavioral detail catalogued from source code.
> Organized by page/section. Last updated: 2026-05-29.

---

## Table of Contents

1. [Global / Shared Shell](#1-global--shared-shell)
2. [Auth Pages](#2-auth-pages)
3. [Dashboard Page `/dashboard`](#3-dashboard-page-dashboard)
4. [Documents List Page `/documents`](#4-documents-list-page-documents)
5. [Document Detail Page `/documents/[docId]`](#5-document-detail-page-documentsdocid)
6. [Add Document Page `/documents/new`](#6-add-document-page-documentsnew)
7. [Create Native Doc Page `/documents/create`](#7-create-native-doc-page-documentscreate)
8. [Study Page `/study/[docId]`](#8-study-page-studydocid)
9. [YouTube Study Page `/study/youtube`](#9-youtube-study-page-studyyoutube)
10. [Udemy Study Page `/study/udemy`](#10-udemy-study-page-studyudemy)
11. [Music Library Page `/music`](#11-music-library-page-music)
12. [Video Player Page `/video`](#12-video-player-page-video)
13. [Terminology Page `/terminology`](#13-terminology-page-terminology)
14. [Settings Page `/settings`](#14-settings-page-settings)
15. [Admin Page `/admin`](#15-admin-page-admin)
16. [Chrome Extension](#16-chrome-extension)

---

## 1. Global / Shared Shell

### 1.1 Root Route `/`
- Checks session server-side on every load
- Authenticated users → redirect to `/dashboard`
- Unauthenticated users → redirect to `/login`
- No UI rendered (pure redirect)

### 1.2 Sidebar (Desktop — `md` breakpoint and above)
- Fixed left sidebar, `w-56`, full viewport height, `sticky top-0`
- Background: `bg-surface`, right border separator
- **Logo area**
  - `HeartHandshake` icon in rounded square, brand color (`bg-state-today`)
  - "lostbae" text: "lost" in dark, "bae" in brand color at 80% opacity
  - Entire logo is a link to `/dashboard`
  - Hover: opacity decreases (`hover:opacity-80`)
- **Navigation links** (Dashboard, Documents, YouTube, Udemy, Music, Video, Terminology, Settings)
  - Each link: rounded-xl pill shape, left icon + label
  - Active state: `bg-state-today/10 text-state-today` background + colored icon
  - Active state: `ChevronRight` arrow appears at right edge
  - Inactive hover: `hover:bg-canvas hover:text-forest-slate`
  - Focus-visible: ring around the link (`focus-visible:ring-2 focus-visible:ring-state-today/50`)
  - `aria-current="page"` on active link
- **Admin link** — only shown when `user.role === "admin"`; same styling as other nav items
- **User footer section** (bottom of sidebar, separated by top border)
  - Avatar: circular badge, brand-color/20 background, user's first letter initial
  - Displays user's full name (truncated) and email (truncated)
  - Sign Out button: full width, `LogOut` icon, red color on hover (`hover:text-destructive hover:bg-destructive/5`)
  - Sign Out: form submit (POST action, not client-side)
  - Focus-visible ring on sign out button

### 1.3 Sidebar (Mobile — below `md` breakpoint)
- Hamburger button: fixed top-left, `h-9 w-9`, rounded border, shadow
- Shows `Menu` icon when closed, `X` icon when open
- On open: full-screen overlay backdrop (`bg-forest-slate/20 backdrop-blur-sm`)
- Sidebar slides in from left with `animate-slide-up` animation
- Clicking backdrop closes sidebar
- Clicking any nav link closes sidebar

### 1.4 Command Palette (`⌘K` / `Ctrl+K`)
- Global keyboard shortcut: `⌘K` or `Ctrl+K` or `Ctrl+/` opens palette
- Renders as portal overlay: `fixed inset-0 z-[100]`
- Backdrop: `bg-forest-slate/20 backdrop-blur-sm` with `animate-fade-in`
- Palette box: `max-w-xl`, `animate-slide-up`, glass surface with shadow
- Clicking outside the palette closes it
- **Search input**
  - `Search` icon on left
  - Auto-focused on open
  - Placeholder: "Search documents, tags, or navigate…"
  - `X` close button on right (closes palette, not clears input)
  - Real-time filtering as user types
- **Navigate section** (Dashboard, All Documents, Terminology, Settings)
  - Hidden if query doesn't match label
  - Hover: `hover:bg-canvas`
  - Keyboard-selected item: `data-[selected=true]:bg-canvas` background
  - Click or Enter → navigate and close palette
- **Documents section**
  - Shows up to 5 recent docs when query is empty
  - Filters by title OR tags when query present
  - Each item: `BookOpen` icon + title (truncated) + tags preview (up to 3)
  - Click → navigate to `/documents/[docId]`
- **Tags section**
  - Up to 5 matching tags
  - `Tag` icon prefix with `#` prefix on tag name
  - Click → navigate to `/documents?tag=[tag]`
- **Footer hint bar**
  - Shows keyboard hint chips: `↑↓` navigate · `↵` select · `Esc` close
- **Empty state**: "No results found for '[query]'" centered text
- `Esc` key closes palette

### 1.5 Global FAB (Floating Action Button)
- Fixed position, `z-50`, bottom-right corner by default
- **Draggable**: user can drag FAB anywhere on screen
  - Drag detection: pointer moves more than 3px → `moved = true` → click suppressed
  - Position clamped to viewport edges (respects safe margins)
  - Position persisted to `localStorage` key `lostbae_global_fab_position`
  - Rehydrated on mount
  - Reclamped on window resize
- **Main toggle button**
  - Desktop: `h-14 w-14`, mobile: `h-[34px] w-[34px]`
  - `Plus` icon (dark background `bg-forest-slate`)
  - When open: rotates `rotate-45` (X shape)
  - While dragging: `scale-95` + `cursor-grabbing`
  - Hover: `hover:bg-forest-slate/90`
  - `active:scale-95` on click
  - Tooltip: "Quick Add" when closed, "Close" when open
- **Action items** (revealed on open)
  - Add Document → `/documents/new` (brand color)
  - Create Note Doc → `/documents/create` (upcoming color)
  - YouTube Study → `/study/youtube` (destructive/red)
  - Music Library → `/music` (stale color)
  - Each: label pill (glass surface) + colored icon circle
  - Staggered animation delay: `i * 40ms` per item
  - Items animate in: `translate-y-0 opacity-100` from `translate-y-4 opacity-0`
  - Icon buttons: `hover:scale-105 active:scale-95`
  - Clicking action item closes FAB
- **Backdrop**: clicking outside FAB closes it
- `Escape` key closes FAB

### 1.6 Mini Audio Player (persistent bottom bar)
- Only renders when a track is loaded (`currentTrack` exists in store)
- Fixed bottom bar: `fixed bottom-0 left-0 right-0 z-50`
- Background: `bg-surface`, top border, `shadow-hover`
- **Full-width seek bar** (above main row)
  - `h-1` height range input
  - Accent color: `accent-state-today`
  - Draggable → seeks audio
- **Main row** (`h-14`)
  - Track avatar (thumbnail if available, else colorized initial letter circle)
  - Track title (truncated, single line)
  - Position: "Track X of Y · 0:00 / 0:00"
  - Previous track button (`SkipBack` icon) — `hover:bg-canvas`
  - Play/Pause button (brand color, `bg-state-today`)
  - Next track button (`SkipForward` icon) — `hover:bg-canvas`
  - Volume mute toggle (hidden on mobile `hidden sm:flex`)
  - Volume slider (0–1, `w-20`) — hidden on mobile
  - Heart/favourite toggle: red when favourited (`fill-current`), grey otherwise, hover turns red
  - Expand button (`ChevronUp`) → opens expanded player modal
- **Keyboard shortcuts** (only active when track is loaded, not in input fields)
  - `Space` → play/pause
  - `N` → next track
  - `P` → previous track
  - `M` → mute toggle
  - `F` → toggle favourite (optimistic update with rollback on error)
  - `←` → seek back 10s
  - `→` → seek forward 10s
  - `↑` → volume +0.1
  - `↓` → volume -0.1

### 1.7 Dashboard Layout (`/dashboard/**`)
- Two-column layout: sidebar + main content area
- Main content scrollable, padded
- Provides `CommandPalette` and `GlobalFAB` to all dashboard children

### 1.8 Study Layout (`/study/**`)
- Minimal layout — no sidebar
- Full-height, no extra padding (study pages manage their own layout)

### 1.9 Toast Notifications
- Appear for all async operations (saves, deletes, errors)
- Variants: `success` (green), `error` (red), neutral
- Auto-dismiss after timeout
- Appear globally, accessible from any page

### 1.10 Not Found Page (`/not-found`)
- Custom 404 page rendered by Next.js

### 1.11 Error Boundary (`/error`)
- Custom error boundary page for unhandled errors

### 1.12 Loading States
- `/dashboard` loading skeleton (`loading.tsx`)
- `/documents` loading skeleton (`loading.tsx`)
- Suspense boundaries around async server components

---

## 2. Auth Pages

> All auth pages share a centered card layout on a plain background. Auth layout wraps all four pages.

### 2.1 Login Page `/login`

**Card Structure**
- Glass-shadow card (`shadow-glass border-border/50`)
- Centered `HeartHandshake` icon in rounded square (brand color)
- Title: "Welcome back"
- Description: "Sign in to your lostbae account"

**OAuth Buttons**
- Divider: horizontal line with "or continue with" label centered
- 3 OAuth provider buttons in a 3-column grid: Google, GitHub, Discord
- Each button: provider icon + label, rounded-xl border
- Hover: `hover:bg-muted/50 hover:border-border` background change + border darkens
- Transition: `transition-colors`
- Links to `/api/auth/[provider]` (not button, actual `<a>` tag)

**Email/Password Form**
- Email field: type=email, placeholder "alex@example.com", autocomplete="email"
- Password field: type=password, placeholder "••••••••", autocomplete="current-password"
- **Show/hide password toggle** button (absolute positioned inside input)
  - `Eye` icon when hidden, `EyeOff` icon when shown
  - Hover: `hover:text-forest-slate` color transition
  - `aria-label` switches between "Show password" / "Hide password"
- "Forgot password?" link (top-right of password label row), brand color, `hover:underline`
- Submit button: full width, "Sign in" + `ArrowRight` icon
- Loading state: spinning circle + "Signing in…" text, button disabled
- Error banner: `animate-slide-down`, red tinted border and background
- **OAuth error handling** (from `?error=` query param):
  - `email_exists` → "An account with this email already exists…"
  - `oauth_denied` → "Sign-in was cancelled."
  - any other → "OAuth sign-in failed. Please try again."
- `?from=` query param preserved: after login redirects to original destination
- "Don't have an account? Create one" link → `/register` (with `?from=` forwarded)
- On success: router.push to `from` param or `/dashboard`
- Records login access via `recordLoginAccessAction()` on mount

### 2.2 Register Page `/register`

- Same card structure and OAuth buttons as Login
- Title: "Start learning smarter"
- Description: "Create your lostbae account"
- Additional field: Full name (text, placeholder "Alex Chen", autocomplete="name")
- Password: minLength=8, placeholder "Min 8 characters", autocomplete="new-password"
- Show/hide password toggle (same as login)
- Submit button: "Create account" + `ArrowRight` icon
- Loading state: spinner + "Creating account…"
- Error banner with `animate-slide-down`
- "Already have an account? Sign in" link → `/login` (with `?from=` forwarded)
- `?from=` query param preserved and forwarded

### 2.3 Forgot Password Page `/forgot-password`

- Title: "Forgot password?", description: "Enter your email and we'll send you a reset link."
- Email field only
- Submit button: "Send reset link" + `ArrowRight`
- Loading state: spinner + "Sending…"
- Error banner
- "Back to sign in" link → `/login`
- **Success state** (after form submits):
  - Card title changes to "Check your inbox"
  - Shows: "If an account exists for that email, you'll receive a reset link shortly."
  - "Back to sign in" link replaces form

### 2.4 Reset Password Page `/reset-password`

- Reads `?token=` from URL
- **No token state**: title "Invalid reset link", red icon, "Request new reset link" → `/forgot-password`
- **Expired token state** (`state.error === "expired"`): title "Link expired", red icon, request new link
- **Success state**: title "Password updated!", green icon, "Sign in" link → `/login`
- **Form state**:
  - Title: "Set new password", description: "Choose a strong password for your account."
  - New password field (minLength=8) with show/hide toggle
  - Confirm password field (minLength=8) with show/hide toggle
  - Hidden `token` field
  - Submit: "Update password" + `ArrowRight`
  - Loading: spinner + "Updating…"
  - Error banner (non-expired errors)
  - "Back to sign in" link

---

## 3. Dashboard Page `/dashboard`

### 3.1 Page Header
- Title: "Dashboard" (bold, responsive size)
- Subtitle: "Your learning queue for today"
- `⌘K` keyboard hint chip (hidden on mobile `hidden sm:inline`)
- "Add Document" button (top right): `Plus` icon + "Add Document" text (text hidden on mobile)
- Button: `bouncy-hover` animation class, links to `/documents/new`
- Button: `aria-label="Add document"`

### 3.2 Onboarding Banner
- Only shown when `stats.totalDocs === 0` (zero documents)
- Guides new users to add their first document

### 3.3 Stats Cards (4-card grid)
- 2-column on mobile, 4-column on desktop (`lg:grid-cols-4`)
- Cards: hover shadow transition (`hover:shadow-soft transition-shadow duration-200`)
- **Total Documents** card: `BookOpen` icon, blue/upcoming color
- **Due Today** card: `Clock` icon, brand color; value = `pendingRevisions`
- **Completed** card: `CheckCircle2` icon, green/completed color
- **Active** (in rotation) card: `TrendingUp` icon, stale/orange color; value = `totalDocs - totalCompleted`
- Each card: icon in colored rounded background, large monospace bold number, label + description

### 3.4 Filter Tabs (Revision Queue)
- Horizontal scrollable tab strip on mobile (`overflow-x-auto custom-scrollbar`)
- Tabs: **Today**, **Pending**, **Upcoming**, **All Docs**
- Active tab: `bg-state-today text-white shadow-soft` (green)
- Pending tab when has items: active = `bg-red-500/10 text-red-600`, inactive = `text-red-500/80`
- Pending tab shows count: "Pending (3)"
- Each tab is a `Link` → `?filter=[key]` URL param
- `aria-current="page"` on active tab
- Tab container: rounded-xl border, bg-surface

### 3.5 Task Queue (Revision Queue)
- **Sort dropdown** (top right of queue)
  - Options: Newest First, Oldest First, A–Z, Z–A, Last Modified
  - Default: Last Modified
  - Persisted to `localStorage` key `lostbae_dashboard_sort`
  - Rehydrated on mount
  - Styled: rounded-xl border, focus ring
- **Keyboard shortcut `E`**: when a task row is expanded and no modal is open → completes that task
- Tasks list: `space-y-2.5`
- **Empty state** (`InboxZero`): shown when no tasks in current filter
  - For `today` filter: shows "No upcoming reviews found"
- **Task Row** (document tasks)
  - Expandable: clicking toggles expanded state (one at a time, closing previous)
  - Collapsed: shows title, status badge, tags, due date
  - Expanded: shows additional details + action buttons
  - "Review" button → opens Glass Modal
  - "Reschedule" button → opens reschedule controls
  - "Complete" button → marks review done, removes from list, shows toast
- **YouTube Task Row** (for YouTube sessions in queue)
  - Different layout, expandable
  - Shows video title, thumbnail
- **Glass Modal** (review modal)
  - Opens when clicking "Review" on a task
  - Shows document embed/content for review
  - "Mark Complete" action → removes from queue, shows success toast
  - Close button / backdrop click → closes modal
- After completing: `router.refresh()` to sync queue count in header

### 3.6 Analytics Section
- Section title: "Learning Insights"
- **Analytics Insights** component: displays computed stats
- **Review Trend Chart**
  - Title: "Reviews this week" (small label)
  - Dynamically loaded (`ReviewTrendChartDynamic`)
  - Bar or line chart showing daily review counts

---

## 4. Documents List Page `/documents`

### 4.1 Page Header
- Title: "Documents"
- Subtitle: "[N] document(s) in your library"
- Two buttons (top right):
  - "Create Document" (outline, brand-color border/text) → `/documents/create`
  - "Add Document" (filled) → `/documents/new`
  - Both: `bouncy-hover`, hidden label text on mobile (icon only)
  - `aria-label` on both buttons

### 4.2 Search Bar
- `Search` icon (absolute, left of input)
- Placeholder: "Search titles and tags…"
- Real-time client-side filtering (no server round-trip)
- `X` clear button appears when input has value
  - Hover: `hover:text-forest-slate`

### 4.3 Media Type Filter Dropdown
- Options: All Media Types, Google Docs, Audio, Video, PDF, Image
- Styled: rounded-xl, focus ring
- Default: All Media Types (null)
- Persisted to `localStorage` key `lostbae_doc_media`

### 4.4 Sort Dropdown
- Options: Newest First, Oldest First, A–Z, Z–A, Last Modified
- Default: Last Modified
- Persisted to `localStorage` key `lostbae_doc_sort`
- Rehydrated on mount

### 4.5 Tag Filter Chips
- Only shown when user has tags (`allTags.length > 0`)
- "All" chip (first): active = brand color, inactive = grey border
- Per-tag chips: `#tag (count)` format
- Active tag chip: brand background + text
- Inactive hover: `hover:border-state-today/40 hover:text-forest-slate`
- Toggle: click active tag → deselects (back to All)
- Chips: rounded-full, small text
- All chips truncate with `max-w-full`

### 4.6 Results Counter
- "Showing X of Y documents" (small, grey)
- When items selected: "· N selected" appended (brand color, bold)

### 4.7 Document List — Mobile Card View (below `sm` breakpoint)
- Stacked cards: rounded-2xl border, shadow-card
- Selected state: `border-state-today/30 bg-state-today/5` tint
- **Checkbox** (top left of card): `CheckSquare` / `Square` icon toggle
  - `hover:text-state-today`
- **Title**: 2-line clamp, bold, links to document detail
- **Status badge** + date (monospace)
- **Tags**: up to 2 tags shown, `+N` overflow badge
- **Study icon** (`BookOpen`): links to `/study/[docId]`, hover bg
- **Delete icon** (`Trash2`): `hover:bg-destructive/10 hover:text-destructive`

### 4.8 Document List — Desktop Table View (above `sm` breakpoint)
- Rounded-xl border container with overflow-hidden
- Table with: Checkbox, Title, Tags, Status, Difficulty, Actions columns
- Tags column: hidden below `sm` (`hidden sm:table-cell`)
- Status column: hidden below `md`
- Difficulty column: hidden below `lg`
- **Table header**: `bg-canvas/50` background
- Select-all checkbox in header:
  - `Square` → none selected
  - `Minus` → some selected (indeterminate)
  - `CheckSquare` (blue) → all on page selected
  - `hover:text-forest-slate`
- **Table rows**:
  - Hover: `task-row-hover` class (custom hover style)
  - Selected: `bg-state-today/5 border-state-today/20`
  - Row transition: `transition-colors`
- **Title cell**: serif font, line-clamp-1, hover → `hover:text-state-today`
  - Shows "· merged" label if document has a parent
  - Date in monospace grey below title
- **Actions cell** (visible on row hover: `opacity-0 group-hover:opacity-100`)
  - Study link (BookOpen icon)
  - Delete button (Trash2, destructive hover)
  - Arrow link (ChevronRight) → document detail
  - Tooltips on all action icons

### 4.9 Pagination
- Shown only when `totalPages > 1` (10 items per page)
- Previous / Next buttons: disabled + opacity-50 at boundaries
- Up to 5 page numbers shown with ellipsis
- Smart windowing: centers current page in range
- Justified right on desktop, centered on mobile

### 4.10 Floating Bulk Action Bar
- Appears (fixed bottom, animated `animate-slide-up`) when any rows are selected
- Desktop: horizontally centered (`sm:left-1/2 sm:-translate-x-1/2`)
- Mobile: stretches full width with small margins
- Background: `bg-forest-slate/95 backdrop-blur-xl`, rounded-2xl, glass border
- Shows: `[N] selected` count with `CheckSquare` icon, divider
- **Export CSV button**: `Download` icon, "Export CSV" label (label hidden on very small screens)
  - Downloads as `lostbae-documents-[timestamp].csv`
  - Columns: Title, Tags, Status, Difficulty, Created
  - Toast: "Exported N document(s) as CSV"
  - Tooltip on hover
- **Delete N button**: destructive red, `Trash2` icon, count label
  - Tooltip on hover
  - Opens bulk-delete confirmation dialog
- **Dismiss button**: `X` icon, clears selection, closes bar

### 4.11 Single Delete Confirmation Dialog
- Triggered by trash icon on a specific document
- Title: "Delete document?"
- Description: warns about permanent deletion of notes, tags, revision history
- Cancel button (outline)
- "Delete permanently" button (destructive, rounded-full)
- Loading state: "Deleting…" text, button disabled
- On confirm: removes from list, shows toast, closes dialog

### 4.12 Bulk Delete Confirmation Dialog
- Warning icon (`AlertTriangle`) in destructive tinted box
- Title: "Delete N document(s)?"
- Bold count in description, red "This cannot be undone."
- Cancel button (disabled while deleting)
- Delete button: spinner + "Deleting…" when in progress, or `Trash2` + count
- On confirm: bulk API call, removes from list, shows toast

### 4.13 Empty States
- **Library empty**: large `BookOpen` icon circle, heading, description, "Add your first document" button
- **No search matches**: `Search` icon, "No matches found", "Try adjusting…", "Clear filters" button

---

## 5. Document Detail Page `/documents/[docId]`

### 5.1 Layout
- Full-bleed: `-mt-6 md:-mt-8 -mx-4 md:-mx-8` (removes parent padding)
- Fixed height: `h-[calc(100vh-4rem)] overflow-hidden`
- Side-by-side: optional left sidebar (sub-pages) + main scrollable content area

### 5.2 Sub-Pages Sidebar (Desktop — `lg` breakpoint)
- Only shown when doc has sub-pages OR is a native-doc
- Left panel listing all sibling pages
- Current page highlighted
- Clicking a page navigates to it

### 5.3 Mobile Sub-Pages Carousel (below `lg`)
- Horizontal scroll strip of rounded-full pill links
- Active pill: brand color background
- Inactive hover: `hover:text-forest-slate`
- `FileText` icon in each pill
- Title truncated to `max-w-[220px]`
- `custom-scrollbar` class

### 5.4 Document Header
- **Inline Title Editor**: click-to-edit document title in place
- **Status badge**: First Visit / Revision / Updated / Completed (colored variants)
- **Difficulty badge**: Easy / Medium / Hard (colored variants)
- **Tag badges**: up to 3 shown, each clickable → `/documents?tag=[tag]`
- **+N overflow badge**: tooltip shows all hidden tags on hover
- **Dates row** (monospace, small, grey):
  - `Calendar` icon + "Added [date]"
  - `BookOpen` icon + "Next review: [relative date]" (if scheduled)
  - "[N] review(s) completed" (if reviews done)
- **Study Document** button (outline, top-right): `BookOpen` icon → `/study/[docId]`
  - `bouncy-hover`
- Horizontal `Separator` below header

### 5.5 Content Area (varies by media type)
- **Google Doc**: `<iframe>` embedded, sandbox attributes, eager loading
- **Native Doc**: `RichTextEditor` (TipTap rich-text editor) — full editing
- **PDF**: `PDFAnnotator` component with highlight support
- **Audio**: `AudioPlayer` with source URL
- **Video**: `VideoPlayer` component
- **Image**: `<img>` tag, centered, `max-w-full`, rounded with shadow
- **Web Clip / document without file**: informational panel with "Open Original Website" button

### 5.6 Document Detail Client Panel (Notes, Terms, Metadata)
- 3-column grid: notes+terms (2/3 width) + metadata sidebar (1/3 width)

**Stats mini-cards** (3 across):
- Open notes count (`FileText` icon)
- Glossary terms count (`BookText` icon)
- Next review date (`CalendarDays` icon) or "Not scheduled"

**Search bar** (notes + terms):
- `Search` icon
- Rounded-full input
- Real-time filter across notes AND terms
- `X` clear button on right (hover color change)

**Tab switcher** (Notes / Terms):
- Underline tab style
- Shows counts: "Notes (N)" / "Terms (N)"
- Active tab: brand color underline + text

**Notes tab**:
- Textarea composer (min 100px)
  - `⌘Enter` shortcut to save note
- "Save Note" button: disabled when empty or saving, `Save` icon + text
  - Loading: `Loader2` spinning icon
- **Active notes list**:
  - Card: rounded-2xl, border, shadow
  - Note content (pre-wrap, line-break preserved)
  - **Action buttons** (appear on hover: `opacity-0 group-hover:opacity-100`)
    - Copy (`Copy` icon) → copies to clipboard, toast "Note copied"
    - Mark done (`Check` icon) → moves to archived section
    - Delete (`Trash2` icon) → destructive hover, removes note, toast
    - All with tooltips (side="left")
- **Archived notes section**:
  - Label: "Archived"
  - Strikethrough text, 60% opacity, grey text
  - Delete icon (appears on hover)
- Empty state: "No notes yet. Write one above!" or "No notes match your search."

**Terms tab**:
- Input for term name + textarea for definition
- "Save Term" button with `BookText` icon
  - Loading spinner
- Terms list: cards with term name (bold) + definition (grey)
- Per-term (hover):
  - Copy button (`Copy` icon) → copies "term: definition"
  - Delete button (`Trash2` icon) → destructive hover
  - Both with tooltips

**Metadata sidebar**:
- **Difficulty selector**: `Select` dropdown (Easy/Medium/Hard)
  - Auto-saves on change, toast "Difficulty updated"
- **Tags panel**:
  - Tag input + `Plus` button to add
  - `Enter` or `,` key to add tag
  - Tag badges with `X` remove button
  - `+N` overflow badge for tags beyond 3
  - "Save Tags" button appears when tags differ from saved
  - Loading: "Saving…" text
- **Review Schedule** (shown only when repetition exists):
  - Next review date (locale string)
  - Interval in days
  - Reviews done count

---

## 6. Add Document Page `/documents/new`

### 6.1 Page Header
- Title: "Add Document"
- Subtitle: "Paste a public Google Doc URL to add it to your spaced repetition queue."

### 6.2 Tab Switcher (Link / File Upload)
- Rounded-xl pill tabs: "Link" (Link2 icon) + "File Upload" (Upload icon)
- Active tab: `bg-surface shadow-card` background
- Inactive: grey text, `hover:text-forest-slate`

### 6.3 Link Tab

**URL detection logic** (on blur from URL field):
- YouTube URL → YouTube session form
- Video URL (mp4/mov/webm/Vimeo) → Video form
- Google Doc URL → Google Doc form
- Invalid → error message shown

**Google Doc Form**:
- URL field: `Link2` icon, placeholder "https://docs.google.com/...", auto-focus
  - Auto-fetches title on blur (spinner shown while fetching)
  - Error shown if fetch fails
- Title field: pre-filled from server fetch, editable
- Difficulty dropdown: Easy/Medium/Hard (default: Medium)
- First Review dropdown: +1/2/3/5/7/14/21/30 days (default: +2 days)
- Tags input + Plus button + Enter/comma key support
  - Tag pills shown with X remove button
  - `aria-label` on each remove button
- Submit: "Add to Library" + `CheckCircle2` icon
  - Loading: spinner + "Adding to library…"
  - Disabled if no URL/title or pending

**YouTube URL Form** (auto-detected):
- URL field with `Link2` icon
- Same meta fields (difficulty, first review, tags)
- Submit: "Start YouTube Session" → redirects to `/study/youtube?v=[id]`
- Loading: "Creating session…"

**Video URL Form** (auto-detected):
- URL field + manual Title field required
- Same meta fields
- Submit: "Add Video to Library"

### 6.4 Similarity Warning Banner
- Shown after successful add if similar docs exist
- `AlertTriangle` icon, amber/upcoming tinted card
- Title: "Insight match detected"
- Lists each similar document with title + reason
- Per match: **Merge** button (`GitMerge` icon) → merges into that doc
- "Ignore — keep as new document" ghost button with arrow
- `animate-slide-down` entrance animation

### 6.5 File Upload Tab

**Idle State (Drop Zone)**:
- Drag-and-drop zone: dashed border, rounded-2xl
- `Upload` icon, text "Drag & drop a file, or click to browse"
- Accepted types listed: PDF, DOCX, TXT, MD, PPTX, PNG, JPG, GIF, WEBP
- Size limits: Audio max 5 MB, all others max 50 MB
- Hover: `hover:border-state-today/40 hover:bg-state-today/5`
- Dragging over: `border-state-today bg-state-today/5` active state
- `tabIndex=0` + `onKeyDown Enter` for keyboard accessibility
- File validation errors shown as red banner

**Uploading State**:
- Spinner animation, file name shown
- Progress bar (green fill, `transition-all`)
- "N%" progress text
- Cancel button → aborts XHR upload

**Metadata State** (after upload completes):
- File preview badge: file type icon + name + size (MB) + ✓ checkmark
- Title input (pre-filled from filename without extension)
- Difficulty + First Review dropdowns
- Tags input (same as link tab)
- "Upload Different File" outline button → resets to idle
- "Add to Library" submit button

---

## 7. Create Native Doc Page `/documents/create`

- Same `AddDocumentForm` but defaults to file/native doc creation flow
- Metadata: title: "Add Document — lostbae"

---

## 8. Study Page `/study/[docId]`

### 8.1 Layout
- Full-height `h-screen`, no scroll on outer container
- Flex column: header + split pane body

### 8.2 Dashboard Header (Study)
- Logo shown (`showLogo={true}`)
- Breadcrumbs: Dashboard → Documents → [Doc Title]
- Each breadcrumb is a link
- **Right actions area**:
  - **Doc Switcher** (`StudyDocSwitcher`): dropdown to jump between documents
  - **Open in Google Docs** link (only for non-native docs): `ExternalLink` icon
    - Hidden label on mobile (`hidden sm:inline`)
    - Hover: `hover:text-forest-slate`

### 8.3 Split Pane (Resizable)
- Left panel: document content (Google Doc embed, audio, video, PDF, image, native editor, or web clip)
- Right panel: study sidebar
- **Resizable**: drag handle between panels to resize
- Resize state persisted to localStorage

**Left panel content varies by media type**:
- **Google Doc**: iframe, sandbox, eager loading, `absolute inset-0`
- **Audio**: `AudioPlayer` component with playback UI
- **Video**: `VideoPlayer` component
- **PDF**: iframe displaying PDF
- **Image**: centered img with `max-w-full`, rounded, shadow
- **Native Doc**: `RichTextEditor` (editable)
- **Web Clip** (document without file): info panel with link icon + "Open Original Website" button

### 8.4 Study Sidebar Panel (right side)
- Full height, `bg-surface`, left border
- Compact mode support (font-size `text-[12px]`)

**Sidebar header**:
- Label: "Document" (uppercase, small, grey)
- Document title (serif font, 2-line clamp)
- Collapse button (`PanelRightClose` icon) — collapses sidebar, tooltip "Collapse sidebar"

**Quick action section**:
- Search input: `Search` icon, placeholder "Search notes, terms, tags..."
  - `X` clear button
  - Real-time filter
- 3 quick-action micro-buttons:
  - **Note** (`StickyNote` icon): scrolls to Notes tab + focuses textarea
  - **Term** (`BookText` icon): scrolls to Terms tab + focuses input
  - **Compact/Roomy** (`LayoutList` icon): toggles compact mode
  - All: rounded-lg, hover brand color border + tint

**Tab navigation** (Overview / Notes / Terms):
- Active: brand color text + bottom border
- Notes count: `Notes (N)` format

**Overview Tab**:
- 2×2 stat grid: Open notes, Terms, Tags, Review date
  - Each: icon + large number + small label
- Note completion progress bar (only shown when notes exist)
  - Percentage label
  - Green fill with `transition-all`
- Difficulty selector (auto-saves on change)
- Tags section:
  - Input + `Plus` button (tooltip "Add tag")
  - `Enter` or `,` key to add
  - Tag badges with `X` remove button
  - "+N" overflow badge
  - "Save Tags" button appears when unsaved changes
- Review Schedule section (only if repetition exists):
  - Next review date, interval (Xd), reviews done
  - Reschedule dropdown (+1/2/3/5/7/14/21/30 days)
  - Apply button (`RotateCcw` icon) — tooltip "Apply reschedule"
  - Loading: spinner on apply button

**Notes Tab**:
- Textarea composer: auto-focused when opened via quick-action
  - `⌘Enter` to save
- "Save Note" button full-width, `⌘↵` hint on right
- Active notes list:
  - Copy button (hover, tooltip)
  - Mark done (hover, tooltip)
  - Delete (hover, tooltip, destructive)
- Archived notes section (done notes):
  - Strikethrough, opacity-60
  - Delete on hover

**Terms Tab**:
- Term name input (auto-focused when opened via quick-action)
- Definition textarea
- "Save Term" button
- Terms list: term + definition
  - Copy button (hover, tooltip)
  - Delete button (hover, tooltip, destructive)

**Sidebar state persistence**:
- Active tab saved to `localStorage` key `lostbae_study_sidebar_tab`
- Compact mode saved to `localStorage` key `lostbae_study_sidebar_compact`
- Both rehydrated on mount

### 8.5 Mobile FAB (Study Page)
- Shown only below `lg` breakpoint
- Fixed button opens sidebar as full overlay
- Overlay has close button
- Contains same sidebar content

---

## 9. YouTube Study Page `/study/youtube`

### 9.1 Landing State (no `?v=` or `?list=` param)

**Header**: breadcrumbs (Dashboard → YouTube Study)

**YouTube URL Form** (`YoutubeUrlForm`):
- Centered, `mt-[10vh]`
- URL input for YouTube video or playlist

**Bookmarks List** (`YoutubeBookmarksList`):
- Shows saved video/playlist bookmarks
- Each: thumbnail, title, type badge, link to resume
- Empty state if no bookmarks

### 9.2 Playlist State (`?list=[playlistId]`)

**Header**: breadcrumbs including playlist title + **Bookmark Toggle** in right actions

**Playlist Preview** (`PlaylistPreview`):
- Shows playlist metadata (title, channel, count)
- Video list with thumbnails, titles, durations
- Click video → navigates to `?v=[videoId]`

**Bookmark Toggle** (`YoutubeBookmarkToggle`):
- Bookmark/unbookmark playlist or video
- Icon toggles filled/outline state
- Persisted server-side

### 9.3 Video Study State (`?v=[videoId]`)

**Header**:
- Breadcrumbs: Dashboard → YouTube Study → [Video Title]
- **Bookmark toggle** for the video
- "Open on YouTube ↗" external link (hover color)

**Split Pane** (`YoutubeStudyClient`):
- Left: YouTube video player embed (full height, responsive)
- Right: study sidebar (notes panel, bookmarks)
- Resizable panels

**YouTube Player** (`YoutubePlayer`):
- iframe embed with YouTube API
- Fullscreen overlay option (`YoutubeFullscreenOverlay`)

**YouTube Notes Panel** (`YoutubeNotesPanel`):
- Write notes tied to the YouTube session
- Save/delete notes

**YouTube Bookmarks** (`YoutubeBookmarksList`):
- Timestamp bookmarks within the video
- Add/remove bookmarks

---

## 10. Udemy Study Page `/study/udemy`

### 10.1 Landing State (no `?course=`)

**Header**: breadcrumbs (Dashboard → Udemy Study)

**Udemy URL Form** (`UdemyUrlForm`):
- Centered, `mt-[10vh]`
- Paste Udemy course URL

**Recent Sessions** (`UdemyRecentSessions`):
- Lists previously studied courses/lectures
- Thumbnail, title, progress info
- Click to resume session

### 10.2 Course Explorer State (`?course=[slug]`, no `?lecture=`)

**Header**: breadcrumbs (Dashboard → Udemy Study → [Course Title])

**Course Explorer** (`UdemyCourseExplorer`):
- Lists course sections (accordion style)
- Each section expands to reveal lectures
- Each lecture: title, duration, type
- Lectures with existing sessions marked differently
- Click lecture → navigates to `?course=[slug]&lecture=[id]&ltitle=[title]`

### 10.3 Lecture Study State (`?course=` + `?lecture=`)

**Header**:
- Breadcrumbs: Dashboard → Udemy Study → [Course] → [Lecture]
- "Open on Udemy ↗" external link (hover color)

**Split Pane** (`UdemyStudyClient`):
- Left: Udemy lecture embed (iframe, `lectureUrl`)
- Right: notes panel (`UdemyNotesPanel`)
- Resizable panels

---

## 11. Music Library Page `/music`

### 11.1 Page Header
- Title: "Music Library"
- Subtitle: "Your uploaded audio files and playlists"

### 11.2 Tab Navigation
- Tabs: All Tracks, Playlists, Favourites, Recently Played, Search YouTube
- Active tab: brand color text + bottom border (2px underline)
- Inactive hover: `hover:text-forest-slate`
- Tab border at bottom of container

**"Add Track" button** (top-right of tab bar):
- `PlusCircle` icon, dark background
- Hover: `hover:bg-forest-slate/90`
- Opens Add Track dialog

### 11.3 All Tracks Tab

**Search + Controls row**:
- Search input (`Search` icon, relative left)
- "Search YouTube" button → switches to YouTube Search tab
- **Due filter dropdown**: All Time / Due Today / Due In 2 Days / Due In 3 Days
- **Sort dropdown**: Recently Added / Title A–Z / Most Played
- All styled: rounded-xl border, focus ring

**"Play All" button**:
- Only shown when tracks visible
- `Music` icon, brand background
- Track count label alongside

**Track Grid**:
- Responsive: 2→3→4→5→6 columns at breakpoints
- Each track: `TrackCard` component

**Track Card** (`TrackCard`):
- Thumbnail or colored initial avatar
- Title (truncated)
- Play button on hover
- Favourite heart toggle (red when active)
- Add to playlist menu
- Delete option

**Empty states**:
- No favourites: "No favourites yet. Click the heart on any track."
- No recent: "No recently played tracks."
- No tracks: "No audio tracks found. Upload some audio files or add a YouTube track."
  - Link: "Add your first track" → opens Add Track dialog

### 11.4 Playlists Tab

**"New Playlist" button**: `PlusCircle` icon, outline style; uses `prompt()` for name input

**Playlist Grid** (when no playlist selected):
- 1→2→3→4 columns at breakpoints
- Each playlist card:
  - Square aspect-ratio thumbnail (first track's colored avatar or `Music` icon)
  - Playlist name (truncated)
  - Track count
  - Hover: `hover:shadow-hover`
  - Click → opens `PlaylistPanel`

**Playlist Panel** (`PlaylistPanel`):
- Back button / close
- Track list (reorderable via drag-and-drop)
- Remove track button per track
- Delete playlist button
- Play playlist button

**Empty playlists state**: `Music` icon, "No playlists yet. Create one to get started."

### 11.5 Favourites Tab
- Shows only tracks with `isFavourite=true`
- Same search + sort controls
- Same track grid

### 11.6 Recently Played Tab
- Shows tracks with `lastPlayedAt`, sorted newest first
- No sort/filter controls

### 11.7 YouTube Search Tab
- `YoutubeSearch` component
- Search for YouTube audio to add to library
- On success: switches back to All Tracks tab + reloads

### 11.8 Add Track Dialog
- `Dialog` modal
- Title: "Add Audio Track"
- Description: "Add a track from a YouTube URL or upload an audio file."
- `AddAudioForm` component inside
- On success: closes dialog, reloads page

---

## 12. Video Player Page `/video`

### 12.1 Page Header
- Title: "Video Player"
- Subtitle: "Play local video files — nothing is uploaded or saved."

### 12.2 File Picker (idle state)
- Large dashed border drop zone
- `Upload` icon (large)
- "Open a video file" heading
- "Supports MP4, MKV, WebM, AVI, MOV and more"
- "Browse files" outline button
- Hidden `<input type="file">` triggered on click
- Accepted types: mp4, webm, ogg, mkv, avi, mov, wmv, ogv, 3gp (and MIME types)

### 12.3 Video Player (after file selected)
- Black container (`bg-black`), `aspect-ratio: 16/9` (non-fullscreen)
- Clicking video: toggles play/pause
- Mouse move: shows controls (auto-hides after 3s when playing)
- Mouse leave: hides controls when playing

**Controls overlay** (fades in/out: `transition-opacity duration-300`):
- Bottom gradient (`bg-gradient-to-t from-black/80`)
- File name (grey, small, truncated)
- **Seek bar**:
  - Buffered progress layer (white/25)
  - Played progress layer (white)
  - Invisible range input on top
- **Controls row**:
  - `SkipBack` (10s back) — title "Back 10s (←)"
  - Play/Pause (`Play` / `Pause` icon)
  - `SkipForward` (10s forward) — title "Forward 10s (→)"
  - Mute toggle (`Volume2` / `VolumeX`)
  - Volume slider (0–1, accent-white, `w-20`)
  - Time display "0:00 / 0:00" (tabular-nums)
  - Spacer (pushes right controls to end)
  - **Speed dropdown** (`Settings2` icon, "Nx" label):
    - Options: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x
    - Bold on active speed
  - **Open file button** (Upload icon) — opens file picker for new file
  - **Fullscreen toggle** (`Maximize` / `Minimize`) — title "Fullscreen (F)"

### 12.4 Fullscreen Mode
- `fixed inset-0 z-50`, `bg-black`
- Aspect ratio removed (fills viewport)
- All controls still visible
- `document.fullscreenElement` tracked via event listener

### 12.5 Keyboard Shortcuts (video player, only when file loaded)
- `Space` or `K` → play/pause
- `←` → back 10s
- `→` → forward 10s
- `↑` → volume +0.1
- `↓` → volume -0.1
- `F` → fullscreen toggle
- `M` → mute toggle
- Ignored when focused on input/textarea elements

### 12.6 Keyboard hint bar
- "Space / K — play/pause · ← → — skip 10s · ↑ ↓ — volume · M — mute · F — fullscreen"
- Only shown when file is loaded

---

## 13. Terminology Page `/terminology`

### 13.1 Page Header
- Title: "Terminology"
- Subtitle: "[N] term(s) in your personal glossary"

### 13.2 Controls Row
- Search input (`Search` icon left, `X` clear right)
  - Placeholder: "Search terms…"
  - Clears via button (hover color)
- **"Add Term" button** (right):
  - Default variant when composer hidden, outline when shown
  - Toggles `showComposer`

### 13.3 Add Term Composer
- Appears/disappears (no animation)
- Card: rounded-2xl, border, shadow
- Header: `BookText` icon in brand tinted box + "New terminology" + "Saved directly to your glossary."
- Term input (placeholder "Term")
- Definition textarea (min 88px, no resize, placeholder "Short explanation")
- Footer buttons: Cancel (ghost) + "Save Term" (`Plus` icon)
  - Disabled when empty or saving
  - Loading: `Loader2` spinner

### 13.4 Alphabet Index
- Only shown when `grouped.length > 0`
- Row of letter chips (A–Z, only letters that have terms)
- Each: anchor link `#group-[letter]`, monospace font, grey
- Hover: `hover:border-state-today/30 hover:text-state-today`

### 13.5 Grouped Terms List
- Terms grouped alphabetically
- Group header: letter label + horizontal divider line

**Term row** (collapsible):
- Rounded-2xl card, border, shadow, `task-row-hover`
- **Toggle button** (left, full width of row minus actions):
  - `ChevronRight` when collapsed, `ChevronDown` when expanded
  - Term name (bold, truncated)
  - `aria-expanded` attribute
- **Source doc link** (top right, visible on desktop `hidden sm:inline-flex`):
  - `ExternalLink` icon + truncated doc title
  - Brand color, `hover:underline`
  - Only shown when term has a source document
- **Delete button** (`Trash2`):
  - Desktop: `opacity-0 group-hover:opacity-100`
  - Mobile: always visible (`opacity-100`)
  - `hover:bg-destructive/10 hover:text-destructive`
- **Expanded content** (below separator):
  - Definition text (grey, relaxed line height)
  - Source doc link repeated for mobile (only `sm:hidden`)

### 13.6 Empty States
- **No terms at all**: search icon circle, "No terms yet", add prompt
- **No search matches**: small card, "No terms match your search."

---

## 14. Settings Page `/settings`

### 14.1 Page Header
- Title: "Settings"
- Subtitle: "Manage your account and API integrations"
- Max width: `max-w-2xl mx-auto`

### 14.2 Profile Card
- `User` icon in upcoming-color tinted box
- Title: "Profile", description: "Update your display name"
- **Full name input**: prefilled from user data, required, minLength=2
- **Email input**: disabled, `opacity-60 cursor-not-allowed`
  - "Email cannot be changed." note
- **Save Profile button** (right-aligned):
  - Loading: `Loader2` spinning
  - Success: `Check` icon
  - Toast on success: "Profile updated"
  - Toast on error: error message

### 14.3 Backup Database Card
- `DatabaseZap` icon in brand-color tinted box
- Title: "Backup Database"
- Description: "Manually sync your main MongoDB database with the backup configured in backup_db."
- Explanation text: "Runs a two-way sync for missing and newer records." + "Deletes are not mirrored yet."
- **Sync Now button** (`DatabaseZap` icon):
  - Loading: `Loader2` + "Syncing…"
  - On success: toast "Backup database synced"
  - Last sync summary shown below text after success: "N to backup, N to primary, N newer-version updates"
  - On error: toast with error message

### 14.4 Gemini API Key Card
- `Key` icon in stale-color tinted box
- Title: "Gemini API Key"
- Description about encryption and usage

**No key saved state**:
- Input field (password type by default)
- Show/hide toggle (`Eye` / `EyeOff` icon)
- Placeholder "AIza…"
- Link to Google AI Studio
- "Save Key Securely" button with `Key` icon
  - Loading: `Loader2`
  - On success: updates masked key display, toast "Gemini API key saved securely"

**Key saved state**:
- Masked key shown (monospace): `****[last4]`
- "Active" status label (brand color)
- **Remove Key button** (`Trash2` icon, destructive):
  - Loading: `Loader2`
  - Removes key, clears masked display, toast "Gemini API key removed"

### 14.5 Data & Privacy Card
- Destructive border tint (`border-destructive/20`)
- Title: "Data & Privacy" (destructive red)
- Description about GDPR right to erasure
- "Delete Account (contact support)" button:
  - **Disabled** (`opacity-50 cursor-not-allowed`)
  - Variant: destructive

---

## 15. Admin Page `/admin`

> Accessible only to users with `role === "admin"`.

### 15.1 Page Header
- `Shield` icon in stale-color tinted box
- Title: "Admin Panel"
- Subtitle: "Platform overview and system telemetry"

### 15.2 Stats Grid (4 cards)
- 2-column mobile, 4-column desktop
- Loaded with `<Suspense>` (skeleton shown while loading)
- **Total Users** (Users icon, upcoming color)
- **Total Documents** (BookOpen icon, brand color)
- **Total Notes** (BarChart3 icon, stale color)
- **Total Terms** (BarChart3 icon, completed color)
- Each: icon in tinted box, large monospace number, label
- **Skeleton**: spinner in each card while loading

### 15.3 System Status Card
- Title: "System Status"
- 3 rows: Database, Authentication, Gemini API
- Each row: label + status pill
  - Green pill: `bg-state-today/10 text-state-today` (Connected, Active)
  - Amber/stale pill: `bg-state-stale/10 text-state-stale` (Phase 2 note)
  - Red pill: `bg-destructive/10 text-destructive` (for failures, not currently shown)
- Bottom border on each row except last

---

## 16. Chrome Extension

> Companion browser extension for clipping web content into lostbae.

### 16.1 Extension Popup (`popup.html` / `popup.js`)
- Appears when clicking the extension icon in Chrome toolbar
- Styled with its own CSS (`popup.css`)

### 16.2 Content Script (`content.js` / `content.css`)
- Injected into web pages
- Enables page-level content selection/clipping

### 16.3 Clipper API Route (`/api/documents/clipper`)
- Receives clipped content from extension
- Creates document in user's library

### 16.4 Features (from story spec `9-4-chrome-extension-clipper.md` and `spec-9-4-clipper-tags-terminology.md`)
- One-click clip of current web page into lostbae
- Title auto-extracted from page
- URL saved as document source
- Tags input in popup
- Terminology capture support
- Authentication: uses lostbae session cookie

---

## Appendix A: Cross-Cutting UI Behaviors

### Hover & Transition Patterns (global)
- Most interactive elements: `transition-colors` on hover
- Buttons: scale on active `active:scale-95`
- `bouncy-hover` class: custom spring animation on certain primary buttons
- Nav links: smooth color + background transitions
- Table rows: `task-row-hover` custom hover style
- Cards: `hover:shadow-soft` or `hover:shadow-hover` shadow escalation

### Animation Classes
- `animate-slide-up`: slide-in from below (modals, mobile sidebars, bulk action bar)
- `animate-slide-down`: slide-in from above (error banners)
- `animate-fade-in`: fade in (command palette backdrop)
- `animate-spin`: spinning loaders
- `transition-opacity duration-300`: video controls fade

### Focus States
- All interactive elements: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/50`
- Inputs: custom focus ring with brand color

### Accessibility
- `aria-label` on all icon-only buttons
- `aria-current="page"` on active nav links
- `aria-expanded` on collapsible rows
- `aria-hidden="true"` on decorative SVG icons
- `role="button"` + `tabIndex=0` on div-based interactive areas

### Toast System
- Variants: success (green), error (red), neutral
- Auto-dismissed
- Shown for every user-initiated mutation

### Custom Scrollbar
- `custom-scrollbar` class applied to horizontal scroll containers (tag strips, mobile nav tabs)

### Responsive Breakpoints
- `sm`: 640px — tablet portrait and above
- `md`: 768px — shows desktop sidebar, hides hamburger
- `lg`: 1024px — shows sub-pages sidebar, document table extra columns
- `xl`: 1280px — music grid adds column

### localStorage Persistence Keys
| Key | What it stores |
|-----|---------------|
| `lostbae_dashboard_sort` | Dashboard task queue sort preference |
| `lostbae_doc_sort` | Documents list sort preference |
| `lostbae_doc_media` | Documents list media-type filter |
| `lostbae_study_sidebar_tab` | Study sidebar active tab (overview/notes/terms) |
| `lostbae_study_sidebar_compact` | Study sidebar compact mode toggle |
| `lostbae_global_fab_position` | Global FAB x/y position |

### SRS (Spaced Repetition) States
| Status | Badge label | Color |
|--------|-------------|-------|
| `first_visit` | First Visit | upcoming (blue) |
| `revision` | Revision | today (brand) |
| `updated` | Updated | stale (amber) |
| `completed` | Completed | completed (green) |

### Difficulty Badge Colors
| Difficulty | Color variant |
|-----------|---------------|
| `easy` | easy (green tint) |
| `medium` | medium (amber tint) |
| `hard` | hard (red tint) |
