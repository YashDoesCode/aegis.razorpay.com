import { describe, it, expect, beforeEach } from "vitest";
import { POST as draftPost } from "@/app/api/disputes/[id]/draft/route";
import { POST as acceptPost } from "@/app/api/disputes/[id]/accept/route";
import { POST as syncPost } from "@/app/api/disputes/sync/route";
import { POST as connectPost } from "@/app/api/merchant/connect/route";
import { POST as disconnectPost } from "@/app/api/merchant/disconnect/route";
import { AuditService } from "../service";
import { resetInMemoryAuditStore, resetInMemoryWebhookStore, resetInMemoryDisputes } from "@/lib/mockStore";
import { NextRequest } from "next/server";

describe("Audit Trail Subsystem Integration Tests", () => {
  beforeEach(() => {
    resetInMemoryAuditStore();
    resetInMemoryWebhookStore();
    resetInMemoryDisputes();
  });

  it("records immutable audit trail during dispute rebuttal drafting", async () => {
    const disputeId = "disp_1064_goods_not_received";
    const correlationId = "corr_draft_flow_test_001";
    const requestId = "req_draft_001";

    const request = new NextRequest(`http://localhost:3000/api/disputes/${disputeId}/draft?mode=test&forceFallback=true`, {
      method: "POST",
      headers: {
        "x-correlation-id": correlationId,
        "x-request-id": requestId,
        "content-type": "application/json",
      },
      body: JSON.stringify({ customInstructions: "Add signature confirmation" }),
    });

    const response = await draftPost(request, {
      params: Promise.resolve({ id: disputeId }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);

    const auditTrail = await AuditService.getByDispute(disputeId);
    expect(auditTrail.length).toBeGreaterThanOrEqual(3);

    const eventTypes = auditTrail.map((a) => a.eventType);
    expect(eventTypes).toContain("SCORE_RECOMPUTED");
    expect(eventTypes).toContain("REBUTTAL_GENERATED");
    expect(eventTypes).toContain("SAFE_MODE_USED");
    expect(eventTypes).toContain("DRAFT_STAGED");

    expect(auditTrail.every((a) => a.correlationId === correlationId)).toBe(true);
  });

  it("records immutable audit trail during dispute acceptance", async () => {
    const disputeId = "disp_1084_duplicate_processing";
    const correlationId = "corr_accept_flow_002";

    const request = new NextRequest(`http://localhost:3000/api/disputes/${disputeId}/accept?mode=test`, {
      method: "POST",
      headers: {
        "x-correlation-id": correlationId,
      },
    });

    const response = await acceptPost(request, {
      params: Promise.resolve({ id: disputeId }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);

    const auditTrail = await AuditService.getByDispute(disputeId);
    const acceptEvent = auditTrail.find((a) => a.eventType === "DISPUTE_ACCEPTED");

    expect(acceptEvent).toBeDefined();
    expect(acceptEvent?.actorType).toBe("merchant");
    expect(acceptEvent?.source).toBe("ui");
    expect(acceptEvent?.correlationId).toBe(correlationId);
  });

  it("records audit events during dispute sync", async () => {
    const correlationId = "corr_sync_flow_003";

    const request = new NextRequest("http://localhost:3000/api/disputes/sync?mode=test", {
      method: "POST",
      headers: {
        "x-correlation-id": correlationId,
      },
    });

    const response = await syncPost(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);

    const syncAudits = await AuditService.query({ correlationId });
    expect(syncAudits.length).toBe(1);
    expect(syncAudits[0].eventType).toBe("DISPUTE_SYNCED");
  });

  it("records audit events during merchant connect and disconnect", async () => {
    const correlationIdConnect = "corr_merchant_conn_004";
    const connectReq = new NextRequest("http://localhost:3000/api/merchant/connect", {
      method: "POST",
      headers: {
        "x-correlation-id": correlationIdConnect,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        keyId: "rzp_test_IntegrationKeyId",
        keySecret: "TestKeySecret12345",
        merchantName: "Audit Test Merchant",
      }),
    });

    const connectRes = await connectPost(connectReq);
    expect(connectRes.status).toBe(200);

    const connectAudits = await AuditService.getByCorrelationId(correlationIdConnect);
    expect(connectAudits.length).toBe(2);
    expect(connectAudits.some((a) => a.eventType === "MERCHANT_CONNECTED")).toBe(true);
    expect(connectAudits.some((a) => a.eventType === "TEST_MODE_ENABLED")).toBe(true);

    const correlationIdDisconnect = "corr_merchant_disc_005";
    const disconnectReq = new NextRequest("http://localhost:3000/api/merchant/disconnect", {
      method: "POST",
      headers: {
        "x-correlation-id": correlationIdDisconnect,
      },
    });

    const disconnectRes = await disconnectPost(disconnectReq);
    expect(disconnectRes.status).toBe(200);

    const disconnectAudits = await AuditService.getByCorrelationId(correlationIdDisconnect);
    expect(disconnectAudits.length).toBe(2);
    expect(disconnectAudits.some((a) => a.eventType === "MERCHANT_DISCONNECTED")).toBe(true);
    expect(disconnectAudits.some((a) => a.eventType === "TEST_MODE_ENABLED")).toBe(true);
  });
});
