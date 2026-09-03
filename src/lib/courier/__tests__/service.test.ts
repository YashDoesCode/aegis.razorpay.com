import { describe, it, expect, beforeEach } from "vitest";
import { processCourierWebhook, syncTrackingForDispute } from "../service";
import { fallbackDisputes } from "../../mockStore";
import { computeWinnability } from "../../scoring";
import { computeFraudSignal } from "../../fraudSignal";

describe("3PL Courier Ingestion Service & Evidence Pipeline", () => {
  beforeEach(() => {
    // Reset test dispute state in fallbackDisputes if needed
  });

  it("1. Ingests successful delivery webhook and attaches verified shipping_proof evidence", async () => {
    const rawPayload = JSON.stringify({
      trackingId: "BD889210492IN",
      orderId: "order_upi_1064_001",
      status: "DELIVERED",
      signatureCaptured: true,
      timestamp: new Date().toISOString(),
      podDocumentRef: "POD_BD_VERIFIED_889210492",
    });

    const result = await processCourierWebhook({
      rawBody: rawPayload,
      providerId: "mock",
    });

    expect(result.status).toBe("processed");
    expect(result.evidenceAttached).toBe(true);
    expect(result.trackingId).toBe("BD889210492IN");
    expect(result.disputeId).toBe("disp_1064_goods_not_received");

    // Verify dispute state
    const dispute = fallbackDisputes.find((d) => d.id === "disp_1064_goods_not_received");
    expect(dispute).toBeDefined();
    expect(dispute?.order?.delivery?.signatureCaptured).toBe(true);
    expect(dispute?.order?.delivery?.deliveredAt).toBeDefined();

    const proof = dispute?.evidenceItems.find((e) => e.type === "shipping_proof");
    expect(proof).toBeDefined();
    expect(proof?.present).toBe(true);
    expect(proof?.documentRef).toBe("POD_BD_VERIFIED_889210492");

    // Verify Winnability Score reflects verified delivery
    const winnability = computeWinnability(dispute!, dispute!.evidenceItems, dispute!.order?.customer);
    expect(winnability.score).toBeGreaterThanOrEqual(80);
    expect(winnability.band).toBe("high");
    expect(winnability.recommendation).toBe("contest");

    // Verify Fraud Signal evaluates fulfillment vs INR claim
    const fraud = computeFraudSignal(dispute!, dispute!.evidenceItems);
    expect(fraud.defenseImpact).toBeDefined();
    expect(fraud.contributingFactors.some((f) => f.id === "factor_contradictory_delivery")).toBe(true);
  });

  it("2. Handles duplicate webhook payloads idempotently", async () => {
    const rawPayload = JSON.stringify({
      trackingId: "UNIQUE_AWB_ID_DUPLICATE_TEST_01",
      orderId: "order_upi_1064_001",
      status: "IN_TRANSIT",
      timestamp: new Date().toISOString(),
    });

    const first = await processCourierWebhook({
      rawBody: rawPayload,
      providerId: "mock",
    });
    expect(first.status).toBe("processed");

    const second = await processCourierWebhook({
      rawBody: rawPayload,
      providerId: "mock",
    });
    expect(second.status).toBe("duplicate");
    expect(second.message).toContain("idempotent");
  });

  it("3. Handles returned (RTO) shipment event and unsets delivery confirmation", async () => {
    const rawPayload = JSON.stringify({
      trackingId: "BD889210492IN",
      orderId: "order_upi_1064_001",
      status: "RETURNED",
      timestamp: new Date().toISOString(),
    });

    const result = await processCourierWebhook({
      rawBody: rawPayload,
      providerId: "mock",
    });

    expect(result.status).toBe("processed");
    const dispute = fallbackDisputes.find((d) => d.id === "disp_1064_goods_not_received");
    const proof = dispute?.evidenceItems.find((e) => e.type === "shipping_proof");
    expect(proof?.present).toBe(false);
    expect(proof?.note).toContain("returned to origin");
  });

  it("4. Supports on-demand syncTrackingForDispute", async () => {
    const syncRes = await syncTrackingForDispute(
      "disp_1064_goods_not_received",
      "BD889210492IN",
      "mock"
    );

    expect(syncRes.success).toBe(true);
    expect(syncRes.disputeId).toBe("disp_1064_goods_not_received");
  });
});
