---
title: "Product Brief: Revision-Master"
status: "draft"
created: "2026-04-11"
updated: "2026-04-11"
inputs: ["User Context: Brain dump of problem and expectations"]
---

# Product Brief: Revision-Master

## Executive Summary
Learning isn't the problem; remembering is. Revision-Master acts as an active intelligence layer that transforms scattered, unstructured Google Docs into a structured, revisable knowledge graph. Instead of re-learning the same topics or losing track of past insights, users link their public Google Docs to the platform. By leveraging spaced repetition, intelligent tag management, and AI-driven terminology generation, the platform schedules learning reviews at optimal intervals—ensuring that knowledge consolidates effectively without confining the user to a walled-garden application.

## The Problem
Many learners rely on Google Docs for "brain dumping" technical concepts, software engineering conclusions, or ideas to explore later. 
However, over time:
- **Zero Visibility:** It becomes impossible to know what has already been documented, leading to duplicate notes and endless loops of redundant learning.
- **No Consolidation:** Distinct but related insights are scattered across multiple docs without a semantic bridge.
- **Lack of Memory Scheduling:** The mind needs scheduled revision at optimal intervals, but unstructured docs have no built-in engine to prompt recall.

## The Solution
Revision-Master is a dashboard and routing engine built around "Bring Your Own Storage" principles. Users simply drop a public Google Doc link into the application. 
The system provides:
- **Automated Scheduling:** Docs auto-populate in a revision task list (e.g., 2 days after first visit), with snooze/reschedule options.
- **Knowledge Layering:** Users can attach independent notes, difficulty tags (Easy/Medium/Hard), and custom taxonomy directly in the system's database without altering the original Google Doc.
- **Terminology Graph:** Users define terms manually or use the Gemini API to automatically generate definitions from selected text.
- **Redundancy Prevention:** Semantic similarity checks warn users when they iterate on a topic they’ve already covered, offering the option to "merge" related documentation into a consolidated canonical resource.

## What Makes This Different
Traditional spaced-repetition tools (like Anki or RemNote) force users into strict formats (flashcards, outlines) inside closed ecosystems. Revision-Master allows users to continue working organically in long-form, unstructured Google Docs. It isn't a note-taking app—it's a smart administrative and scheduling layer that turns existing unstructured brain-dumps into an interconnected learning strategy. 

## Who This Serves
**Primary Users:** Continuous learners, software engineers, researchers, and students who habitually use Google Docs to record raw insights but lack an overarching system to ingest, recall, and synthesize that knowledge over time.

## Success Criteria
- **User Engagement:** High percentage of tasks cleared from the "Upcoming/Pending Revision" queue daily.
- **Consolidation Rate:** Number of "similarity warnings" successfully actioned and merged by users.
- **Knowledge Retention:** Volume of terms indexed via the Terminology / Gemini tool.

## Scope (v1)
**In Scope:**
- Ingesting and reading public Google Doc links.
- Task list dashboard with variable spaced-repetition rules (e.g., +n days delay).
- State tracking (first visit, revision, updated, marked as completed).
- Independent database for attached notes, tags, and difficulty categorizations.
- Gemini API integration for automated terminology definitions.
- Pre-creation semantic similarity alerts ("You already have X docs on this topic").
- Basic keyword/semantic search.
- Metrics learning dashboard (total docs, pending, completed, insight graphs).

**Explicitly Out of Scope:**
- Direct two-way editing syncing (the platform doesn't overwrite Google Doc contents natively, treating the URL as read-only source material).
- Specialized spaced-repetition algorithms (like SM-2) for micro-flashcards; the focus is document-level or note-level review.

## Vision
In 2-3 years, Revision-Master grows beyond Google Docs into a universal "recall engine" integrating with Notion, Obsidian, and local storage. It evolves from a personal scheduling tool into an intelligent tutor that predicts when knowledge on a specific engineering pattern is fading, dynamically surfacing the exact summary note or merged resource needed before the forgetting curve takes over.
