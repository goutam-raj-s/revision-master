---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['prd.md', 'product-brief-lostbae.md', 'ux-design-specification.md']
workflowType: 'architecture'
project_name: 'lostbae'
user_name: 'Gautam'
date: '2026-04-11'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- **Core Engine:** A sophisticated Spaced Repetition System (SRS) managing document queues, intervals, and user retention scores.
- **Content Embedding:** Integration of Google Docs via iframe within a custom "Focus Mode" environment.
- **User & Admin Management:** Robust authentication mapping roles (Admin vs. Learner), tracking deep progress analytics.
- **AI/LLM Pipelines:** Potential backend orchestrations for context-aware definitions or automated quizzes.

**Non-Functional Requirements:**
- **Performance:** Extremely rapid responses to support the "tactile arcade" UX feel. Strict SEO and dynamic rendering optimizations.
- **State Management:** Seamless client-side state transitions to handle marathon study sessions without page reloads.
- **Security:** Hardened route-gating for administrative oversight and secure API route protections.

**Scale & Complexity:**
- Complexity level: **High**. The combination of algorithmic backend queues, role-based architecture, and highly specific UI physics puts this far above a standard CRUD app.

- Primary domain: Serverless Full-Stack
- Estimated architectural components: ~12-15 core systems (Auth, SRS Engine, Queue Manager, API Data Layer, Analytics, Vercel Edge endpoints, etc.)

### Technical Constraints & Dependencies

- **Framework:** Next.js (App Router to be leveraged for React Server Components and parallel routing).
- **Database:** MongoDB (providing a flexible schema ideal for shifting document metadata and dynamic learning profiles).
- **Deployment Strategy:** Vercel (requires specific architectural affordances like server-side caching, edge-compatible middleware, and serverless-friendly DB connection pooling).
- **UI Architecture:** Tailored component architecture to handle the "Editorial Neo-Brutalism" design without layout thrashing. 

### Cross-Cutting Concerns Identified

- **Optimization First:** Rigorous application of Next.js caching (`generateStaticParams`, `stale-while-revalidate`), preventing waterfall fetching, and optimizing TTFB.
- **Connection Governance:** Proper MongoDB client caching during Vercel serverless cold-starts to prevent connection limits.
- **Decoupling:** Ensuring the complex Spaced Repetition logic is architecturally clean and separated from UI layers.

## Starter Template Evaluation

### Primary Technology Domain
Next.js Enterprise Full-Stack (Server Components + API Routes) based on strict Vercel deployment requirements.

### Selected Starter: Official `create-next-app@latest`

**Rationale for Selection:**
To achieve "every optimization required" on Vercel, leveraging a bulky community boilerplate (which often locks you into heavy ORMs like Prisma) is an anti-pattern. By using the official Next.js CLI, we guarantee 100% Vercel Edge/Serverless compatibility, zero unnecessary package weight, and retain control to build an optimized, connection-pooled MongoDB client tailored for serverless cold starts.

**Initialization Command:**
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

## Core Architectural Decisions

### 1. Database & Data Modeling (MongoDB)
- **Decision:** Use the native raw `mongodb` Node.js driver over Mongoose. 
- **Rationale:** Mongoose carries a heavy initialization cost in serverless architectures. The native driver ensures blazing fast cold starts on Vercel. We will implement a strict Singleton pattern for pooling connections across Serverless Function invocations.
- **Data Collections Needed:** 
  - `Users` (Profile, Roles, Settings)
  - `Documents` (Metadata, Google Doc URIs, Tags)
  - `Repetitions` (The individual SRS intervals, Ease Factors, Next Review Dates, mapped to Users + Documents)

### 2. Authentication Protocol
- **Decision:** Utilize `better-auth` for session management and RBAC (Role-Based Access Control).
- **Rationale:** Integrates flawlessly with Next.js App Router middleware. Allows us to securely gate the `/admin` routes using Server-Side layout guards and middleware interception.

### 3. API & Data Fetching Layer
- **Decision:** Prefer React Server Components (RSC) and Next.js Server Actions over traditional Client-Side Fetching (`useQuery`) where possible.
- **Rationale:** Pushes the heavy Spaced Repetition algorithmic calculations to the Vercel server edge, shipping absolute zero JavaScript logic to the browser for these calculations.

### 4. UI Layer & State Management
- **Decision:** Zustand for client-side ephemeral state; Radix UI / Shadcn UI primitives for accessibility.
- **Rationale:** The "Editorial Neo-Brutalism" design requires highly interactive, animated components. Zustand provides zero-boilerplate, fast client state for the "Tactile Queue" while reacting to Server Actions without layout thrashing.

## Implementation Patterns

### Serverless Caching Strategy
- Leverage Next.js Data Cache built-ins (`revalidateTag()`). 
- When a user finishes reviewing a flashcard document (triggers "Mark Mastered"), a Server Action updates MongoDB and invalidates specific tags (e.g., `revalidateTag('user-queues')`), immediately mutating the cached queue on the server edge.

### Error Handling Protocol
- Use Next.js `error.tsx` boundary boundaries at the route level to handle API/Database timeouts gracefully.
- Implement Zod schema validation on absolutely every Server Action input to ensure malformed Document or Queue requests never hit the MongoDB layer.

## Project Structure (App Router)

```text
/src
  /app                  # Next.js App Router (Pages, Layouts, API Routes)
    /(admin)            # Role-gated administration panel
    /(auth)             # Login/Signup/Callback routing
    /(dashboard)        # Main user study queue and metric overviews
    /study/[docId]      # "Focus Mode" dynamic routing for document iframes
  /components
    /ui                 # Base Neo-Brutalist elements (Cards, Buttons, Inputs)
    /features           # Complex assembled components (Queue Lists, Focus Frames)
  /lib
    /db                 # MongoDB singleton connection logic and aggregations
    /srs                # The pure, decoupled Spaced Repetition algorithms
    /auth               # better-auth configuration files
  /actions              # Next.js Server Actions (Mutations)
  /store                # Zustand client stores
```

## Architecture Validation
✅ **Vercel Optimized:** Eliminated heavy ORMs in favor of a cached native Mongo approach.
✅ **UI Strategy Matched:** Tailwind+App Router provides exactly the structural rigidity needed for Editorial Brutalism.
✅ **Performance Enforced:** RSCs ensure maximum SEO and minimal JS overhead.

**Workflow Status:** BMad Technical Architecture Planning is fully complete.
