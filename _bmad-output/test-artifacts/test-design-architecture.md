---
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
lastSaved: '2026-04-11T15:52:00+05:30'
workflowType: 'testarch-test-design'
inputDocuments: ['planning-artifacts/prd.md', 'planning-artifacts/architecture.md']
---

# Test Design for Architecture: Revision-Master

**Purpose:** Architectural concerns, testability gaps, and NFR requirements for review by Architecture/Dev teams. Serves as a contract between QA and Engineering on what must be addressed before test development begins.

**Date:** 2026-04-11
**Author:** TEA Master Test Architect
**Status:** Architecture Review Pending
**Project:** Revision-Master
**PRD Reference:** `_bmad-output/planning-artifacts/prd.md`
**ADR Reference:** `_bmad-output/planning-artifacts/architecture.md`

---

## Executive Summary

**Scope:** System-level test design focusing on Spaced Repetition logic, MongoDB serverless connection pooling, Better-Auth security, and Next.js Vercel Edge constraints.

**Business Context** (from PRD):
- **Problem:** Users losing track of scattered knowledge. Solution is an active intelligence layer for unstructured Google Docs.
- **GA Launch:** Phase 1 Solo-Developer MVP.

**Architecture** (from ADR):
- **Key Decision 1:** Next.js Full-Stack App Router (Vercel Edge compatible).
- **Key Decision 2:** MongoDB Native Driver (Singleton Pattern) to prevent connection pooling exhaustion.
- **Key Decision 3:** Better-Auth for session and RBAC logic.

**Risk Summary:**
- **Total risks**: 4
- **High-priority (≥6)**: 2 risks requiring immediate mitigation
- **Test effort**: ~20 core scenarios (~2-3 weeks for 1 QA Engineer)

---

## Quick Guide

### 🚨 BLOCKERS - Team Must Decide (Can't Proceed Without)

**Pre-Implementation Critical Path** - These MUST be completed before QA can write integration tests:
1. **B-001: Missing Mock Abstractions** - The native MongoDB driver is used directly without explicit dependency injection. Architecture must document how DB mocks will be injected for the backend tests.
2. **B-002: Test Data Seeding Strategy** - E2E tests will pollute production DBs. Architecture must define dedicated test-data factories and cleanup utilities before writing cross-layer E2E tests.

---

### ⚠️ HIGH PRIORITY - Team Should Validate

1. **R-001: SRS Algorithm Silent Failures** - Backend must isolate SRS logic into pure functions with 100% Unit Test coverage (P0) to ensure mathematical robustness without database complexity.
2. **R-002: Vercel MongoDB Connection Exhaustion** - Backend/Ops must implement strict load testing for the connection Singleton to verify pooling works under 100 concurrent requests. 

---

### 📋 INFO ONLY - Solutions Provided (Review, No Decisions Needed)

1. **Test strategy**: Heavy Unit Testing for algorithms; Nightly Integration Tests for Edge APIs; Standard PR E2E testing for user flows.
2. **Tooling**: Playwright API/UI Utilities native to BMad TEA, Zod validaton at boundaries.
3. **Coverage**: 12 critical test scenarios prioritized P0-P2.
4. **Quality gates**: 100% Pass rate on P0 (Algorithmic / Security).

---

## For Architects and Devs - Open Topics 👷

### Risk Assessment

**Total risks identified**: 4 (2 high-priority score ≥6, 1 medium, 1 low)

#### High-Priority Risks (Score ≥6) - IMMEDIATE ATTENTION

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| **R-001** | **TECH** | SRS Algorithm logic errors could silently mis-schedule user reviews | 2 | 3 | **6** | Isolate SRS logic into pure functions with 100% Unit Test coverage | Dev | Sprint 1 |
| **R-002** | **PERF** | Vercel cold starts exhausted MongoDB connection pool limits | 2 | 3 | **6** | Implement load testing for the Singleton pattern | Architect | Pre-GA |

#### Medium-Priority Risks (Score 3-5)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-003 | DATA | E2E tests polluting production DB due to lack of tenant isolation/seeding | 2 | 2 | 4 | Build dedicated `/api/test-seed` endpoint for QA | Dev |

#### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------- |
| R-004 | SEC | Unauthorized access to `/admin` | 1 | 3 | 3 | Monitor |

---

### Testability Concerns and Architectural Gaps

#### 1. Blockers to Fast Feedback (WHAT WE NEED FROM ARCHITECTURE)
| Concern | Impact | What Architecture Must Provide | Owner | Timeline |
| ------- | ------ | ------------------------------ | ----- | -------- |
| **Missing Seeding Strategy** | E2E suites cannot run deterministically | Dedicated API or module for DB wiping and seeding | Backend | Sprint 1 |
| **No Mocks for DB Driver** | Slow API integration tests | Dependency injection for the native MongoDB client | Backend | Sprint 1 |

---

### Risk Mitigation Plans (High-Priority Risks ≥6)

#### R-001: SRS Algorithm Silent Failures (Score: 6) - CRITICAL
**Mitigation Strategy:**
1. Extract `SpacedRepetition.calculateNextReview()` out of Server Actions entirely.
2. Move it to `src/lib/srs/core.test.ts`.
3. Assure 100% path coverage using `istanbul` before merging.
**Owner:** Backend
**Status:** Planned

#### R-002: Vercel MongoDB Connection Exhaustion (Score: 6) - CRITICAL
**Mitigation Strategy:**
1. Spin up k6 or Playwright Artillery.
2. Burst 100 concurrent requests to a Server Action.
3. Observe MongoDB Atlas connection graphs to confirm `< 10` connections opened globally.
**Owner:** Architect
**Status:** Planned

---

**End of Architecture Document**
