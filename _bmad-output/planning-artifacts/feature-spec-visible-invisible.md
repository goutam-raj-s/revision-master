---
title: lostbae — Feature Spec (Visible vs Invisible)
status: living
last_updated: 2026-06-14
owner: Gautam
legend:
  - "✅ shipped & on master"
  - "🔌 built but needs external credentials/setup to fully function"
  - "🚧 deferred / in progress / not yet built"
categorisation:
  visible: "User-facing — something the end user sees or interacts with in the UI."
  invisible: "Backend, data model, infrastructure, build/deploy, SEO machinery — no direct UI surface."
---

# lostbae — Complete Feature Specification (Visible vs Invisible)

Every feature in the product (original MVP + all session work), split into
**Visible** (user-facing) and **Invisible** (backend / infra / data).
Source of truth: the codebase on `master`.

---

## PART A — VISIBLE FEATURES (user-facing)

### A1. Authentication & Account
| # | Feature | Status |
|---|---|---|
| V1 | Email/password register, login, logout | ✅ |
| V2 | Google / GitHub / Discord OAuth sign-in | ✅ |
| V3 | Password reset via email | ✅ |
| V4 | Profile settings (name, email) | ✅ |
| V5 | Gemini API key field in settings | ✅ |
| V6 | Delete account (GDPR erasure, type-to-confirm) | ✅ |
| V7 | Export all my data (JSON download) | ✅ |

### A2. Documents & Ingestion
| # | Feature | Status |
|---|---|---|
| V8 | Add public Google Doc URL, auto-extract title | ✅ |
| V9 | View rendered Google Doc in-app (iframe) | ✅ |
| V10 | Difficulty (Easy/Medium/Hard) + delete | ✅ |
| V11 | Document status lifecycle (First Visit → Revision → Updated → Completed) | ✅ |
| V12 | Initial review-delay configuration | ✅ |
| V13 | File upload documents (PDF, media) | ✅ |
| V14 | Native rich-text documents (create from scratch) | ✅ |
| V15 | Sub-pages / hierarchical document tree | ✅ |
| V16 | Bulk-delete documents | ✅ |
| V17 | Reading progress (0–100%) per document | ✅ |
| V18 | Backlinks / "Linked from" (docs that @-mention this one) | ✅ |
| V19 | Export document as Markdown | ✅ |
| V20 | Export document as PDF | ✅ |
| V21 | Inline title rename | ✅ |

### A3. Rich-Text Editor (Tiptap)
| # | Feature | Status |
|---|---|---|
| V22 | Bold/italic/underline/strike, H1–H3, lists, alignment, font size | ✅ |
| V23 | Multicolor sticky highlighter (Cmd+Shift+H etc.) | ✅ |
| V24 | Collapsible image annotations (paste/drop/resize/copy) | ✅ |
| V25 | Page-break + Google-Docs-style Page View | ✅ |
| V26 | Slash command menu (`/`) | ✅ |
| V27 | Selection bubble toolbar | ✅ |
| V28 | Task lists / checkboxes | ✅ |
| V29 | In-document find & replace (Cmd+F) | ✅ |
| V30 | Text color | ✅ |
| V31 | Code blocks with syntax highlighting | ✅ |
| V32 | Table row/column controls | ✅ |
| V33 | @-mention own docs/terms (inline links) | ✅ |
| V34 | Document outline / TOC | ✅ |
| V35 | Quote / inline-code / divider toolbar buttons | ✅ |

### A4. Spaced Repetition & Review
| # | Feature | Status |
|---|---|---|
| V36 | Task queue dashboard populated from schedule | ✅ |
| V37 | Filters: Today / Pending / Upcoming / All | ✅ |
| V38 | Reschedule (+N days) and mark completed | ✅ |
| V39 | Split-screen glass review modal | ✅ |
| V40 | Memory confidence buttons (Struggled / Okay / Easy) → tunes next interval | ✅ |
| V41 | Reschedule + Mark-complete controls on every surface (doc detail, study sidebar, queue rows, YouTube) | ✅ |

### A5. Notes, Tags & Terminology
| # | Feature | Status |
|---|---|---|
| V42 | Per-document notes, tags, terminology | ✅ |
| V43 | Filter repository by tags; Terminology browser | ✅ |
| V44 | Edit/done/reschedule notes & terms | ✅ |
| V45 | A–Z index jump bar | ✅ |
| V46 | Source-document link on terms | ✅ |
| V47 | Terminology flashcard practice mode (reveal + rate) | ✅ |
| V48 | Glossary depth: example / anti-example / related terms | ✅ |
| V49 | Export glossary (Markdown / CSV) | ✅ |

### A6. Similarity & Consolidation
| # | Feature | Status |
|---|---|---|
| V50 | Title/tag similarity check on submission | ✅ |
| V51 | Duplicate warning banner | ✅ |
| V52 | Merge overlapping docs into topic trees | ✅ |
| V53 | Keyword search on titles/tags | ✅ |

### A7. Dashboard & Engagement
| # | Feature | Status |
|---|---|---|
| V54 | Core metrics — animated, clickable stat cards with mascots | ✅ |
| V55 | Most Repeated / Least Revised insights | ✅ |
| V56 | Today's Focus panel | ✅ |
| V57 | Weakest Tags ("Needs Attention") panel | ✅ |
| V58 | Daily goal ring (configurable target) | ✅ |
| V59 | Continue where you left off (recent docs) | ✅ |
| V60 | Getting-started onboarding checklist | ✅ |
| V61 | Review streak + 6-month activity heatmap | ✅ |
| V62 | Inbox-zero animated completion scene (12 companions, selectable) | ✅ |
| V63 | Pomodoro / focus timer (floating) | ✅ |

### A8. Stats Page (`/stats`)
| # | Feature | Status |
|---|---|---|
| V64 | Streak, best streak, weekly + total reviews | ✅ |
| V65 | Activity heatmap | ✅ |
| V66 | 7-day review trend chart | ✅ |
| V67 | Achievements / milestone badges | ✅ |
| V68 | Recent activity feed | ✅ |
| V69 | Share my stats → public page | ✅ |

### A9. AI Acceleration (Gemini) — original epic 8
| # | Feature | Status |
|---|---|---|
| V70 | Auto-glossary generation | 🚧 marked done in sprint, not in code — DO NOT TOUCH per owner |
| V71 | Quiz-me flashcards | 🚧 |
| V72 | Tag suggestions | 🚧 |

### A10. YouTube / Video
| # | Feature | Status |
|---|---|---|
| V73 | YouTube + external video study sessions | ✅ |
| V74 | Timestamped notes (press T) | ✅ |
| V75 | Timestamp navigation list (jump to [mm:ss]) | ✅ |
| V76 | Watch progress + Resume-from pill | ✅ |
| V77 | Playlists (import, bookmark) | ✅ |
| V78 | Reliable playlist enumeration + persisted videos + refresh/remove | ✅ |
| V79 | Fullscreen + floating notes overlay | ✅ |
| V80 | Reschedule/complete/mark-done a video | ✅ |
| V81 | Inline video rename | ✅ |

### A11. Collections & Sharing
| # | Feature | Status |
|---|---|---|
| V82 | Topic collections (group docs) + CRUD | ✅ |
| V83 | Add to collection from doc detail | ✅ |
| V84 | Shareable study packs (public `/shared/pack/[token]`) | ✅ |
| V85 | Public document share (read/write by token) | ✅ |
| V86 | Shared-doc viewer: branded layout, sticky sidebar, per-subpage content | ✅ |
| V87 | YouTube session/playlist sharing | ✅ |

### A12. Posts (Social)
| # | Feature | Status |
|---|---|---|
| V88 | Draft composer (LinkedIn / X / Instagram / Other) | ✅ |
| V89 | Save drafts | ✅ |
| V90 | Schedule posts (datetime) | ✅ |
| V91 | Post history (Draft / Scheduled / Published) | ✅ |
| V92 | Manual publish (X intent / LinkedIn open) + store published URL | ✅ |
| V93 | Automatic API publishing (LinkedIn/Meta) | 🔌 needs developer apps + OAuth |
| V94 | Instagram carousel export, content calendar, approval flow | 🚧 |

### A13. UX / Theme / Global
| # | Feature | Status |
|---|---|---|
| V95 | Dark mode (Light/Dark/System, light default) | ✅ |
| V96 | Command palette 2.0 (docs, terms, actions, recents) | ✅ |
| V97 | Keyboard shortcuts cheat-sheet (`?`) | ✅ |
| V98 | Per-page quick-guide popovers | ✅ |
| V99 | Global clipper widget (in-app) | ✅ |
| V100 | Zen design system, micro-interactions, responsive, WCAG AA | ✅ |
| V101 | Companion/character customization (settings) | ✅ |

### A14. Public / Marketing / SEO (visible to logged-out visitors)
| # | Feature | Status |
|---|---|---|
| V102 | Landing page + desktop-download section (Mac/Windows/Web) | ✅ |
| V103 | Blog (`/blog` + 3 seed articles) | ✅ |
| V104 | Programmatic use-case landing pages (`/for/[useCase]`) | ✅ |
| V105 | Public review-stats page (`/shared/stats/[token]`) | ✅ |
| V106 | Privacy / Terms pages | ✅ |

### A15. Desktop App (Electron)
| # | Feature | Status |
|---|---|---|
| V107 | Native macOS (.dmg) + Windows (.exe) installers | ✅ |
| V108 | Loads deployed web app; auto-syncs with deploys | ✅ |
| V109 | Native menus, tray, single-instance, window-state, offline screen | ✅ |
| V110 | Dock/tray due-review badge | ✅ |
| V111 | Custom branded icon | ✅ |
| V112 | Auto-update (electron-updater) | 🔌 needs published GitHub Release + macOS code signing |

---

## PART B — INVISIBLE FEATURES (backend / infra / data)

### B1. Data Model — MongoDB collections
| # | Collection | Purpose | Status |
|---|---|---|---|
| I1 | users | accounts, role, gemini key, emailReminders, lastReminderSentAt | ✅ |
| I2 | sessions | auth sessions (rm_session cookie) | ✅ |
| I3 | documents | docs incl. readingProgress, status, tags, content, gdrive sync fields | ✅ |
| I4 | repetitions | SRS schedule per doc | ✅ |
| I5 | notes | per-doc notes | ✅ |
| I6 | terms | glossary incl. example/antiExample/relatedTerms | ✅ |
| I7 | youtube_sessions | video sessions incl. status (completed) | ✅ |
| I8 | youtube_repetitions | SRS for videos | ✅ |
| I9 | youtube_bookmarks | incl. persisted playlist videos[] | ✅ |
| I10 | youtube_playlists | saved playlists | ✅ |
| I11 | document_shares / youtube_shares | token-based public sharing | ✅ |
| I12 | google_integrations | encrypted OAuth tokens for Docs import | ✅ |
| I13 | review_events | every review (source, dayKey, confidence) → streak/heatmap/activity | ✅ |
| I14 | stat_shares | public stats-share tokens | ✅ |
| I15 | topic_collections | collections incl. publicToken for study packs | ✅ |
| I16 | post_drafts | social drafts (platform, status, scheduledFor, publishedUrl) | ✅ |
| I17 | password_reset_tokens, login-records | auth support | ✅ |

### B2. Scheduling / SRS Engine
| # | Feature | Status |
|---|---|---|
| I18 | Difficulty-aware growing-interval SRS engine | ✅ |
| I19 | Confidence-adjusted intervals (easy ×1.5, struggled → tomorrow) | ✅ |
| I20 | Streak + heatmap computation from review_events | ✅ |

### B3. Server Actions / API
| # | Feature | Status |
|---|---|---|
| I21 | Document CRUD, reschedule, complete, merge, similarity | ✅ |
| I22 | YouTube reschedule / complete / mark-done actions | ✅ |
| I23 | getBacklinks, setReadingProgress, getRecentDocs | ✅ |
| I24 | Collections CRUD + share/unshare + public pack fetch | ✅ |
| I25 | Stat-share create + public stats fetch | ✅ |
| I26 | Post-draft CRUD | ✅ |
| I27 | Mentions search (docs+terms for @-mention) | ✅ |
| I28 | Recent-activity feed query | ✅ |
| I29 | Google Docs import + hourly auto-sync | ✅ |
| I30 | `/api/badge` (desktop due-count, session-authed) | ✅ |
| I31 | `/api/cron/reminders` (daily email digest, secret-guarded) | ✅ |
| I32 | `/api/clip` web-clipper ingest endpoint | 🚧 in progress |

### B4. Email
| # | Feature | Status |
|---|---|---|
| I33 | Share, password-reset emails | ✅ |
| I34 | Daily review-reminder digest email | ✅ (needs CRON_SECRET + scheduler) |

### B5. YouTube Reliability
| # | Feature | Status |
|---|---|---|
| I35 | YouTube Data API v3 playlist enumeration (primary) | ✅ (needs YOUTUBE_API_KEY) |
| I36 | play-dl + page-scrape fallbacks; FIFO order fix | ✅ |
| I37 | Tolerant URL parsing (partial/garbled links) | ✅ |
| I38 | Persist playlist videos on bookmark (survives fetch glitches) | ✅ |

### B6. SEO / PWA Infrastructure
| # | Feature | Status |
|---|---|---|
| I39 | Per-page metadata + Open Graph + Twitter cards | ✅ |
| I40 | Dynamic OG image (edge) | ✅ |
| I41 | sitemap.ts / robots.ts (auto-includes blog + use-cases) | ✅ |
| I42 | PWA manifest + icons | ✅ |
| I43 | JSON-LD structured data (SoftwareApplication, BlogPosting) | ✅ |
| I44 | Markdown blog engine (turndown/marked) | ✅ |

### B7. Theming / Build / Tooling
| # | Feature | Status |
|---|---|---|
| I45 | Class-based dark mode (`@custom-variant dark`) + token overrides | ✅ |
| I46 | No-FOUC theme bootstrap | ✅ |
| I47 | Tiptap stack pinned to 3.22.5 + overrides (deterministic install) | ✅ |
| I48 | `apps/` excluded from web tsconfig (web build skips Electron) | ✅ |

### B8. Desktop Shell (Electron, `apps/desktop/`)
| # | Feature | Status |
|---|---|---|
| I49 | Per-env URL config, security baseline (contextIsolation, nav allowlist) | ✅ |
| I50 | External links → system browser; clipboard permissions | ✅ |
| I51 | Badge polling via session.fetch(`/api/badge`) | ✅ |
| I52 | electron-builder packaging (dmg universal, nsis) | ✅ |

### B9. Web Clipper / Chrome Extension (`apps/extension/`)
| # | Feature | Status |
|---|---|---|
| I53 | MV3 popup: clip current tab → save to library with tags/note | 🚧 in progress |
| I54 | Context-menu "Save selection to lostbae" | 🚧 |

---

## PART C — NOT YET BUILT (need external setup or are large subsystems)

| # | Feature | Blocker |
|---|---|---|
| C1 | Social auto-publish (LinkedIn / Instagram via Meta API) | Developer apps, OAuth, Meta app review |
| C2 | Chrome extension publishing | Web Store account (scaffold buildable) |
| C3 | Web push notifications | VAPID key pair + service worker |
| C4 | Offline mode / local-first drafts | Large architectural change; conflicts with remote-URL desktop model |
| C5 | Version history / diff UI | Snapshot-on-save storage + diff subsystem |
| C6 | Per-section review tracking; manual video chapters | Buildable next (deferred) |
| C7 | AI features (auto-glossary, quiz, tag suggest) | Owner instruction: do not touch |

---

## DEPLOYMENT NOTES (env / setup required for full function)

- `YOUTUBE_API_KEY` (server) — reliable playlist videos
- `CRON_SECRET` (server) + daily scheduler hitting `/api/cron/reminders` — review reminders
- `NEXT_PUBLIC_APP_URL` — canonical/OG/sitemap absolute URLs
- Deploy server: change `git pull` → `git fetch origin && git reset --hard origin/master` (server accumulated local commits causing merge conflicts; also recreate an empty deploy.sh if needed)
- Desktop auto-update: publish a GitHub Release; macOS needs code signing

---

## SUMMARY COUNTS
- Visible features shipped (✅): ~104
- Invisible features shipped (✅): ~48
- Built-but-needs-setup (🔌): 3 (social auto-publish, desktop auto-update, parts gated on env keys)
- Deferred / not built (🚧): AI suite (intentional), Chrome ext (in progress), push, offline, version history, social automation
