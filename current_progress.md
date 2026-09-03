# Aegis Engineering Progress & Architecture Tracker

**Document Version:** 1.1.0  
**Last Updated:** September 3, 2026  
**Status:** Active Development & Continuous Tracking  
**Target Platform:** Next.js 16 (App Router), Neon Serverless PostgreSQL, Razorpay API v1  

---

## Table of Contents

1. [Project Overview & Milestone Roadmap](#1-project-overview--milestone-roadmap)
2. [What Is Implemented & Completed](#2-what-is-implemented--completed)
3. [What Is In-Progress & Pending](#3-what-is-in-progress--pending)
4. [Testing & Verification Status](#4-testing--verification-status)
5. [Known Failure Modes & Test Constraints](#5-known-failure-modes--test-constraints)
6. [Scope of Improvement: Backend & Infrastructure Architecture](#6-scope-of-improvement-backend--infrastructure-architecture)
7. [Scope of Improvement: Security & Cryptographic Posture](#7-scope-of-improvement-security--cryptographic-posture)
8. [Actionable Task Checklist](#8-actionable-task-checklist)

---

## 1. Project Overview & Milestone Roadmap

Aegis is an autonomous dispute defense and evidence orchestration platform engineered specifically for the Indian payment ecosystem (NPCI UPI 2.0 and card acquiring networks) and integrated directly with Razorpay's Dispute Management APIs.

```
+-------------------------------------------------------------------------------------------------------+
| MILESTONE ROADMAP                                                                                     |
+----+-----------------------------------------------------+-----------------+--------------------------+
| ID | Milestone Goal                                      | Target Date     | Execution Status         |
+----+-----------------------------------------------------+-----------------+--------------------------+
| M1 | Core Ingestion & Razorpay SDK Integration           | August 2026     | COMPLETED (Verified)     |
| M2 | Deterministic Winnability Scoring Engine            | August 2026     | COMPLETED (Verified)     |
| M3 | First-Party Fraud Detection & Entity Link Graph     | August 2026     | COMPLETED (Verified)     |
| M4 | Dual-Engine Rebuttal Generation (LLM + Safe-Mode)   | August 2026     | COMPLETED (Verified)     |
| M5 | Razorpay Core Design System & Merchant Console UI   | August 2026     | COMPLETED (Verified)     |
| M6 | Live vs Test Mode Data Isolation Architecture       | September 2026  | COMPLETED (Verified)     |
| M7 | Automated Verification, Vitest & Playwright QA      | September 2026  | COMPLETED (Verified)     |
| M8 | Enterprise Hardening, Logging & Type Refactoring   | September 2026  | COMPLETED (Verified)     |
| M9 | Webhook Cryptographic Verification & HMAC Engine    | Q4 2026         | IN-PROGRESS              |
| M10| Multimodal Document Parser & Signature OCR          | Q1 2027         | PLANNED                  |
+----+-----------------------------------------------------+-----------------+--------------------------+
```

---

## 2. What Is Implemented & Completed

### Core Backend & Intelligence Layer

- **Deterministic Reason Code Scoring Engine (`src/lib/scoring/`):**
  - Evaluates dispute evidence completeness against exact acquiring rules without relying on opaque or non-deterministic LLM calculations.
  - Full rule support for UPI `1064` (Goods Not Received), UPI `108` (Beneficiary Not Credited), Card `4837` (No Cardholder Auth / 3DS Liability Shift), UPI `1084` (Duplicate Processing), Card/UPI `1062` (Goods Not As Described), and UPI `1061` (Credit Not Processed).
  - Classifies disputes into three actionable bands: High Winnability ($\ge 80\%$), Needs Evidence ($50\% - 79\%$), and Low Winnability ($< 50\%$).

- **First-Party Fraud & Repeat-Disputer Telemetry (`src/lib/fraudSignal/`):**
  - Algorithmic analysis of customer dispute-to-order ratio ($\text{Disputes} / \text{Orders}$).
  - Detection of chronic repeat disputers and address/phone mismatch anomalies.
  - Generation of multi-node entity relationship graphs (Customer, Order, Payment, Delivery, Communications, Refunds).

- **Dual-Engine Rebuttal Generator (`src/lib/drafting/`):**
  - Primary generator: Strictly grounded OpenAI GPT-4o prompt adhering to bank representment formatting guidelines with zero hallucination constraints.
  - Safe-mode fallback generator: 100% deterministic template engine compiling structured legal representment letters if the LLM encounters rate limits, timeouts, or missing credentials.
  - Prompt injection defense: `sanitizeMerchantInstructions()` bounds inputs to $\le 500$ characters, strips delimiter and script tags, and encapsulates merchant instructions in `<merchant_notes>` XML tags.

- **Production Security Headers (`next.config.ts`):**
  - Configured `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

- **Structured Zero-Dependency Logger (`src/lib/logger.ts`):**
  - Contextual logging with log levels (`debug`, `info`, `warn`, `error`), trace attribution (`module`, `disputeId`), credential masking, and automatic test silencing.

- **Unified Domain Models & API Response Envelopes (`src/lib/types/domain.ts` & `src/lib/api/response.ts`):**
  - Eradicated all `any` casting across `/api/disputes`, `/api/disputes/[id]`, `/api/disputes/[id]/draft`, `/api/disputes/[id]/accept`, and `/api/disputes/sync`.
  - Standardized JSON responses with `apiSuccess<T>` and `apiError`.

- **Razorpay API Staging Loop (`src/lib/razorpay.ts` & `src/app/api/`):**
  - Dispute ingestion via official `razorpay` Node SDK with automatic credential masking.
  - Staging representments with `action: "draft"` via `PATCH /v1/disputes/:id/contest`.
  - Idempotent dispute acceptance via `POST /v1/disputes/:id/accept`.
  - Live background synchronization via `POST /api/disputes/sync`.

- **Live vs Test Mode Isolation (`src/lib/merchantAccount.ts` & `src/context/merchant-mode-context.tsx`):**
  - Clean separation between test sandbox (6 representative seed cases) and live production API queries.
  - Prevents mock data leakage into verified merchant accounts.
  - Dynamic credential verification for custom Key ID and Secret inputs.

### User Interface & Frontend Architecture

- **Global Shell & Navigation (`src/components/dashboard/dashboard-shell.tsx`):**
  - Desktop SideNav and Mobile TopNav adhering to Razorpay Core Tokens (`#0D1A48`, `#305EFF`, `#0D1C2D`, 4px component border radius).
  - Global search, real-time SLA notification bell drawer, and merchant account switcher.

- **Overview Analytics Dashboard (`src/app/overview/page.tsx`):**
  - Key financial metrics: Volume at Risk, Recoverable Capital, Projected Win Rate, and Defense Engine Status.
  - Visual Winnability Distribution bar gauge.
  - Reason Code Defense Rules Reference Matrix.

- **Disputes Defense Console (`src/app/disputes/page.tsx`):**
  - Sortable and filterable dispute table with accessible `scope="col"`, `aria-sort`, and keyboard navigation.
  - Click-to-filter winnability cards (High, Needs Evidence, Low).
  - Audit report export (JSON/CSV).

- **Dispute Detail & Audit Dossier (`src/components/disputes/dispute-detail-sheet.tsx`):**
  - Slide-out sheet containing full evidence verification checklist.
  - Embedded `FraudSignalCard` and interactive SVG `RelationshipGraph`.
  - Prompt customizer allowing dispute managers to inject specific rebuttal arguments.
  - Dual view showing the Razorpay Contest Summary ($\le 1000$ characters) and the Formal Bank Explanation Letter.

- **Ancillary Ledger Pages:**
  - Transactions Ledger (`src/app/transactions/page.tsx`) linking payments to active defense files.
  - Settlements Ledger (`src/app/settlements/page.tsx`) tracking net holdbacks against dispute wins.
  - Merchant Settings (`src/app/settings/page.tsx`) managing API keys and test/live modes.

---

## 3. What Is In-Progress & Pending

- **Razorpay Webhook Verification Gateway (`POST /api/webhooks/razorpay`):**
  - Implementing HMAC-SHA256 signature verification against `X-Razorpay-Signature`.
  - Asynchronous webhook payload ingestion for `dispute.created`, `dispute.won`, `dispute.lost`, and `dispute.closed`.

- **Automated Evidence Ingestion Integrations:**
  - BlueDart, Shiprocket, and Delhivery API connectors for automated AWB tracking status retrieval.
  - Intercom, Zendesk, and Freshdesk webhooks for customer communication log attachments.

- **Production BullMQ / Redis Asynchronous Processing:**
  - Offloading heavy LLM drafting tasks to background workers to prevent edge function timeouts under heavy dispute volume spikes.

---

## 4. Testing & Verification Status

```
+-------------------------------------------------------------------------------------------------------+
| VERIFICATION SUITE EXECUTION SUMMARY                                                                  |
+--------------------------------------------------------+-----------------+----------------------------+
| Test Suite / File                                      | Execution Mode  | Outcome                    |
+--------------------------------------------------------+-----------------+----------------------------+
| src/lib/scoring/__tests__/score.test.ts                | Vitest (Unit)   | 9 / 9 PASSED (4ms)         |
| src/lib/fraudSignal/__tests__/fraudSignal.test.ts      | Vitest (Unit)   | 6 / 6 PASSED (13ms)        |
| src/lib/drafting/__tests__/draftRebuttal.test.ts       | Vitest (Unit)   | 4 / 4 PASSED (14ms)        |
| src/lib/drafting/__tests__/promptSanitization.test.ts  | Vitest (Unit)   | 3 / 3 PASSED (3ms)         |
| src/__tests__/resilience.test.ts                       | Vitest (Unit)   | 2 / 2 PASSED (11ms)        |
| Total Unit Test Suite                                  | Vitest (Unit)   | 24 / 24 PASSED (170ms)     |
| Next.js Turbopack Production Build                     | `next build`    | COMPILED CLEANLY (0 ERROR) |
| HTTP E2E Workflow (`e2e-workflow.test.ts`)             | Integration     | VERIFIED (Local Server)    |
| Failure Injections (`failure_simulations.test.ts`)     | Integration     | VERIFIED (Local Server)    |
| Live/Test Separation (`live-test-mode-separation`)     | Integration     | VERIFIED (Local Server)    |
+--------------------------------------------------------+-----------------+----------------------------+
```

---

## 5. Known Failure Modes & Test Constraints

1. **Integration Tests (`src/__tests__/e2e-workflow.test.ts` & `failure_simulations.test.ts`):**
   - Integration test suites execute real HTTP `fetch` calls against `http://localhost:3000`.
   - When running without a local Next.js dev server, HTTP connections will return `ECONNREFUSED`.
   - Unit tests (`src/lib/*/__tests__/*.test.ts` and `src/__tests__/resilience.test.ts`) execute completely in-memory and are the primary source of truth for CI/CD gates.

2. **Database Network Connectivity (Neon Serverless PostgreSQL):**
   - In environments where outbound port 5432 or DNS for Neon is firewalled, Prisma calls automatically fall back to the in-memory mock store (`src/lib/mockStore.ts`) with zero application crashes.

---

## 6. Scope of Improvement: Backend & Infrastructure Architecture

1. **Prisma Connection Pooling Optimization:**
   - Implement Neon Serverless HTTP driver (`@neondatabase/serverless`) for edge compute compatibility and sub-50ms connection cold starts.

2. **Durable Task Queues (BullMQ / QStash):**
   - Convert synchronous `/api/disputes/[id]/draft` operations to an event-driven asynchronous job queue for high-volume merchants with $>100$ concurrent disputes.

3. **Multi-Region Caching (Upstash Redis):**
   - Cache static Reason Code definitions and scoring rules with a 24-hour TTL to eliminate repetitive computation.

---

## 7. Scope of Improvement: Security & Cryptographic Posture

1. **AES-256-GCM Envelope Encryption for API Secrets:**
   - Encrypt merchant `rzp_key_secret` values at rest in PostgreSQL rather than storing raw text strings.

2. **HMAC Signature Replay Attack Mitigation:**
   - Validate timestamp headers on all incoming Razorpay webhooks and reject payloads with timestamps older than 300 seconds.

3. **Granular Role-Based Access Control (RBAC):**
   - Introduce `Viewer`, `Dispute_Analyst`, and `Finance_Admin` roles to restrict dispute accept actions and API credential updates.

---

## 8. Actionable Task Checklist

- [x] Configure enterprise HTTP security headers in `next.config.ts` (CSP, HSTS, X-Frame-Options).
- [x] Implement structured contextual logger in `src/lib/logger.ts`.
- [x] Replace `any` casting with strong domain interfaces in `src/lib/types/domain.ts`.
- [x] Implement standard API response envelopes (`src/lib/api/response.ts`).
- [x] Harden LLM prompt generation against injection in `src/lib/drafting/prompt.ts`.
- [x] Validate API query parameters and request bodies with Zod.
- [x] Add table accessibility attributes (`scope="col"`, `aria-sort`, keyboard event listeners).
- [x] Verify zero build errors via `npm run build`.
- [x] Execute and verify all 24 unit tests via Vitest.
- [ ] Implement Razorpay webhook signature verification endpoint (`POST /api/webhooks/razorpay`).
- [ ] Connect automated courier tracking webhooks (BlueDart, Shiprocket).
