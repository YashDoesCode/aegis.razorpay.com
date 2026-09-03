# Aegis — Autonomous Chargeback & Dispute Defense for Razorpay

<p align="center">
  <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer">
    <img src="https://razorpay.com/assets/razorpay-glyph.svg" width="48" height="48" alt="Razorpay Logo" />
  </a>
</p>

<p align="center">
  <strong>Autonomous dispute win engine and evidence orchestration pipeline engineered natively for the Indian payment rails and integrated directly with Razorpay Dispute APIs.</strong>
</p>

<p align="center">
  <a href="https://aegisrazorpaycom.vercel.app">Production Deployment</a> &bull;
  <a href="https://razorpay.com/docs/payments/disputes/">Razorpay Dispute Docs</a> &bull;
  <a href="https://npci.org.in">NPCI UPI Guidelines</a> &bull;
  <a href="#system-architecture">Architecture</a> &bull;
  <a href="#application-dom--component-structure">DOM Tree</a>
</p>

---

## Notice

> **Hackathon Prototype Notice:** Aegis is an independent technical prototype developed for the Razorpay Hackathon. It is designed to interface with Razorpay APIs and test-mode acquiring environments.

---

## Table of Contents

1. [Executive Summary & Problem Statement](#executive-summary--problem-statement)
2. [Ideation & Core Insights: Where Payment Gateways Fall Short](#ideation--core-insights-where-payment-gateways-fall-short)
3. [Key Problems Solved](#key-problems-solved)
4. [System Architecture](#system-architecture)
5. [Dispute Lifecycle & State Machine](#dispute-lifecycle--state-machine)
6. [Deterministic Winnability Scoring Engine](#deterministic-winnability-scoring-engine)
7. [First-Party Fraud Detection & Entity Relationship Graph](#first-party-fraud-detection--entity-relationship-graph)
8. [Application DOM & Component Structure](#application-dom--component-structure)
9. [Supported Network Reason Codes](#supported-network-reason-codes)
10. [API Reference](#api-reference)
11. [Platform-Wide Immutable Audit Ledger](#platform-wide-immutable-audit-ledger)
12. [Design System & Interface Tokens](#design-system--interface-tokens)
13. [Local Setup & Development Guide](#local-setup--development-guide)
14. [Verification & Testing](#verification--testing)
15. [References & Standards](#references--standards)

---

## Executive Summary & Problem Statement

Digital commerce in India operates under payment dynamics distinct from Western markets. Over 80% of retail transaction volume flows through the Unified Payments Interface (UPI) managed by the National Payments Corporation of India (NPCI), with the remainder split between RuPay, Visa, Mastercard, and net banking rails.

When a customer initiates a chargeback or payment dispute, merchants encounter structural operational friction:

1. **Strict 72-Hour Response SLA:** Acquiring banks and NPCI enforce a non-negotiable 3-calendar-day window to contest disputes. Missed deadlines result in permanent debit from merchant settlement accounts alongside dispute processing fees.
2. **Extreme Evidence Fragmentation:** Constructing a legally sound representment packet requires aggregating data across disparate silos: courier Proof of Delivery (POD) from 3PL logistics, GST tax invoices from ERPs, customer support conversations from CRMs, and payment/refund Unique Transaction References (UTRs) from banking ledgers.
3. **Manual Representment Inefficiency:** Merging these records manually takes 45 to 60 minutes per dispute. Due to missing evidence or non-standard formatting, merchants forfeit legitimate revenue with an average manual win rate below 12%.
4. **Foreign Tool Incompatibility:** Existing automated chargeback tools (such as Chargeflow or Signifyd) are designed exclusively for Western credit card schemes (Visa/Mastercard reason codes). None support NPCI UPI reason codes, Indian GST invoice rules, or local 3PL courier tracking integrations.

Aegis solves these challenges through an autonomous defense platform that reconciles payment telemetry, scores dispute winnability using deterministic bank rules, detects first-party friendly fraud via entity link analysis, and drafts evidence-grounded rebuttal dossiers staged directly onto Razorpay's Contest Dispute APIs.

---

## Ideation & Core Insights: Where Payment Gateways Fall Short

During the architectural analysis of Razorpay's dispute lifecycle and merchant operations, four systemic product gaps were identified:

```
+-----------------------------------------------------------------------------------+
|                            GATEWAY LEVEL DEFICIT                                  |
|                                                                                   |
|  1. Passive Dispute Pipeline:                                                     |
|     Gateways ingest dispute webhooks and present a file-upload form.              |
|     No proactive assessment of whether a dispute is winnable or unwinnable.       |
|                                                                                   |
|  2. Absence of Pre-Contest Evidence Auditing:                                     |
|     Merchants often submit incomplete documents, triggering immediate bank        |
|     rejection and non-refundable arbitration fees.                                |
|                                                                                   |
|  3. First-Party / Friendly Fraud Blind Spot:                                      |
|     Gateways evaluate transactions individually without historical graph analysis |
|     linking customer email, phone, shipping addresses, and prior dispute counts.  |
|                                                                                   |
|  4. Disconnected Settlement Intelligence:                                         |
|     Dispute reserves are held against merchant settlements without automated      |
|     triage advising whether to accept immediately (reducing penalties) or fight.  |
+-----------------------------------------------------------------------------------+
```

### Insights Derived

- **Insight 1: Deterministic Rules Must Precede AI Drafting.** Generating legal rebuttals with large language models without prior evidence validation leads to hallucinated claims. The scoring engine must be 100% deterministic and rule-bound before any generative layer is invoked.
- **Insight 2: Safe Mode Fallback is Critical for Financial Systems.** If LLM APIs experience rate limits or latency degradation, a payment defense system cannot drop the representment. Aegis implements a deterministic template fallback that compiles compliant rebuttal packets instantly.
- **Insight 3: Strict Draft Staging Prevents Unintended Filings.** All automated contest operations are staged with `action: "draft"` via the Razorpay Contest API, allowing merchant oversight while ensuring compliance with network rules.

---

## Key Problems Solved

| Operational Problem | Traditional Razorpay Workflow | Aegis Autonomous Defense Solution |
| :--- | :--- | :--- |
| **Response Window** | Manual discovery; frequently breaches 3-day SLA | Instant webhook ingestion; evidence auto-compiled in seconds |
| **UPI Dispute Support** | Manual interpretation of numeric NPCI codes | Native decoding of UPI codes (1064, 108, 1084, 1061) + Card 4837 |
| **Evidence Assembly** | 45-60 minutes across 4 distinct SaaS tools | Sub-second reconciliation of courier POD, invoices, and support logs |
| **Winnability Assessment** | Guesswork; high time spent on losing disputes | 0-100% deterministic scoring with specific gap analysis |
| **Friendly Fraud** | No correlation across customer transaction history | Multi-node entity graph analyzing repeat dispute ratios |
| **Dispute Acceptance** | Manual UI navigation | One-click idempotent acceptance for unwinnable claims |
| **Rebuttal Generation** | Generic Word/PDF templates | Grounded, zero-hallucination dossiers citing exact document references |

---

## System Architecture

The following diagram illustrates the complete end-to-end data pipeline, from gateway webhook ingestion through evidence verification, AI drafting, and Razorpay API contest staging.

```mermaid
flowchart TB
    subgraph GatewayLayer ["Payment Gateway & Network Layer"]
        RZP_API["Razorpay Core API\n(GET /v1/disputes, PATCH /v1/disputes/:id/contest)"]
        NPCI["NPCI UPI 2.0 Rails\n(Reason Codes: 1064, 108, 1084, 1061)"]
        CARDS["Card Acquiring Networks\n(Visa / Mastercard 4837, 1062)"]
    end

    subgraph IngestionLayer ["Ingestion & Synchronization Layer"]
        SYNC_HANDLER["Sync Controller\n(/api/disputes/sync)"]
        WEBHOOK_INGEST["Secure Webhook Ingest\n(/api/webhooks/razorpay)"]
        SIGNATURE_VERIFIER["HMAC-SHA256 Verifier\n(Constant-Time Comparison)"]
        MODE_GATE["Merchant Mode Gateway\n(Test Sandbox vs Verified Live API)"]
    end

    subgraph DataStoreLayer ["Data & Persistence Layer (Neon Serverless)"]
        PRISMA["Prisma ORM 6 (PgBouncer Pooled)"]
        DB_DISPUTES[("Disputes Table")]
        DB_WEBHOOKS[("Webhook Events Ledger")]
        DB_AUDIT[("Immutable Audit Trail")]
        DB_ORDERS[("Orders & Invoices")]
        DB_DELIVERY[("Courier POD & Tracking")]
        DB_COMMS[("Customer Comms Log")]
        DB_REFUNDS[("Refund Ledgers & UTRs")]
    end

    subgraph IntelligenceLayer ["Aegis Defense Intelligence Engine"]
        RULE_ENGINE["Deterministic Scoring Engine\n(reasonCodes.ts)"]
        FRAUD_ENGINE["Fraud Signal & Entity Graph\n(computeFraudSignal.ts)"]
        GRAPH_BUILDER["Entity Link Analyzer\n(Customer - Order - Payment - Courier)"]
    end

    subgraph GenerationLayer ["Dual-Engine Dossier Generator"]
        LLM_GEN["Primary Generator\n(GPT-4o Grounded Prompt)"]
        SAFE_FALLBACK["Safe-Mode Fallback Engine\n(Deterministic Template Compiler)"]
        SAFETY_GATE["Zero-Hallucination Evidence Gate"]
    end

    subgraph PresentationLayer ["Razorpay-Styled Merchant Console"]
        OVERVIEW_PAGE["Overview Analytics & KPI Summary"]
        DISPUTE_CONSOLE["Dispute Management Table & Filters"]
        DETAIL_DRAWER["Slide-out Evidence Dossier & Audit Sheet"]
        GRAPH_CANVAS["Interactive SVG Relationship Graph"]
    end

    %% Flow Connections
    NPCI --> RZP_API
    CARDS --> RZP_API
    RZP_API <--> SYNC_HANDLER
    SYNC_HANDLER --> MODE_GATE
    MODE_GATE --> PRISMA

    PRISMA --> DB_DISPUTES
    PRISMA --> DB_ORDERS
    PRISMA --> DB_DELIVERY
    PRISMA --> DB_COMMS
    PRISMA --> DB_REFUNDS

    DB_DISPUTES --> RULE_ENGINE
    DB_ORDERS --> RULE_ENGINE
    DB_DELIVERY --> RULE_ENGINE
    DB_COMMS --> RULE_ENGINE
    DB_REFUNDS --> RULE_ENGINE

    RULE_ENGINE --> FRAUD_ENGINE
    FRAUD_ENGINE --> GRAPH_BUILDER

    RULE_ENGINE --> DISPUTE_CONSOLE
    GRAPH_BUILDER --> GRAPH_CANVAS

    DISPUTE_CONSOLE --> DETAIL_DRAWER
    DETAIL_DRAWER --> SAFETY_GATE
    SAFETY_GATE --> LLM_GEN
    SAFETY_GATE -. Timeout / No Key .-> SAFE_FALLBACK

    LLM_GEN --> RZP_API
    SAFE_FALLBACK --> RZP_API
    OVERVIEW_PAGE <--> DISPUTE_CONSOLE
```

---

## Dispute Lifecycle & State Machine

A dispute transitions through distinct evaluation and representment states within Aegis:

```mermaid
stateDiagram-v2
    [*] --> Ingested: Dispute Received from Razorpay Webhook / API Sync

    state Ingested {
        [*] --> EvidenceAudit
        EvidenceAudit --> EntityGraphAnalysis
        EntityGraphAnalysis --> ScoreComputed
    }

    ScoreComputed --> HighWinnability: Winnability >= 80%
    ScoreComputed --> NeedsEvidence: Winnability 50% - 79%
    ScoreComputed --> LowWinnability: Winnability < 50%

    state HighWinnability {
        [*] --> AutoDraft
        AutoDraft --> StagedOnRazorpay: PATCH /v1/disputes/:id/contest (action=draft)
    }

    state NeedsEvidence {
        [*] --> ManualReview
        ManualReview --> UploadSupplementary: Merchant uploads missing document
        UploadSupplementary --> ScoreComputed: Re-evaluate
    }

    state LowWinnability {
        [*] --> RecommendationAccept
        RecommendationAccept --> DisputeAccepted: POST /v1/disputes/:id/accept
    }

    StagedOnRazorpay --> Represented: Final Submission to Bank
    Represented --> Won: Bank Rules in Merchant Favor
    Represented --> Lost: Bank Rejects Representment
    DisputeAccepted --> Closed: Forfeited to prevent penalty fees
```

---

## Deterministic Winnability Scoring Engine

Aegis rejects opaque, ungrounded scoring. Every dispute receives a deterministic score between 0 and 100 calculated by evaluating mandatory and supporting evidence items against acquiring network rules.

### Mathematical Formulation

$$\text{Score} = \min\left(100, \sum_{i=1}^{n} w_i \cdot \mathbb{I}(\text{evidence}_i \text{ is verified})\right)$$

Where:
- $w_i$ represents the rule weight assigned to evidence requirement $i$.
- $\mathbb{I}(\cdot)$ is the binary indicator function returning $1$ if evidence is verified and $0$ if absent or unverified.

### Classification Bands

- **High Winnability ($\ge 80\%$):** Mandatory documents verified (e.g., Courier POD with customer signature/OTP, matching GST invoice). Recommendation: `Contest Dispute`.
- **Needs Evidence ($50\% - 79\%$):** Primary transaction logs present, but secondary documentation missing (e.g., device IP telemetry, signed customer acknowledgement). Recommendation: `Gather Evidence`.
- **Low Winnability ($< 50\%$):** Critical fulfillment or delivery proof missing, or confirmed merchant processing error (e.g., unissued refund on duplicate charge). Recommendation: `Accept Dispute` to avoid compounding arbitration penalties.

---

## First-Party Fraud Detection & Entity Relationship Graph

First-party fraud ("friendly fraud") occurs when a legitimate customer makes a purchase and subsequently files a chargeback claiming non-receipt or unauthorized usage.

### Algorithmic Evaluation Criteria

Aegis computes a customer fraud index based on four telemetry dimensions:

1. **Repeat Disputer Ratio:** Ratio of historic disputes to completed orders ($\text{Disputes} / \text{Orders}$).
2. **Identity Verification:** Correlation between customer billing name, shipping address, and phone number.
3. **Delivery Signature & OTP Validation:** Physical proof of delivery containing verified OTP or receiver signature.
4. **Communication Sentiment & Timeline:** Documented pre-dispute support interactions acknowledging receipt.

### Entity Relationship Graph Structure

The fraud detection engine generates an interactive multi-node relationship graph connecting six entity types:

```
[Customer Profile] <---> [Order Record] <---> [Payment Transaction]
       |                       |                      |
       v                       v                      v
[Dispute File]        [Courier Delivery]      [Refund Ledgers]
```

---

## Application DOM & Component Structure

The following tree details the complete document object model and component hierarchy across the application routes:

```
RootLayout (src/app/layout.tsx)
│
├── MerchantModeProvider (src/context/merchant-mode-context.tsx)
│   ├── TooltipProvider (src/components/ui/tooltip.tsx)
│   ├── Toaster (src/components/ui/sonner.tsx)
│   │
│   └── DashboardShell (src/components/dashboard/dashboard-shell.tsx)
│       │
│       ├── Desktop SideNav (<nav className="fixed left-0 top-0 h-screen w-[260px] ...">)
│       │   ├── Brand Header (Razorpay AEGIS Shield)
│       │   ├── Navigation Links List (<ul>)
│       │   │   ├── NavItem: Overview (/overview)
│       │   │   ├── NavItem: Disputes (/disputes)
│       │   │   ├── NavItem: Transactions (/transactions)
│       │   │   ├── NavItem: Settlements (/settlements)
│       │   │   └── NavItem: Settings (/settings)
│       │   ├── Documentation Link (Razorpay Dispute Guidelines)
│       │   └── Mode Badge & Status Indicator
│       │
│       ├── Mobile TopNav (<header className="md:hidden ...">)
│       │   ├── Hamburger Menu Trigger
│       │   └── Brand Identity
│       │
│       ├── Main Content Wrapper (<main className="md:pl-[260px] ...">)
│       │   │
│       │   ├── Top Header Bar (<header className="bg-white border-b ...">)
│       │   │   ├── Global Search Input (<input type="search" ...>)
│       │   │   ├── ModeSwitcher (src/components/dashboard/mode-switcher.tsx)
│       │   │   │   └── Toggle Pill: Test Sandbox (Seed) vs Live API (Production)
│       │   │   ├── Notification Bell Drawer (<DropdownMenu ...>)
│       │   │   │   └── Dispute SLA Warning Items List
│       │   │   └── Merchant Account Menu (<DropdownMenu ...>)
│       │   │       ├── Merchant ID & Verification Status
│       │   │       ├── Connect Razorpay Account Button
│       │   │       └── Sign Out Action
│       │   │
│       │   ├── Page Router Container (<div className="p-6 md:p-8 ...">)
│       │   │   │
│       │   │   ├── [Route: /overview] (src/app/overview/page.tsx)
│       │   │   │   ├── Hero Problem / Solution Briefing Card
│       │   │   │   ├── High-Level KPI Metric Cards (4-Grid)
│       │   │   │   │   ├── Total Volume at Risk (INR)
│       │   │   │   │   ├── Recoverable Amount (High Win Rate Volume)
│       │   │   │   │   ├── Projected Win Rate Percentage
│       │   │   │   │   └── Auto-Defense Engine Status
│       │   │   │   ├── Winnability Distribution Gauge Card
│       │   │   │   └── Razorpay Reason Code Defense Rules Matrix
│       │   │   │
│       │   │   ├── [Route: /disputes] (src/app/disputes/page.tsx)
│       │   │   │   ├── Console Action Bar (Sync API, Download Audit Report)
│       │   │   │   ├── Mode Context Banner (Sandbox Notice / Live Account Banner)
│       │   │   │   ├── Interactive Filter Cards (High, Needs Evidence, Low)
│       │   │   │   ├── Active Filter & Search Tag Strip
│       │   │   │   ├── Disputes Data Table
│       │   │   │   │   ├── Table Header (Sortable Columns: ID, Date, Amount, Winnability)
│       │   │   │   │   ├── Table Body (Paginated Rows with Status Badges)
│       │   │   │   │   └── Table Pagination Controls (Page Slices)
│       │   │   │   │
│       │   │   │   └── DisputeDetailSheet (src/components/disputes/dispute-detail-sheet.tsx)
│       │   │   │       ├── SheetHeader (Dispute ID, Reason Code, SLA Countdown)
│       │   │   │       ├── Winnability Gauge & Breakdown Reason List
│       │   │   │       ├── Order & Customer Summary Dossier
│       │   │   │       ├── Delivery & POD Verification Section
│       │   │   │       ├── Evidence Checklist (Shipping, Invoices, Comms, Terms)
│       │   │   │       ├── FraudSignalCard (src/components/disputes/fraud-signal-card.tsx)
│       │   │   │       │   ├── Fraud Risk Score Pill
│       │   │   │       │   ├── Contributing Factors List
│       │   │   │       │   ├── Defense Strategy Impact Note
│       │   │   │       │   └── RelationshipGraph (src/components/disputes/relationship-graph.tsx)
│       │   │   │       │       └── Interactive SVG Node Canvas (Nodes + Links)
│       │   │   │       ├── Custom Prompt Instructions Textarea
│       │   │   │       ├── AI Rebuttal Drafting & Safe-Mode Generator Panel
│       │   │   │       │   ├── Razorpay Contest Summary Box (<= 1000 Chars)
│       │   │   │       │   ├── Formal Explanation Letter (Copy Action)
│       │   │   │       │   └── Cited Evidence File References
│       │   │   │       └── Action Footer (Draft on Razorpay, Accept Dispute)
│       │   │   │
│       │   │   ├── [Route: /transactions] (src/app/transactions/page.tsx)
│       │   │   │   ├── Transaction Header & Export Controls
│       │   │   │   ├── Status Filter Buttons (All, Captured, Disputed)
│       │   │   │   └── Payment Gateway Transactions Table
│       │   │   │
│       │   │   ├── [Route: /settlements] (src/app/settlements/page.tsx)
│       │   │   │   ├── Settlement Summary Cards (MTD Settled, Dispute Reserve Hold)
│       │   │   │   └── Banking Settlements & UTR Payouts Table
│       │   │   │
│       │   │   └── [Route: /settings] (src/app/settings/page.tsx)
│       │   │       ├── Merchant Integration Profile Card
│       │   │       ├── Winnability Score Auto-Contest Slider
│       │   │       ├── Autonomous Rules Checkboxes (Auto-Draft, Auto-Accept)
│       │   │       └── Infrastructure & Database Topology Summary
│       │   │
│       │   └── ConnectRazorpayModal (src/components/dashboard/connect-razorpay-modal.tsx)
│       │       ├── API Key ID & Secret Input Form
│       │       ├── Server-Side Verification Action
│       │       └── Razorpay OAuth 2.0 Partner Information
│       │
│       └── Application Footer (Copyright, SLA Notice, API Reference Links)
```

---

## Supported Network Reason Codes

Aegis includes tailored scoring rules and defense strategies for both NPCI UPI and traditional card network reason codes:

| Code | Network | Description | Key Required Evidence | Target Winnability | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1064** | UPI | Goods / Services Not Received | Signed BlueDart/Delhivery POD, OTP, GST Invoice | **94% (High)** | Contest with POD & Delivery Logs |
| **108** | UPI | Debited, Beneficiary Not Credited | Razorpay Settlement UTR, Digital Provisioning Log | **82% (High)** | Contest with Gateway Capture Log |
| **4837** | Card | No Cardholder Authorisation | 3D-Secure OTP Auth, IP Geo-correlation, Billing Proof | **68% (Needs Evidence)** | Gather Device IP & Access Logs |
| **1084** | UPI | Duplicate Processing / Multiple Debits | Distinct Invoices, Session Telemetry, Explanation Letter | **62% (Needs Evidence)** | Upload Invoices or Accept if Duplicate |
| **1062** | Card | Goods Not As Described / Defective | SKU Catalog Match, Published Return Policy, Support Logs | **45% (Low)** | Accept unless Pre-Dispute RMA Resolved |
| **1061** | UPI | Credit / Refund Not Processed | Banking Refund ARN, Settlement Payout UTR | **23% (Low)** | Accept (Refund was not initiated) |

---

## API Reference

### Health & Diagnostics

```http
GET /api/health
```
- **Description:** Verifies service availability and operational readiness.
- **Response:**
  ```json
  {
    "ok": true,
    "service": "razorpay-aegis",
    "timestamp": "2026-09-03T04:00:00.000Z"
  }
  ```

---

### Dispute Management

```http
GET /api/disputes?mode=test|live
```
- **Description:** Retrieves active disputes with calculated winnability scores, fraud indicators, and aggregate KPI statistics.

```http
GET /api/disputes/:id
```
- **Description:** Fetches the full dispute dossier, including order history, courier delivery tracking, customer communication logs, evidence item checklist, and reason code rules.

```http
POST /api/disputes/:id/draft
```
- **Description:** Generates an evidence-grounded rebuttal letter and stages the representment on the Razorpay Contest Dispute API in `draft` mode.
- **Request Body:**
  ```json
  {
    "customInstructions": "Emphasize courier OTP verification and GST invoice"
  }
  ```
- **Response:**
  ```json
  {
    "ok": true,
    "mode": "draft",
    "source": "llm",
    "draftedRebuttal": {
      "summary": "Formal rebuttal for Dispute disp_1064...",
      "explanationLetter": "To the Acquiring Bank Disputes Committee...",
      "citedEvidence": ["shipping_proof", "billing_proof"]
    },
    "razorpayContestResult": {
      "success": true,
      "action": "draft",
      "disputeId": "disp_1064_goods_not_received"
    }
  }
  ```

```http
POST /api/disputes/:id/accept
```
- **Description:** Idempotently accepts a dispute to prevent compounding penalty fees and notifies the Razorpay API.

```http
POST /api/disputes/sync?mode=test|live
```
- **Description:** Triggers live synchronization with the Razorpay Disputes API (`GET /v1/disputes`), merging live account events with the local datastore.

---

### Merchant Account Integration

```http
GET /api/merchant/status
```
- **Description:** Returns the active merchant connection status, merchant ID, and operating mode.

```http
POST /api/merchant/connect
```
- **Description:** Verifies and securely links merchant Razorpay Key ID and Key Secret credentials.

```http
POST /api/merchant/disconnect
```
- **Description:** Disconnects the live Razorpay merchant account and falls back to the test sandbox.

---

### Webhook Security & Ingestion Pipeline

```http
POST /api/webhooks/razorpay
```
- **Description:** Ingests real-time dispute lifecycle webhooks from Razorpay with HMAC-SHA256 signature verification, strict Zod validation, SHA-256 payload deduplication, and immutable audit event recording.
- **Headers:**
  - `x-razorpay-signature`: HMAC-SHA256 signature generated with `RAZORPAY_WEBHOOK_SECRET`
  - `x-request-id`: Optional tracing request identifier
- **Supported Events:**
  - `dispute.created`: Staged into Aegis defense queue as `open` dispute with SLA countdown.
  - `dispute.under_review`: Transitions dispute status to `under_review`.
  - `dispute.won`: Resolves dispute as `won` in favor of merchant.
  - `dispute.lost`: Closes dispute as `lost`.
- **Response Codes:**
  - `200 OK`: Successful ingestion (`status: "processed"`), duplicate skipped (`status: "duplicate"`), or unsupported event ignored (`status: "ignored"`).
  - `400 Bad Request`: Empty request body, malformed JSON, or schema validation failure (`EMPTY_BODY`, `MALFORMED_JSON`, `SCHEMA_VALIDATION_ERROR`).
  - `401 Unauthorized`: Missing or invalid HMAC-SHA256 signature (`UNAUTHORIZED_WEBHOOK`).
  - `405 Method Not Allowed`: Non-POST HTTP methods.

#### Webhook Ingestion Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    participant RZP as Razorpay Gateway
    participant Route as Next.js Webhook Router (/api/webhooks/razorpay)
    participant Auth as HMAC Verifier (crypto.timingSafeEqual)
    participant Validator as Zod Schema Validator
    participant Service as Webhook Ingestion Service
    participant Store as Neon DB / Immutable Store

    RZP->>Route: POST /api/webhooks/razorpay (Raw Body + Signature)
    Route->>Auth: Verify HMAC-SHA256(rawBody, WEBHOOK_SECRET)
    alt Invalid or Missing Signature
        Auth-->>Route: Invalid Signature
        Route-->>RZP: 401 Unauthorized (UNAUTHORIZED_WEBHOOK)
    else Signature Valid
        Auth-->>Route: Verified OK
        Route->>Validator: Parse & Validate Payload Schema
        alt Schema Validation Failed / Malformed JSON
            Validator-->>Route: Validation Error
            Route-->>RZP: 400 Bad Request
        else Valid Schema
            Validator-->>Route: Valid Payload
            Route->>Service: processWebhookPayload(...)
            Service->>Store: Check Payload Hash Deduplication
            alt Duplicate Event
                Store-->>Service: Duplicate Detected
                Service-->>Route: status="duplicate"
                Route-->>RZP: 200 OK (Duplicate Ignored)
            else New Event
                Service->>Store: Persist WebhookEvent (status="processed")
                Service->>Store: Persist AuditEvent (WEBHOOK_RECEIVED + Event Action)
                Service->>Store: Apply Dispute State Transition
                Service-->>Route: status="processed"
                Route-->>RZP: 200 OK (Successfully Processed)
            end
        end
    end
```

---

## Platform-Wide Immutable Audit Ledger

Aegis implements an append-only, cryptographic, and centralized financial audit ledger (`AuditService`) as the authoritative source of truth for all operational events across the dispute defense lifecycle.

### Core Architecture & Guarantees

1. **Append-Only Immutability**: No update or delete operations exist. Every operational mutation creates a new permanently timestamped ledger entry.
2. **Correlation & Request Tracing**: Every inbound HTTP request, webhook, and automated job receives an end-to-end `correlationId` (`corr_...`) and `requestId` (`req_...`) propagated across API controllers, background services, audit events, and structured logs.
3. **Sensitive Data Redaction**: API keys, webhook secrets, passwords, auth tokens, and session headers are automatically masked (e.g. `rzp_live_...1234`) before write persistence.
4. **Resilient Dual Storage**: Asynchronously writes to Neon Serverless PostgreSQL with in-memory transaction store fallback.

```mermaid
flowchart TD
    subgraph TracingContext ["Distributed Trace Context"]
        INBOUND["Inbound Request\n(Headers: x-correlation-id, x-request-id)"]
        EXTRACT["extractTraceContext()\n(Derives correlationId, requestId, ipAddress, userAgent)"]
    end

    subgraph PlatformEvents ["Platform Subsystems"]
        WEBHOOK["Webhook Ingestion\n(WEBHOOK_RECEIVED, DISPUTE_CREATED)"]
        SYNC["Dispute Synchronization\n(DISPUTE_SYNCED, DISPUTE_IMPORTED)"]
        DRAFT["Rebuttal Generation Engine\n(SCORE_RECOMPUTED, REBUTTAL_GENERATED, SAFE_MODE_USED, DRAFT_STAGED)"]
        ACCEPT["Dispute Acceptance\n(DISPUTE_ACCEPTED)"]
        AUTH["Merchant Authentication\n(MERCHANT_CONNECTED, MERCHANT_DISCONNECTED, LIVE_MODE_ENABLED)"]
    end

    subgraph CentralizedService ["AuditService Core"]
        RECORD["AuditService.record(...)"]
        SANITIZE["Sensitive Credential Sanitization & Masking"]
        DISPATCH["Structured Async Dispatch"]
    end

    subgraph StorageEngine ["Dual Persistence Layer"]
        PRISMA_AUDIT[("Neon PostgreSQL\n(audit_events table)")]
        MEM_AUDIT[("In-Memory Circular Ledger\n(Zero-Failure Fallback)")]
    end

    INBOUND --> EXTRACT
    EXTRACT --> WEBHOOK
    EXTRACT --> SYNC
    EXTRACT --> DRAFT
    EXTRACT --> ACCEPT
    EXTRACT --> AUTH

    WEBHOOK --> RECORD
    SYNC --> RECORD
    DRAFT --> RECORD
    ACCEPT --> RECORD
    AUTH --> RECORD

    RECORD --> SANITIZE
    SANITIZE --> DISPATCH
    DISPATCH --> PRISMA_AUDIT
    DISPATCH --> MEM_AUDIT
```

### Audit Event Taxonomy

| Event Type | Actor Type | Trigger Source | Description |
|:---|:---|:---|:---|
| `WEBHOOK_RECEIVED` | `webhook` | Razorpay Gateway | Inbound webhook payload received and signature verified |
| `WEBHOOK_IGNORED` | `webhook` | Razorpay Gateway | Non-dispute webhook event safely acknowledged |
| `DISPUTE_CREATED` | `webhook` | Razorpay Gateway | New dispute opened and staged in defense pipeline |
| `DISPUTE_UNDER_REVIEW` | `webhook` | Razorpay Gateway | Gateway confirms dispute rebuttal is under network review |
| `DISPUTE_WON` | `webhook` | Acquiring Bank | Dispute resolved in favor of merchant; funds recovered |
| `DISPUTE_LOST` | `webhook` | Acquiring Bank | Dispute closed as lost to cardholder |
| `DISPUTE_IMPORTED` | `api` | Aegis Sync Engine | Live dispute pulled from Razorpay Disputes API |
| `DISPUTE_SYNCED` | `api` | Aegis Sync Engine | Dispute catalog synchronization completed |
| `SCORE_COMPUTED` | `system` | Scoring Engine | Initial winnability score calculated |
| `SCORE_RECOMPUTED` | `system` | Scoring Engine | Score recalculated with freshly attached evidence items |
| `FRAUD_ANALYZED` | `system` | Entity Graph | First-party fraud signal analysis generated |
| `REBUTTAL_GENERATED` | `merchant` | Rebuttal Engine | Rebuttal dossier generated for dispute reason code |
| `SAFE_MODE_USED` | `system` | Template Engine | Deterministic fallback activated |
| `DRAFT_STAGED` | `merchant` | Rebuttal Console | Evidence dossier staged for submission |
| `DISPUTE_ACCEPTED` | `merchant` | Action Bar | Dispute conceded to prevent compounding fee penalties |
| `MERCHANT_CONNECTED` | `merchant` | Settings / Modal | Live Razorpay merchant account connected |
| `MERCHANT_DISCONNECTED` | `merchant` | Mode Switcher | Merchant account unlinked; switched to Test Mode |
| `LIVE_MODE_ENABLED` | `merchant` | Mode Switcher | Live operating mode activated |
| `TEST_MODE_ENABLED` | `merchant` | Mode Switcher | Test sandbox mode activated |

---

## Design System & Interface Tokens

Aegis implements an interface following Razorpay's design language:

```
+-------------------------------------------------------------------------------+
| Razorpay Design Tokens                                                        |
+----------------------+--------------------+-----------------------------------+
| Token Name           | Value              | Usage                             |
+----------------------+--------------------+-----------------------------------+
| Primary Brand        | #305EFF            | Action buttons, active navigation |
| Primary Hover        | #2950DA            | Button hover states               |
| Deep Navy (RZP)      | #0D1A48            | Sidebar background, brand accents |
| Ink / Primary Text   | #0D1C2D            | Headings, primary table text      |
| Muted Slate          | #5D6D86            | Subheadings, column captions      |
| Border Subtle        | #DFE3E9            | Card borders, divider lines       |
| Page Background      | #F8FAFC            | Global background                 |
| Success Green        | #00A251            | High winnability, captured status |
| Attention Amber      | #E08600            | Needs evidence, pending action    |
| Danger Red           | #ED2939            | Low winnability, disputed status  |
| Component Radius     | 4px (Strict)       | All inputs, cards, tables, badges |
| Display Typography   | TASA Orbiter       | Headline elements                 |
| Body Typography      | Inter              | Data tables, prose, form controls |
+----------------------+--------------------+-----------------------------------+
```

---

## Local Setup & Development Guide

### Prerequisites

- Node.js 20.x or higher
- npm or pnpm
- PostgreSQL database instance (Neon Serverless PostgreSQL recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/YashDoesCode/aegis.razorpay.com.git
cd aegis.razorpay.com
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure the environment variables:

```env
# Database Connection (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Razorpay API Credentials (Optional for sandbox, required for live sync)
RAZORPAY_KEY_ID="rzp_test_YourKeyId"
RAZORPAY_KEY_SECRET="YourKeySecret"
RAZORPAY_WEBHOOK_SECRET="whsec_YourWebhookSecret"

# OpenAI API Key (Optional — system falls back to deterministic safe mode)
OPENAI_API_KEY="sk-proj-YourKey"
```

### 4. Database Migration & Seeding

```bash
# Push schema migrations to Neon PostgreSQL
npx prisma migrate deploy

# Seed the 6 dispute cases and evidence items
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` in your browser.

---

## Verification & Testing

Aegis includes automated test suites covering unit logic, integration endpoints, and live production flows:

```bash
# Run unit and integration test suite with Vitest
npm test

# Run Next.js production build verification
npm run build

# Run Playwright end-to-end browser automation tests
npm run test:e2e

# Run Python production verification script
python3 test_production_qa.py
```

---

## References & Standards

1. **Razorpay Developer Documentation:**
   - [Razorpay Disputes API Guide](https://razorpay.com/docs/payments/disputes/)
   - [Razorpay Payment Gateway Integration](https://razorpay.com/docs/payments/payment-gateway/)
   - [Razorpay API Authentication & Keys](https://razorpay.com/docs/api/)

2. **NPCI (National Payments Corporation of India):**
   - [NPCI Unified Payments Interface (UPI) Procedural Guidelines](https://www.npci.org.in/what-we-do/upi/product-overview)
   - [UPI Dispute Management System (UDIR) Framework](https://www.npci.org.in/)

3. **Card Scheme Dispute Standards:**
   - [Visa Core Rules and Visa Product and Service Rules (Dispute Management)](https://usa.visa.com/support/consumer/visa-rules.html)
   - [Mastercard Chargeback Guide and Dispute Resolution](https://www.mastercard.us/en-us/business/overview/support/rules.html)

4. **Internal Research & Design Artifacts:**
   - `References/Checkout Page Design _ B2B Design Tips & Insights - Razorpay Payment Gateway.pdf`
   - `References/Payment Gateway Integration - SDK & API, Web, Android, PHP, iOS.pdf`
   - `References/Razorpay — UX_UI Design by Juhi Chitra.pdf`

---

## License

Distributed under the [MIT License](LICENSE).
