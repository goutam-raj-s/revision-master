---
stepsCompleted: ['step-01-init.md', 'step-02-discovery.md', 'step-02b-vision.md', 'step-02c-executive-summary.md', 'step-03-success.md', 'step-04-journeys.md', 'step-05-domain.md', 'step-06-innovation.md', 'step-07-project-type.md', 'step-08-scoping.md', 'step-09-functional.md', 'step-10-nonfunctional.md', 'step-11-polish.md']
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
