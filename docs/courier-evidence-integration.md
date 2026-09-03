# 3PL Logistics & Courier Evidence Ingestion Architecture

## Overview

Razorpay Aegis implements a production-grade, provider-agnostic 3PL / courier evidence ingestion architecture engineered for physical-order disputes under Indian payment rails and logistics networks.

This architecture directly solves the **"Goods / Services Not Received" (UPI 1064 / Card 4837)** representment challenge by ingesting carrier webhook scans, on-demand tracking data, and Proof of Delivery (POD) documents, automatically binding them to the dispute defense pipeline.

---

## 1. Provider-Agnostic Adapter Abstraction

The courier layer is designed around an extensible interface (`CourierAdapter`) decoupling carrier-specific API formats and webhook protocols from the Aegis dispute domain.

```typescript
export interface CourierAdapter {
  readonly providerId: string;
  readonly displayName: string;

  verifyWebhookSignature(
    rawBody: string,
    signature: string | null,
    secret: string
  ): boolean;

  parseWebhookEvent(
    rawBody: string,
    headers?: Record<string, string>
  ): Promise<NormalizedShipmentWebhookEvent>;

  fetchTracking(
    trackingId: string,
    credentials?: { apiToken?: string; baseUrl?: string }
  ): Promise<NormalizedShipment>;
}
```

### Provider Implementation Status

| Provider | Implementation Type | Webhook Verification | Tracking API Integration | Status |
|:---|:---|:---|:---|:---|
| **`delhivery`** (`DelhiveryAdapter`) | **Production Adapter** | Constant-time HMAC-SHA256 & Bearer token verification | Real HTTP client (`https://track.delhivery.com/api/v1/packages/json/`) with 5000ms timeout, `Authorization: Token` header, and Zod schema validation. Fails closed if token is missing in production. | **Production Ready** |
| **`mock`** (`MockCourierAdapter`) | **Deterministic Test Fixture** | Constant-time HMAC simulation | In-memory deterministic generator. Explicitly tagged with `source: "mock"`. | **Test / Sandbox Only** |

---

## 2. Canonical Shipment Lifecycle & State Monotonicity

Heterogeneous carrier scan codes are mapped into a standardized 10-state lifecycle with strict precedence ranks to prevent out-of-order state regression:

| Canonical Status | Precedence Rank | Meaning | Evidence & Dispute Defense Impact |
|:---|:---:|:---|:---|
| `CREATED` | 1 | AWB created; awaiting warehouse collection | Neutral (Fulfillment initiated) |
| `PICKED_UP` | 2 | Package collected from merchant warehouse | Proves package in carrier custody |
| `IN_TRANSIT` | 3 | Package moving across carrier transit hubs | Proves active dispatch |
| `OUT_FOR_DELIVERY` | 4 | Package out with delivery agent | Delivery imminent |
| `DELIVERED` | 5 | Package successfully handed over to recipient | **Primary Evidence**: Creates verified `shipping_proof`, sets `signatureCaptured` flag, and attaches POD reference if provided. |
| `FAILED_DELIVERY` | 0 | Delivery attempt failed (customer unavailable) | Documents attempted fulfillment |
| `RETURNED` | 0 | Package returned to origin (RTO) | Evidence for concession or return processing |
| `CANCELLED` | 0 | Dispatch cancelled before completion | Order cancellation evidence |
| `LOST` | 0 | Package lost or damaged in carrier custody | Carrier liability claim record |
| `EXCEPTION` | 0 | Operational delay (customs, weather, bad address) | Timeline documentation |

### Anti-Regression Rule (State Monotonicity)
If a shipment is already confirmed `DELIVERED` at timestamp $T_1$, an out-of-order or delayed webhook event with status `IN_TRANSIT` or `PICKED_UP` at timestamp $T_0 \le T_1$ will **never regress** the delivery record or unset the verified `shipping_proof` evidence.

---

## 3. Webhook Security & Fail-Closed Guarantees

1. **Fail-Closed in Production**:
   In `NODE_ENV === "production"`, if `DELHIVERY_WEBHOOK_SECRET` or `COURIER_WEBHOOK_SECRET` is missing, or if the incoming signature is absent/invalid, the webhook route immediately rejects with HTTP 401 (`UNAUTHORIZED_WEBHOOK`).
2. **Constant-Time Verification**:
   Signatures are verified using `crypto.timingSafeEqual` over HMAC-SHA256 digests and token buffers to eliminate timing side-channel attacks.
3. **Database-Backed Persistent Idempotency**:
   Every webhook payload is hashed with SHA-256 (`computeCourierPayloadHash`). Replays or repeated carrier deliveries are safely recognized as duplicates (`status: "duplicate"`) via database unique constraints on `payloadHash`.
4. **Distributed Trace Context**:
   `correlationId` (`corr_courier_...`) and `requestId` (`req_courier_...`) are tracked across controllers, adapter parsing, evidence attachment, audit ledger writes, and structured logs.

---

## 4. Forensic Evidence Integrity & Zero-Manufacture Policy

A critical forensic requirement of Aegis:
- **Delivery Confirmation $\ne$ POD Document**: A status of `DELIVERED` confirms that carrier tracking recorded fulfillment. It does **NOT** automatically imply that a physical POD document was uploaded.
- **Zero Fake PODs**: The system **never** synthesizes fake `POD-DLV-...` strings in production evidence records.
- If the carrier payload contains a genuine document URL or reference, `documentRef` is recorded and tagged as `POD Document Verified`.
- If no POD document URL is supplied, `documentRef` remains `undefined`, and the evidence note explicitly states: `Carrier delivery scan on file (No POD document attached)`.

---

## 5. Automated Downstream Scoring & Defense Integration

When a courier webhook updates a dispute's delivery telemetry:
1. **Automated Recomputation**: `CourierService` automatically invokes `computeWinnability()` and `computeFraudSignal()`.
2. **Winnability Score Uplift**:
   - `shipping_proof_present` is marked `MET` (+34 pts for UPI 1064 / Card 4837).
   - `tracking_matches_customer` is marked `MET` (+25 pts with signature/OTP verification).
   - Overall dispute winnability transitions to the **High Band** ($\ge 80\%$), updating the merchant recommendation to `CONTEST`.
3. **Audit Ledger Entry**: Emits an immutable `SCORE_RECOMPUTED` audit event with updated score, previous status, and fraud band telemetry.
4. **Rebuttal Grounding**: Injects verified carrier name, AWB tracking ID, delivery timestamp, recipient address match, and digital signature status into representment letters.

---

## 6. Live vs Test Mode Isolation

- **Test Mode**: Operates using seeded mock dispute references (`dataSource === "seed"`) and deterministic mock courier adapters (`MockCourierAdapter`).
- **Live Mode**: Ingests real 3PL carrier webhooks and queries production carrier APIs.
- **Zero Exposure**: Carrier secrets, webhook tokens, and internal database keys are never returned to client browsers or printed in log contexts.
