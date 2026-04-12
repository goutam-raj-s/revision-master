---
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
lastSaved: '2026-04-11T15:55:00+05:30'
inputDocuments:
  - 'planning-artifacts/prd.md'
  - 'planning-artifacts/architecture.md'
  - 'planning-artifacts/epics.md'
  - 'tea/config.yaml'
  - '.agents/skills/bmad-testarch-test-design/resources/tea-index.csv'
  - '.agents/skills/bmad-testarch-test-design/resources/knowledge/adr-quality-readiness-checklist.md'
  - '.agents/skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md'
  - '.agents/skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md'
  - '.agents/skills/bmad-testarch-test-design/resources/knowledge/test-quality.md'
---

## Step 1: Detect Mode
- **Mode Selected:** System-Level Mode
- **Rationale:** The `sprint-status.yaml` does not exist within `implementation-artifacts`, indicating implementation has not yet started. While both Epics and PRD/Architecture files are present, the workflow protocol dictates prioritizing **System-Level Mode** when both are available. 
- **Prerequisites verified:**
  - PRD (`_bmad-output/planning-artifacts/prd.md`) ✅ Available 
  - Architecture (`_bmad-output/planning-artifacts/architecture.md`) ✅ Available

## Step 2: Load Context & Knowledge Base
- **Configuration loaded**: Stack detected as `fullstack` (Next.js, MongoDB). TEA Utilities (Playwright, Pact.js, MCP) enabled.
- **Project Artifacts loaded**: PRD, Architecture, and Epics. Key extractions: Next.js + MongoDB stack, Serverless constraints.
- **Knowledge Base chunks**: `adr-quality-readiness-checklist`, `test-levels-framework`, `risk-governance`, `test-quality` loaded. Playwright Utils `fullstack` profile referenced.

---

## Step 3: Testability & Risk Assessment

### 🚨 Testability Concerns
1. **Missing Data Seeding/Teardown Strategy (⚠️ Gap):** The architecture relies heavily on Next.js Server Actions and a MongoDB singleton. There is no explicit mention of test data seeding APIs or cleanup strategies which are critical for Playwright E2E tests to run deterministically.
2. **Missing Mock Abstractions (⚠️ Gap):** The native MongoDB driver is used directly in server actions without explicit dependency injection. This makes pure backend integration tests harder to run without a live local MongoDB.
3. **Missing Metrics & Tracing (⚠️ Gap):** No explicit RED (Rate, Errors, Duration) metrics or W3C trace context mentioned. Debugging Vercel Serverless timeouts will be difficult without this.

### ✅ Testability Assessment Summary
- **Statelessness & Scaling:** Architecture correctly delegates session state to `better-auth` and scaling to Vercel, ensuring horizontal scalability.
- **Security Validation:** Strict Zod schema validation mandated for every Server Action.
- **Error Handling:** Next.js `error.tsx` boundary approach explicitly defined.

### 📋 ASRs (Architecturally Significant Requirements)
1. **ASR-1:** Spaced Repetition (SRS) Engine must be decoupled from UI layers. **(ACTIONABLE: Unit Test Coverage Target)**
2. **ASR-2:** MongoDB singletons must cache connections across Vercel cold-starts. **(ACTIONABLE: Load/Perf test integration)**
3. **ASR-3:** Zero JS logic in browser for SRS calculations; leverage React Server Components. **(FYI)**

### 🔴 Risk Assessment Matrix

| Category | Risk Description | Probability (1-3) | Impact (1-3) | Risk Score (P×I) | Status | Mitigation Strategy | Owner |
|----------|------------------|-------------------|--------------|------------------|--------|---------------------|-------|
| **TECH** | SRS Algorithm logic errors could silently mis-schedule user reviews | 2 | 3 | **6** | 🚨 HIGH | Isolate SRS logic into pure functions with 100% Unit Test coverage (P0) | QA / Backend |
| **PERF** | Vercel cold starts exhausted MongoDB connection pool limits | 2 | 3 | **6** | 🚨 HIGH | Implement strict load testing for the connection Singleton to verify pooling works under 100 concurrent requests | Backend |
| **DATA** | E2E tests polluting production DB due to lack of tenant isolation/seeding | 2 | 2 | 4 | MEDIUM | Develop dedicated test-data factories and cleanup utilities before writing cross-layer E2E tests | QA |
| **SEC** | Unauthorized access to `/admin` or Server Actions | 1 | 3 | 3 | LOW | High coverage of role-gated tests verifying `better-auth` integration | QA |

### 🔍 Risk Findings Summary
The highest risks involve the complex **SRS Algorithm logic** failing silently and **MongoDB connection pool exhaustion** under Vercel serverless load. Mitigation priorities include exhaustive unit testing for the decoupled SRS logic (treating it as a pure function) and load/integration testing specifically targeting the Edge/Serverless database initialization pattern.

---

## Step 4: Coverage Plan & Execution Strategy

### 📊 Coverage Matrix

#### 1. Core Engine: Spaced Repetition System (SRS)
- **Scenario:** Calculate +N days interval accurately from current date
  - **Level:** Unit (Pure Function)
  - **Priority:** P0 (Blocks core engine)
- **Scenario:** Update item Difficulty and promote to next queue bucket
  - **Level:** Unit
  - **Priority:** P0
- **Scenario:** Queue polling correctly retrieves "Due Today" and past-due items
  - **Level:** Integration (API + DB)
  - **Priority:** P1
- **Scenario:** Reschedule review action persists immediately in DB
  - **Level:** Integration (Server Action + DB)
  - **Priority:** P1

#### 2. Ingestion & Content
- **Scenario:** Submit valid Google Doc URL extracts title successfully
  - **Level:** Integration (API + Network Interception)
  - **Priority:** P0
- **Scenario:** Render Google Doc via iframe without breaking layout
  - **Level:** Component / E2E
  - **Priority:** P1
- **Scenario:** Fallback caching provides last-known title if link is dead
  - **Level:** Integration
  - **Priority:** P2

#### 3. Similarity & Safety
- **Scenario:** Detect duplicate titles/tags on submission, trigger warning banner
  - **Level:** Integration (API logic) & Component (UI alert)
  - **Priority:** P1
- **Scenario:** Malformed URLs or script injections rejected by Zod schemas
  - **Level:** Unit (Zod validation)
  - **Priority:** P0

#### 4. User Journeys & State (E2E)
- **Scenario:** Cross-journey: User submits doc -> doc appears in Pending -> user marks as Read -> doc moves to Completed
  - **Level:** E2E
  - **Priority:** P0 (Critical path)
- **Scenario:** User logs in, adds custom note/tag to a document, views it independently
  - **Level:** E2E
  - **Priority:** P1

#### 5. Architecture Non-Functional (NFR)
- **Scenario:** MongoDB Singleton scales to 100 concurrent Server Action requests without exhausting connections
  - **Level:** Integration (Load Test)
  - **Priority:** P1
- **Scenario:** Unauthorized visitor attempting to hit `/admin` or invok admin Server Actions receives 403 Forbidden
  - **Level:** Integration (API Security)
  - **Priority:** P0

---

### ⏳ Execution Strategy
- **PR Pipeline (Every commit):**
  - All Unit Tests and Zod Schema Validations (Target execution < 2 mins)
  - Crucial Component tests for UI states 
- **Nightly Suite:**
  - Full E2E Playwright Journeys
  - Integration tests requiring MongoDB test containers and DB seeding
- **Weekly / Pre-Release:**
  - Load testing and Connection singleton stress testing 
  - Cross-browser Playwright matrix

---

### ⏱️ Resource Estimates
- **P0 Scenarios:** ~15–25 hours (Heavy focus on SRS pure functions and Zod schemas)
- **P1 Scenarios:** ~25–40 hours (Integration tests for DB operations, basic E2E)
- **P2 & P3 Scenarios:** ~10–20 hours
- **Framework Setup (Playwright / Pact / CI):** ~10-15 hours
- **Total Duration:** Ranges between ~60 to 100 hours of Quality Engineering implementation effort.

---

### 🚦 Quality Gates
- **P0 Pass Rate:** 100% required for PR merge.
- **P1 Pass Rate:** ≥ 95% required for nightly build stability.
- **Coverage Target:** ≥ 85% for all core business logic (SRS engine + API Actions), enforced via `istanbul`/`v8` coverage thresholds.
- **ASR Mitigation:** Load test verification for MongoDB pooling must pass >98% success rate under load before Production GA.

---

## Step 5: Generate Outputs & Validate

### 📝 Completion Report
- **Mode Used:** System-Level Mode
- **Output Files Generated:**
  - `_bmad-output/test-artifacts/test-design-architecture.md`
  - `_bmad-output/test-artifacts/test-design-qa.md`
  - `_bmad-output/test-artifacts/test-design-handoff.md`
- **Key Risks:** SRS Algorithm silent failures (6/9 risk score) & MongoDB connection exhaustion (6/9 risk score).
- **Gate Thresholds:** 100% path coverage required on SRS pure-math functions. Load Test pass required on API integrations before closing Epics.

**Workflow Complete.** All artifacts have been saved and validated.


