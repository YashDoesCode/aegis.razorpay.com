import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/disputes/[id]/submit/route";
import { AuditService } from "@/lib/audit";
import { resetInMemoryAuditStore, resetInMemoryDisputes, getInMemoryDisputeById } from "@/lib/mockStore";
import { NextRequest } from "next/server";

describe("Dispute Contest Submission Engine Tests", () => {
  beforeEach(() => {
    resetInMemoryAuditStore();
    resetInMemoryDisputes();
  });

  it("submits dispute rebuttal and transitions status to under_review", async () => {
    const disputeId = "disp_1064_goods_not_received";
    const correlationId = "corr_submit_test_001";
    const requestId = "req_submit_001";

    const request = new NextRequest(`http://localhost:3000/api/disputes/${disputeId}/submit?mode=test&forceFallback=true`, {
      method: "POST",
      headers: {
        "x-correlation-id": correlationId,
        "x-request-id": requestId,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        summary: "Merchant hereby submits proof of delivery via BlueDart AWB 987654321.",
        evidenceMap: {
          shipping_proof: ["doc_shipping_pod_1064"],
          customer_communication: ["doc_comms_email_1064"],
        },
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: disputeId }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe("under_review");
    expect(json.data.contestResult.action).toBe("submit");

    const updatedDispute = getInMemoryDisputeById(disputeId);
    expect(updatedDispute?.status).toBe("under_review");

    const audits = await AuditService.getByDispute(disputeId);
    const contestEvent = audits.find((a) => a.eventType === "DISPUTE_CONTESTED");

    expect(contestEvent).toBeDefined();
    expect(contestEvent?.actorType).toBe("merchant");
    expect(contestEvent?.source).toBe("ui");
    expect(contestEvent?.correlationId).toBe(correlationId);
    expect(contestEvent?.requestId).toBe(requestId);
  }, 15000);

  it("automatically generates rebuttal if summary is not provided in body", async () => {
    const disputeId = "disp_108_beneficiary_not_credited";
    const correlationId = "corr_auto_rebuttal_002";

    const request = new NextRequest(`http://localhost:3000/api/disputes/${disputeId}/submit?mode=test&forceFallback=true`, {
      method: "POST",
      headers: {
        "x-correlation-id": correlationId,
      },
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: disputeId }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe("under_review");

    const audits = await AuditService.getByDispute(disputeId);
    expect(audits.some((a) => a.eventType === "DISPUTE_CONTESTED")).toBe(true);
  }, 15000);

  it("returns 404 for non-existent dispute ID", async () => {
    const disputeId = "disp_non_existent_id_999";
    const request = new NextRequest(`http://localhost:3000/api/disputes/${disputeId}/submit?mode=test`, {
      method: "POST",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: disputeId }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
  });

  it("returns 400 for finalized dispute (e.g. already lost)", async () => {
    const disputeId = "disp_1084_duplicate_processing";
    const dispute = getInMemoryDisputeById(disputeId);
    if (dispute) {
      dispute.status = "lost";
    }

    const request = new NextRequest(`http://localhost:3000/api/disputes/${disputeId}/submit?mode=test`, {
      method: "POST",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: disputeId }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.code).toBe("DISPUTE_FINALIZED");
  }, 15000);

  it("returns 500 when forceError is requested for resilience testing", async () => {
    const disputeId = "disp_1064_goods_not_received";
    const request = new NextRequest(`http://localhost:3000/api/disputes/${disputeId}/submit?forceError=500`, {
      method: "POST",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: disputeId }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.code).toBe("SIMULATED_FAILURE");
  });
});
