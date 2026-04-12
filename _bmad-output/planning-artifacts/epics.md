---
stepsCompleted: ['step-01-validate-prerequisites.md', 'step-02-design-epics.md', 'step-03-create-stories.md', 'step-04-final-validation.md']
inputDocuments: ['prd.md', 'architecture.md', 'ux-design-specification.md']
workflowType: 'create-epics-and-stories'
---

# Revision-Master - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Revision-Master, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can add a public Google Doc URL; system automatically extracts and displays the title.
FR2: User can view the rendered contents of any linked Google Doc within the application dashboard.
FR3: User can assign a difficulty level (Easy/Medium/Hard) and delete document links.
FR4: System will cache the last-known title and content snapshot for broken-link resilience.
FR5: System explicitly tracks and displays document status (First Visit, Revision, Updated, Completed).
FR6: System dynamically updates status based on active user interactions (e.g., finishing notes).
FR7: User can configure initial review delays (default: 2 days) upon submission.
FR8: System accurately populates documents into the active task list based on schedule dates.
FR9: User can reschedule document availability (+N days) and permanently mark them completed to remove them.
FR10: User can filter the task queue by: Today, Pending, Upcoming, All Docs.
FR11: User can securely create independent notes, custom tags, and terminology definitions mapped to specific documents.
FR12: User can filter the whole repository by custom tags and browse a distinct Terminology interface.
FR13: Notes and terms can be independently edited, marked as done, or rescheduled.
FR14: System actively compares new submissions against existing documents using titles and tags.
FR15: System displays warning banners during submission when duplicate or overlapping insights are detected.
FR16: System provides keyword search on titles and tags, returning accurate result sets within 1 second.
FR17: User can explicitly "Merge" logically overlapping URLs into unified topic trees.
FR18: System generates core metrics: Total Documents, Pending Revisions, Total Completed.
FR19: System aggregates metrics for "Most Repeated Topics" and "Least Revised Areas."
FR20: User can explicitly securely provide and store a Gemini API key within their profile/settings.

### NonFunctional Requirements

NFR1: Initial page load time for the dashboard under 3 seconds.
NFR2: Google Doc iframe fetching and client-ready rendering must complete within 5 seconds for typical files.
NFR3: Keyword searches return in < 1 second; similarity checks during submission under 3 seconds.
NFR4: Fully mobile-responsive layouts emphasizing task-clearance on the go, with desktop-first design.
NFR5: User Gemini API keys are encrypted at rest and strictly omitted from all client-side network telemetry or public logs.
NFR6: Mandatory transport layer security (HTTPS) for all authenticated sessions and API routing operations.
NFR7: Full support for GDPR "Right to Erasure" policies for all user-generated graph data.
NFR8: Complete separation between the platform and native Google Doc mutation.
NFR9: Graceful degradation on dead Google Docs using cached artifact history.
NFR10: Phase 1 database schema natively structured for multi-tenant users.
NFR11: Gemini API integrations defensively coded for timeouts, rate-limiting HTTP headers, and silent failovers.
NFR12: Persistent queues guarantee that once scheduled, revision reminders are never silently skipped or lost.
NFR13: All primary interactive elements adhere to WCAG 2.1 Level AA conformance criteria.
NFR14: Standardized ARIA labels for task list actions and spaced repetition schedule manipulators.
NFR15: Fully semantic DOM structure guaranteeing keyboard navigability.

### Additional Requirements

- **Starter Template [Epic 1 Impact]:** Initialize project using `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` as specified in Architecture.
- **Database:** Use raw `mongodb` Node.js driver with a strict Singleton connection pool pattern optimized for Vercel serverless cold starts. Collections: Users, Documents, Repetitions.
- **Authentication:** Utilize `better-auth` for session management and RBAC, integrating with Next.js App Router middleware for server-side route gating.
- **Data Fetching:** Prefer React Server Components (RSC) and Next.js Server Actions over client-side fetching. Push SRS algorithmic calculations to the server edge.
- **State Management:** Zustand for client-side ephemeral state; Radix UI / shadcn/ui primitives for accessible component logic.
- **Caching Strategy:** Leverage Next.js Data Cache with `revalidateTag()` for surgical cache invalidation after Server Action mutations.
- **Error Handling:** Use Next.js `error.tsx` boundaries at route level. Implement Zod schema validation on all Server Action inputs.
- **Project Structure:** App Router with route groups: `(admin)`, `(auth)`, `(dashboard)`, `/study/[docId]` for Focus Mode.

### UX Design Requirements

UX-DR1: Implement "Zen Productivity (Mint Tint)" global theme — sage/mint cream canvas (#f1f5f2), pristine white card surfaces (#FFFFFF) with border-radius 1.5rem, deep forest-slate typography (#1e2d24), muted mossy gray secondary text (#6b7f73).
UX-DR2: Implement semantic state color system applied consistently across all views — Emerald Green (#059669) for Active/Today, Soft Blue (#3b82f6) for Upcoming/Scheduled, Muted Amber (#d97706) for Rescheduled/Stale, Slate Gray (#64748b) for Completed/Mastered.
UX-DR3: Configure Inter as primary UI/heading typeface, Newsreader (serif) for document titles and reading focus contexts, system monospace for dates and SRS metrics. Type scale optimized for UI density (text-sm, text-base, max text-xl).
UX-DR4: Build a Split-Screen Glass Modal for the document clearance loop — 70% left pane (Google Doc iframe), 30% right pane (metadata sidebar: notes, tags, difficulty, "Clear Task" CTA), powered by shadcn Dialog primitive with backdrop-blur-xl. States: Loading (shimmer skeleton), Active, Completing (fade-and-slide-out animation).
UX-DR5: Create Task Row Card component for the high-density dashboard — urgency color-coded indicator, document title, truncated notes preview, interactive tag badges, hover lift effect (shadow-sm), and keyboard shortcut hint tooltip on hover.
UX-DR6: Implement micro-interaction system — bouncy hover transforms (cubic-bezier(0.34, 1.56, 0.64, 1), hover:scale-105), swept task completion animations (slide-right + fade-out), fluid list reordering when items are removed, toast confirmations for routine feedback.
UX-DR7: Implement Command Palette (Cmd+K / Ctrl+K) for universal search and cross-app keyboard navigation using shadcn Command primitive.
UX-DR8: Create "Inbox Zero" empty state — calming success visualization (elegant vector graphic + "All caught up for today" message) rendered when the daily revision queue is cleared.
UX-DR9: Implement desktop-first responsive strategy — split-screen layouts activate at lg (1024px+), sidebars collapse to hamburger at md (768px), stacked linear read-out below 768px with external Google Doc link opening and swipe-to-complete.
UX-DR10: Ensure WCAG 2.1 Level AA compliance — minimum 4.5:1 contrast ratios for all text, focus-visible:ring-2 on every interactive element, full keyboard navigability without mouse, ARIA roles via Radix UI primitives.
UX-DR11: Implement progressive disclosure on dashboard task list — primary view shows only title + next-review urgency indicator; detailed notes, full tag list, and history revealed only upon expansion/interaction.
UX-DR12: Build Study Workspace Sidebar — split-pane layout parsing the reading page into an embedded document viewer (70%) and a specialized right-hand sidebar (30%) allowing for immediate glossary term capture and note taking without breaking focus.
UX-DR13: Implement Similarity Warning Banner — non-alarmist calm blue/purple design that gracefully pushes content down from top of interface, presenting "Insight match detected" with Merge/Ignore options, never blocking the primary workflow.

### FR Coverage Map

FR1: Epic 2 — Google Doc URL ingestion + title extraction
FR2: Epic 2 — View rendered Google Doc in-app (iframe)
FR3: Epic 2 — Assign difficulty (Easy/Medium/Hard) + delete
FR4: Epic 2 — Cache last-known title/content for broken links
FR5: Epic 2 — Track document status lifecycle
FR6: Epic 2 — Dynamic status updates from user interactions
FR7: Epic 2 — Configure initial review delay (default +2 days)
FR8: Epic 3 — Populate active task list from schedule dates
FR9: Epic 3 — Reschedule (+N days) and mark completed
FR10: Epic 3 — Filter task queue: Today / Pending / Upcoming / All Docs
FR11: Epic 4 — Create notes, tags, terminology per document
FR12: Epic 4 — Filter by tags + Terminology interface
FR13: Epic 4 — Edit/done/reschedule notes & terms
FR14: Epic 5 — Similarity comparison on submission
FR15: Epic 5 — Duplicate warning banners
FR16: Epic 5 — Keyword search < 1 second
FR17: Epic 5 — Merge overlapping URLs into topic trees
FR18: Epic 6 — Core dashboard metrics
FR19: Epic 6 — Most Repeated / Least Revised analytics
FR20: Epic 1 — Gemini API key secure storage in settings

## Epic List

### Epic 1: Project Foundation & Authentication
Users can register, log in, and access a secure personalized dashboard. Admin users are gated to an admin panel. This epic stands up the project from the starter template, configures the database, and delivers a working authenticated shell with profile settings including Gemini API key storage.
**FRs covered:** FR20
**Additional Reqs:** Starter Template, MongoDB Singleton, better-auth RBAC, App Router structure

### Epic 2: Document Ingestion & State Tracking
Users can paste a public Google Doc URL, have its title auto-extracted, assign difficulty, configure an initial review schedule, and see a persistent document status lifecycle (First Visit → Revision → Updated → Completed). Broken links degrade gracefully via cached snapshots.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7

### Epic 3: Spaced Repetition Task Queue
Users see a high-density task dashboard populated from their scheduled review dates, filter by Today / Upcoming / All Docs, reschedule documents (+N days), and permanently mark them completed. The clearance loop uses the Split-Screen Glass Modal for immersive review.
**FRs covered:** FR8, FR9, FR10

### Epic 4: Notes, Tags & Terminology
Users can create, edit, and manage independent notes, custom tags, and terminology definitions mapped to specific documents. The full repository is browsable/filterable by tags, and a distinct Terminology interface surfaces all defined terms. Notes and terms can be independently rescheduled or marked as done.
**FRs covered:** FR11, FR12, FR13

### Epic 5: Similarity Detection & Knowledge Consolidation
Upon submission, the system actively compares new documents against existing ones using title/tag matching (Phase 1). Warning banners alert users to duplicates, and users can explicitly merge overlapping URLs into unified topic trees. Keyword search surfaces documents within 1 second.
**FRs covered:** FR14, FR15, FR16, FR17

### Epic 6: Learning Dashboard & Analytics
Users can view summary metrics (Total Documents, Pending Revisions, Completed), and the system surfaces aggregated insights like "Most Repeated Topics" and "Least Revised Areas" to guide their learning strategy.
**FRs covered:** FR18, FR19

### Epic 7: Design System & UX Polish
The full Zen Productivity visual system is applied across all views — semantic state colors, micro-interactions (bouncy hover, sweep animations), Command Palette, Inbox Zero empty state, responsive breakpoints, progressive disclosure, and WCAG 2.1 AA accessibility compliance.
**FRs covered:** UX-DR1 through UX-DR13, NFR4, NFR13, NFR14, NFR15

### Epic 8: AI Acceleration & Advanced Learning
Integrate Gemini AI and advanced workflows to shift the user from passive reading into active, automated recall. The system auto-generates terminology, creates intelligent "Quiz Me" flashcards, suggests tags, and provides built-in focus timers.
**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27

---

## Epic 1: Project Foundation & Authentication

Users can register, log in, and access a secure personalized dashboard. Admin users are gated to an admin panel. This epic stands up the project from the starter template, configures the database, and delivers a working authenticated shell with profile settings including Gemini API key storage.

### Story 1.1: Initialize Project from Starter Template

As a **developer**,
I want to initialize the Revision-Master project using the official Next.js starter with TypeScript, Tailwind, ESLint, App Router, and src directory,
So that I have a production-ready foundation optimized for Vercel deployment.

**Acceptance Criteria:**

**Given** no existing project scaffold
**When** the developer runs `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
**Then** a working Next.js application builds and runs on `localhost:3000`
**And** the project structure includes `/src/app` with App Router layout
**And** TypeScript, Tailwind CSS, and ESLint are correctly configured
**And** import alias `@/*` resolves correctly

### Story 1.2: MongoDB Singleton Connection

As a **developer**,
I want a MongoDB client connection module using the native driver with a Singleton pool pattern,
So that database connections are efficiently reused across Vercel serverless invocations without hitting connection limits.

**Acceptance Criteria:**

**Given** the MongoDB connection module exists at `/src/lib/db/`
**When** multiple serverless functions invoke the database client concurrently
**Then** all invocations share a single connection pool instance
**And** cold starts establish a new connection within 500ms
**And** the module exports typed helper functions for the `Users`, `Documents`, and `Repetitions` collections

### Story 1.3: User Registration & Login with better-auth

As a **user**,
I want to create an account and securely log in,
So that my documents, schedules, and settings are persisted and protected.

**Acceptance Criteria:**

**Given** the user is on the login/registration page
**When** they submit valid credentials (email/password)
**Then** a new user record is created in the `Users` collection (registration) or a session is established (login)
**And** the session is managed by `better-auth` with secure HTTP-only cookies
**And** invalid credentials produce a clear, non-leaking error message
**And** after successful login the user is redirected to the dashboard

### Story 1.4: Protected Dashboard Shell & Route Groups

As an **authenticated user**,
I want to see a personalized dashboard shell after login,
So that I have a central workspace to manage my documents and revisions.

**Acceptance Criteria:**

**Given** the user is authenticated
**When** they navigate to the dashboard
**Then** a layout shell renders with a sidebar, header, and main content area
**And** unauthenticated users are redirected to the login page via middleware
**And** the App Router route groups `(auth)`, `(dashboard)`, and `(admin)` are correctly configured
**And** the sidebar displays navigation for Dashboard, Documents, and Settings

### Story 1.5: Admin Route Gating & Role-Based Access

As an **admin user**,
I want the admin panel to be accessible only to users with the admin role,
So that sensitive administrative features are protected from regular users.

**Acceptance Criteria:**

**Given** a user with role "admin" is authenticated
**When** they navigate to `/admin`
**Then** the admin panel layout renders successfully
**And** a non-admin user navigating to `/admin` receives a 403 or is redirected to the dashboard
**And** the `(admin)` route group uses a server-side layout guard that verifies the session role
**And** middleware intercepts admin routes before page rendering

### Story 1.6: User Profile & Gemini API Key Storage

As a **user**,
I want to securely provide and store my Gemini API key in my profile settings,
So that AI-powered features can use my personal API key without exposing it.

**Acceptance Criteria:**

**Given** the user navigates to Settings/Profile
**When** they enter a Gemini API key and save
**Then** the key is encrypted at rest in the `Users` collection (NFR5)
**And** the key is never included in client-side responses or network telemetry
**And** the saved key displays as masked/redacted in the UI (e.g., `sk-****...1234`)
**And** the user can update or delete their stored key
**And** Zod validation ensures the key field is properly formatted before saving

---

## Epic 2: Document Ingestion & State Tracking

Users can paste a public Google Doc URL, have its title auto-extracted, assign difficulty, configure an initial review schedule, and see a persistent document status lifecycle (First Visit → Revision → Updated → Completed). Broken links degrade gracefully via cached snapshots.

### Story 2.1: Google Doc URL Submission & Title Extraction

As a **user**,
I want to paste a public Google Doc URL and have the system automatically extract and display its title,
So that adding new documents to my knowledge graph is frictionless.

**Acceptance Criteria:**

**Given** the user is on the document ingestion form
**When** they paste a valid public Google Doc URL and submit
**Then** the system fetches the document's title and displays it within 3 seconds
**And** a new record is created in the `Documents` collection with the URL, extracted title, and user ID
**And** an invalid or non-public URL produces a clear error message without creating a record
**And** the document status is set to "First Visit" upon creation

### Story 2.2: Document Viewer with Embedded Google Doc

As a **user**,
I want to view the rendered contents of any linked Google Doc within the application,
So that I can review my documents without leaving the platform.

**Acceptance Criteria:**

**Given** a document exists in the user's collection
**When** they click to view it
**Then** the Google Doc renders in an embedded iframe within the application (route `/study/[docId]`)
**And** the iframe loads within 5 seconds for typical documents (NFR2)
**And** the platform maintains complete read-only separation from the Google Doc (NFR8)
**And** a loading skeleton/shimmer is displayed while the iframe loads

### Story 2.3: Difficulty Assignment & Document Deletion

As a **user**,
I want to assign a difficulty level (Easy/Medium/Hard) to any document and delete documents I no longer need,
So that I can prioritize my study queue and keep my repository clean.

**Acceptance Criteria:**

**Given** a document exists in the user's collection
**When** the user selects a difficulty level (Easy, Medium, or Hard)
**Then** the difficulty is persisted to the document record immediately
**And** the difficulty indicator is visible in the document list and detail views
**Given** a document exists
**When** the user confirms deletion
**Then** the document and all associated data (notes, tags, repetition schedules) are permanently removed
**And** a confirmation dialog prevents accidental deletion

### Story 2.4: Content Caching for Broken-Link Resilience

As a **user**,
I want the system to cache the last-known title and content snapshot of my documents,
So that I can still access document information even if the original Google Doc link breaks.

**Acceptance Criteria:**

**Given** a document has been successfully fetched at least once
**When** the Google Doc URL becomes inaccessible (404, permission revoked, etc.)
**Then** the system displays the cached title and last-known content snapshot
**And** a visual indicator shows the document is in "degraded" state (NFR9)
**And** the system periodically attempts to re-validate the URL
**And** cached snapshots are stored in the `Documents` collection alongside the live URL

### Story 2.5: Document Status Lifecycle & Dynamic Updates

As a **user**,
I want to see the explicit status of each document (First Visit, Revision, Updated, Completed) and have it update dynamically based on my interactions,
So that I always know where each document stands in my learning journey.

**Acceptance Criteria:**

**Given** a document exists in the system
**When** the document is first created, its status is "First Visit"
**Then** the status transitions to "Revision" after the first review is completed
**And** the status changes to "Updated" when the user adds or edits notes/tags
**And** the status changes to "Completed" when the user explicitly marks it complete
**And** status transitions are persisted to the `Documents` collection
**And** the status is displayed with the semantic state color system (UX-DR2: Emerald/Blue/Amber/Gray)

### Story 2.6: Initial Review Schedule Configuration

As a **user**,
I want to configure an initial review delay (default: 2 days) when submitting a new document,
So that the system schedules my first review at the optimal interval.

**Acceptance Criteria:**

**Given** the user is submitting a new document
**When** they accept the default (+2 days) or customize the initial delay (+N days)
**Then** a `Repetitions` record is created with `nextReviewDate = today + N days`
**And** the default value of 2 days is pre-populated in the input
**And** the user can override with any positive integer
**And** the scheduled document appears in the task queue on the configured date

---

## Epic 3: Spaced Repetition Task Queue

Users see a high-density task dashboard populated from their scheduled review dates, filter by Today / Upcoming / All Docs, reschedule documents (+N days), and permanently mark them completed. The clearance loop uses the Split-Screen Glass Modal for immersive review.

### Story 3.1: Task Queue Dashboard with Schedule-Based Population

As a **user**,
I want to see my documents automatically populated into an active task list based on their scheduled review dates,
So that I know exactly what needs my attention each day.

**Acceptance Criteria:**

**Given** documents exist with scheduled review dates in the `Repetitions` collection
**When** the user opens the dashboard
**Then** documents with `nextReviewDate <= today` appear in the "Today" section
**And** documents with future dates appear in the "Upcoming" section
**And** the task list uses the Task Row Card layout (title, urgency indicator, truncated notes, tags)
**And** the dashboard loads within 3 seconds (NFR1)
**And** the list is ordered by urgency (oldest overdue first)

### Story 3.2: Task Queue Filtering (Today / Pending / Upcoming / All Docs)

As a **user**,
I want to filter my task queue by Today, Pending, Upcoming, and All Docs,
So that I can focus on immediate priorities or plan ahead.

**Acceptance Criteria:**

**Given** the task queue dashboard is loaded
**When** the user selects "Today"
**Then** only documents with `nextReviewDate <= today` are displayed
**When** the user selects "Upcoming"
**Then** only documents with `nextReviewDate > today` are displayed
**When** the user selects "All Docs"
**Then** all documents regardless of schedule status are displayed (including completed)
**And** the active filter is visually highlighted
**And** filter changes do not trigger a full page reload (client-side state)

### Story 3.3: Reschedule & Mark Completed

As a **user**,
I want to reschedule a document's next review (+N days) or permanently mark it as completed,
So that I control my revision cadence and retire mastered material.

**Acceptance Criteria:**

**Given** a document appears in the task queue
**When** the user reschedules with +N days
**Then** the `Repetitions` record updates `nextReviewDate = today + N`
**And** the document moves from "Today" to "Upcoming" and the list updates without page reload
**When** the user marks a document as "Completed"
**Then** the document status changes to "Completed" and it is removed from active task views
**And** completed documents remain accessible via the "All Docs" filter
**And** a confirmation is required before permanent completion

### Story 3.4: Split-Screen Glass Modal for Document Review

As a **user**,
I want to review my scheduled documents in an immersive split-screen modal with the Google Doc on the left and my metadata on the right,
So that I can study, take notes, and clear tasks without context switching.

**Acceptance Criteria:**

**Given** a document appears in the task queue
**When** the user clicks a Task Row Card
**Then** a Glass Modal opens with the Google Doc iframe in the left pane (70%) and metadata sidebar in the right pane (30%)
**And** the metadata sidebar shows existing notes, tags, difficulty, and a "Mark Complete" / "Reschedule" CTA
**And** the modal is focus-trapped and closes on `Esc` (shadcn Dialog primitive)
**And** a loading skeleton/shimmer displays while the iframe initializes (UX-DR4)
**And** marking complete from within the modal sweeps the task away and loads the next item

---

## Epic 4: Notes, Tags & Terminology

Users can create, edit, and manage independent notes, custom tags, and terminology definitions mapped to specific documents. The full repository is browsable/filterable by tags, and a distinct Terminology interface surfaces all defined terms. Notes and terms can be independently rescheduled or marked as done.

### Story 4.1: Create Notes & Tags per Document

As a **user**,
I want to create independent notes and custom tags for any document,
So that I can capture insights and organize my knowledge by topic.

**Acceptance Criteria:**

**Given** a document is being viewed (in the Glass Modal or detail view)
**When** the user writes a note and saves it
**Then** the note is persisted to the database, linked to the document and user
**And** multiple notes can be created per document
**When** the user adds a custom tag
**Then** the tag is associated with the document and available for filtering
**And** existing tags are auto-suggested during input to maintain consistency
**And** tags are displayed as interactive badges on the document

### Story 4.2: Terminology Definitions per Document

As a **user**,
I want to create terminology definitions mapped to specific documents,
So that I build a personal glossary of key concepts alongside my study material.

**Acceptance Criteria:**

**Given** a document is being viewed
**When** the user adds a new term with its definition
**Then** the term is persisted and linked to the source document
**And** terms are displayed in the metadata sidebar alongside notes
**And** each term entry includes: term name, definition text, source document reference, creation date
**And** manual entry is supported (Phase 1; AI-powered definitions deferred to Phase 2 per PRD)

### Story 4.3: Filter Repository by Tags & Terminology Browser

As a **user**,
I want to filter my entire document repository by custom tags and browse a distinct Terminology interface,
So that I can navigate my knowledge graph by topic and review all defined terms.

**Acceptance Criteria:**

**Given** the user has documents with tags
**When** they select one or more tags from the filter interface
**Then** only documents matching the selected tags are displayed
**And** tag counts show how many documents are associated with each tag
**Given** the user navigates to the Terminology section
**When** the page loads
**Then** all defined terms are displayed alphabetically with their definitions and source document links
**And** the terminology list is searchable/filterable
**And** clicking a source document link navigates to that document's detail view

### Story 4.4: Edit, Complete & Reschedule Notes and Terms

As a **user**,
I want to edit, mark as done, or reschedule my notes and terminology entries independently,
So that I can refine my knowledge artifacts and control when they resurface for review.

**Acceptance Criteria:**

**Given** a note or term exists on a document
**When** the user edits the content and saves
**Then** the updated content is persisted immediately
**When** the user marks a note/term as "done"
**Then** it is visually archived and excluded from active review
**When** the user reschedules a note/term (+N days)
**Then** it reappears in the review queue on the scheduled date
**And** inline editing is supported without opening a separate form/modal

---

## Epic 5: Similarity Detection & Knowledge Consolidation

Upon submission, the system actively compares new documents against existing ones using title/tag matching (Phase 1). Warning banners alert users to duplicates, and users can explicitly merge overlapping URLs into unified topic trees. Keyword search surfaces documents within 1 second.

### Story 5.1: Title & Tag Similarity Comparison on Submission

As a **user**,
I want the system to automatically compare my new document against existing documents using titles and tags,
So that I'm warned before duplicating knowledge I've already captured.

**Acceptance Criteria:**

**Given** the user is submitting a new Google Doc URL
**When** the system extracts the title and the user adds tags
**Then** a background comparison runs against all existing documents' titles and tags
**And** the comparison completes within 3 seconds (NFR3)
**And** matches are scored by overlap strength (title similarity + shared tags)
**And** the comparison runs asynchronously without blocking the submission form (UX: user can configure tags while the check happens)

### Story 5.2: Similarity Warning Banner

As a **user**,
I want to see a clear, non-alarmist warning when the system detects overlap with an existing document,
So that I can decide to merge or proceed with awareness.

**Acceptance Criteria:**

**Given** a similarity match is detected during submission
**When** the comparison results are ready
**Then** a calm blue/purple banner slides down from the top of the interface (UX-DR13)
**And** the banner displays the matched document(s) title, overlap reason, and "Merge" / "Ignore" actions
**And** the banner does not block the submission form — the user can continue configuring tags/schedule while deciding
**And** dismissing the banner (Ignore) allows the document to be saved as a new independent entry

### Story 5.3: Merge Overlapping Documents into Topic Trees

As a **user**,
I want to explicitly merge logically overlapping URLs into unified topic trees,
So that related knowledge is consolidated rather than fragmented.

**Acceptance Criteria:**

**Given** a similarity warning is displayed with "Merge" option
**When** the user clicks "Merge"
**Then** the new document is attached as a child node to the existing matched document
**And** the merged group is visually displayed as a topic tree in the document list
**And** tags from both documents are combined (union)
**And** the merge is reversible — the user can "unlink" a merged document
**And** merged documents share the parent's review schedule unless independently overridden

### Story 5.4: Keyword Search on Titles and Tags

As a **user**,
I want to search across my documents by keyword (titles and tags),
So that I can quickly find specific knowledge in my repository.

**Acceptance Criteria:**

**Given** the user has documents with titles and tags
**When** they type a query into the search input (or Command Palette)
**Then** results matching titles or tags are returned within 1 second (NFR3, FR16)
**And** results are ranked by relevance (exact match > partial match)
**And** the search interface supports incremental/typeahead results
**And** clicking a result navigates to the document's detail view

---

## Epic 6: Learning Dashboard & Analytics

Users can view summary metrics (Total Documents, Pending Revisions, Completed), and the system surfaces aggregated insights like "Most Repeated Topics" and "Least Revised Areas" to guide their learning strategy.

### Story 6.1: Core Dashboard Metrics

As a **user**,
I want to see core metrics — Total Documents, Pending Revisions, and Total Completed — on my dashboard,
So that I have an at-a-glance understanding of my learning progress.

**Acceptance Criteria:**

**Given** the user has documents in various states
**When** they view the dashboard
**Then** three metric cards display: Total Documents (count), Pending Revisions (documents with nextReviewDate ≤ today), Total Completed (status = "Completed")
**And** metrics are calculated server-side via MongoDB aggregation (RSC)
**And** metric values update in real-time after task clearance (via `revalidateTag`)
**And** empty states show "0" with encouraging messaging, not error states

### Story 6.2: Most Repeated Topics & Least Revised Areas

As a **user**,
I want to see aggregated insights showing my "Most Repeated Topics" and "Least Revised Areas,"
So that I can identify knowledge strengths and gaps in my study habits.

**Acceptance Criteria:**

**Given** the user has documents with tags and revision history
**When** they view the analytics section of the dashboard
**Then** "Most Repeated Topics" shows the top 5 tags ranked by total revision count across associated documents
**And** "Least Revised Areas" shows the top 5 tags ranked by longest gap since last revision
**And** each insight entry is clickable, navigating to the filtered document list for that tag
**And** insights update after any task clearance or scheduling action
**And** the analytics section gracefully handles new users with fewer than 5 tags (show available data, no empty rows)

---

## Epic 7: Design System & UX Polish

The full Zen Productivity visual system is applied across all views — semantic state colors, micro-interactions (bouncy hover, sweep animations), Command Palette, Inbox Zero empty state, responsive breakpoints, progressive disclosure, and WCAG 2.1 AA accessibility compliance.

### Story 7.1: Zen Productivity Theme & Design Tokens

As a **user**,
I want the entire application to feel like a calm, premium learning environment with consistent colors, typography, and spacing,
So that long study sessions are comfortable and the UI builds trust.

**Acceptance Criteria:**

**Given** the Tailwind configuration
**When** the design tokens are applied
**Then** background uses sage/mint cream (#f1f5f2), cards use white (#FFFFFF) with border-radius 1.5rem (UX-DR1)
**And** Semantic state colors are applied: Emerald (#059669) for Today, Blue (#3b82f6) for Upcoming, Amber (#d97706) for Stale, Gray (#64748b) for Completed (UX-DR2)
**And** Inter is the primary typeface, Newsreader for document titles, monospace for dates/metrics (UX-DR3)
**And** custom shadow utilities (`shadow-soft`, `shadow-hover`) replace default harsh shadows

### Story 7.2: Micro-Interactions & Task Completion Animations

As a **user**,
I want fluid, satisfying micro-animations when I interact with the UI — especially when clearing tasks,
So that the revision habit feels rewarding and the interface feels alive.

**Acceptance Criteria:**

**Given** interactive elements exist
**When** the user hovers over a Task Row Card
**Then** the row lifts with a bouncy transform (cubic-bezier(0.34, 1.56, 0.64, 1), scale 1.05) (UX-DR6)
**When** the user marks a task as completed
**Then** the row slides right and fades out with a smooth animation
**And** remaining tasks slide up to fill the gap with physics-based easing
**And** a toast notification confirms the action ("Document rescheduled" / "Marked complete")
**And** all transitions use `duration-300 ease-out` for consistency

### Story 7.3: Command Palette (Cmd+K)

As a **user**,
I want a Command Palette activated by Cmd+K (or Ctrl+K) for fast cross-app navigation and search,
So that I can navigate by keyboard without clicking through sidebars.

**Acceptance Criteria:**

**Given** the user is anywhere in the application
**When** they press Cmd+K / Ctrl+K
**Then** the Command Palette opens as a modal overlay (shadcn Command primitive) (UX-DR7)
**And** typing filters documents, tags, and navigation options in real-time
**And** arrow keys navigate results, Enter selects, Esc closes
**And** results show document titles, tag matches, and page navigation options
**And** the palette is accessible and focus-trapped

### Story 7.4: Inbox Zero Empty State

As a **user**,
I want to see a calming success state when my daily revision queue is empty,
So that I feel accomplished rather than seeing a blank void.

**Acceptance Criteria:**

**Given** the user has cleared all tasks with `nextReviewDate <= today`
**When** the task queue renders empty
**Then** an "All caught up for today" state displays with a calming illustration/graphic (UX-DR8)
**And** the empty state includes the next scheduled review date if upcoming documents exist
**And** the design uses the Zen Productivity palette (soft colors, generous whitespace)

### Story 7.5: Responsive Design & Mobile Degradation

As a **user**,
I want the application to work well on my phone for quick task clearance, and maximize screen real estate on desktop,
So that I can study on any device.

**Acceptance Criteria:**

**Given** the application is accessed on a mobile device (< 768px)
**When** the layout renders
**Then** the sidebar collapses to a hamburger menu (UX-DR9)
**And** split-screen layouts stack vertically (Google Doc link opens externally)
**And** tap targets meet minimum 44px sizing requirements
**Given** the application is on desktop (1024px+)
**Then** split-screen layouts activate and sidebars are visible
**And** content is constrained with `max-w-screen-2xl` to prevent extreme stretching

### Story 7.6: Accessibility & Keyboard Navigation

As a **user** (including those using assistive technologies),
I want all interactive elements to be keyboard navigable with proper ARIA labels and focus indicators,
So that the application is usable without a mouse and meets WCAG 2.1 AA standards.

**Acceptance Criteria:**

**Given** any interactive element in the application
**When** it receives focus via keyboard (Tab)
**Then** a visible focus ring displays (`focus-visible:ring-2 ring-indigo-500/50`) (UX-DR10)
**And** all buttons, links, and controls have descriptive ARIA labels (NFR14)
**And** the DOM is fully semantic with proper heading hierarchy (NFR15)
**And** color contrast ratios meet minimum 4.5:1 for all text (NFR13)
**And** all complex components (modals, dropdowns) trap focus correctly via Radix UI primitives
**And** power user keyboard shortcuts are displayed as tooltips on hover for all action buttons

### Story 7.7: Progressive Disclosure on Task List

As a **user**,
I want the dashboard task list to show only essential information by default, with details revealed on interaction,
So that I'm not overwhelmed by information density.

**Acceptance Criteria:**

**Given** the task queue dashboard is displayed
**When** items render in the default collapsed state
**Then** each row shows only: document title, urgency indicator (color-coded), and next review date (UX-DR11)
**When** the user expands a row (click or keyboard)
**Then** full notes preview, complete tag list, difficulty badge, and revision history are revealed
**And** expansion/collapse animates smoothly
**And** only one row can be expanded at a time (accordion behavior)

---

## Epic 8: AI Acceleration & Advanced Learning

Integrate Gemini AI and advanced workflows to shift the user from passive reading into active, automated recall. The system auto-generates terminology, creates intelligent "Quiz Me" flashcards, suggests tags, and provides built-in focus timers.

### Story 8.1: Auto-Glossary Generation via Gemini AI

As a **user**,
I want the system to automatically generate a terminology glossary for my submitted documents using Gemini AI,
So that I don't have to manually extract and type out key definitions.

**Acceptance Criteria:**

**Given** the user submits a new document or clicks "Generate Glossary"
**When** the Gemini API returns the analyzed terminology
**Then** the document's Terminology tab is populated with terms and definitions
**And** the user can bulk-accept, edit, or reject the AI suggestions
**And** if the Gemini API key is missing or invalid, a graceful prompt directs them to their settings

### Story 8.2: "Quiz Me" Auto-Flashcards

As a **user**,
I want the system to automatically generate active-recall questions from my assigned documents,
So that I can test my knowledge instead of passively re-reading.

**Acceptance Criteria:**

**Given** the user is viewing a document in the Split-Screen Glass Modal
**When** they enter "Quiz Me" mode
**Then** the AI dynamically generates 3-5 flashcard questions based on the document text
**And** the user can reveal the answers sequentially
**And** performance on the quiz influences the difficulty assigned to the document

### Story 8.3: Built-in Pomodoro Focus Timer

As a **user**,
I want an integrated Pomodoro timer within the study workspace,
So that I can maintain structured focus without leaving the application.

**Acceptance Criteria:**

**Given** the user is in the Split-Screen Glass Modal
**When** they activate the focus timer
**Then** a countdown timer (default 25 minutes) starts and is displayed on screen
**And** an alarm/visual cue triggers when the time expires
**And** the timer persists correctly even if the user switches documents during a session
