import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { processCourierWebhook } from "../service";
import { fallbackDisputes } from "../../mockStore";
import { DelhiveryAdapter } from "../adapters/delhivery";
import crypto from "crypto";

describe("3PL Courier Production Hardening & Invariant Verification", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("1. Security — Fail Closed in Production", () => {
    it("fails closed when webhook secret is missing in production", async () => {
      Object.assign(process.env, {
        NODE_ENV: "production",
      });
      delete process.env.DELHIVERY_WEBHOOK_SECRET;
      delete process.env.COURIER_WEBHOOK_SECRET;

      const rawPayload = JSON.stringify({
        trackingId: "PROD_TEST_AWB_001",
        status: "DELIVERED",
      });

      const result = await processCourierWebhook({
        rawBody: rawPayload,
        providerId: "delhivery",
      });

      expect(result.status).toBe("error");
      expect(result.message).toContain("Unauthorized");
    });

    it("rejects invalid signature in production", async () => {
      Object.assign(process.env, {
        NODE_ENV: "production",
        DELHIVERY_WEBHOOK_SECRET: "my_super_secret_production_webhook_token_999",
      });

      const rawPayload = JSON.stringify({
        trackingId: "PROD_TEST_AWB_001",
        status: "DELIVERED",
      });

      const result = await processCourierWebhook({
        rawBody: rawPayload,
        signature: "forged_invalid_signature_hex",
        providerId: "delhivery",
      });

      expect(result.status).toBe("error");
      expect(result.message).toContain("Unauthorized");
    });

    it("accepts valid constant-time HMAC signature in production", async () => {
      const secret = "my_super_secret_production_webhook_token_999";
      Object.assign(process.env, {
        NODE_ENV: "production",
        DELHIVERY_WEBHOOK_SECRET: secret,
      });

      const rawPayload = JSON.stringify({
        trackingId: "BD889210492IN",
        orderId: "order_upi_1064_001",
        status: "DELIVERED",
        signatureCaptured: true,
      });

      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(rawPayload, "utf8")
        .digest("hex");

      const result = await processCourierWebhook({
        rawBody: rawPayload,
        signature: validSignature,
        providerId: "delhivery",
      });

      expect(result.status).toBe("processed");
      expect(result.evidenceAttached).toBe(true);
    });
  });

  describe("2. Evidence Integrity — No Manufactured Fake PODs", () => {
    it("distinguishes delivery confirmation from POD document availability", async () => {
      const rawPayload = JSON.stringify({
        trackingId: "BD889210492IN",
        orderId: "order_upi_1064_001",
        status: "DELIVERED",
        signatureCaptured: true,
        testRunId: "no_pod_test_run_01",
        timestamp: new Date().toISOString(),
        // No POD URL provided
      });

      const result = await processCourierWebhook({
        rawBody: rawPayload,
        providerId: "mock",
      });

      expect(result.status).toBe("processed");
      expect(result.podAvailable).toBe(false);

      const dispute = fallbackDisputes.find((d) => d.id === "disp_1064_goods_not_received");
      const proof = dispute?.evidenceItems.find((e) => e.type === "shipping_proof");
      expect(proof?.present).toBe(true);
      expect(proof?.documentRef).toBeUndefined(); // Zero fake POD fabricated
      expect(proof?.note).toContain("No POD document attached");
    });

    it("attaches genuine POD document reference when supplied by carrier", async () => {
      const realPodUrl = "https://s3.ap-south-1.amazonaws.com/delhivery-pod/2026/03/AWB99881122.pdf";
      const rawPayload = JSON.stringify({
        trackingId: "BD889210492IN",
        orderId: "order_upi_1064_001",
        status: "DELIVERED",
        signatureCaptured: true,
        podDocumentRef: realPodUrl,
      });

      const result = await processCourierWebhook({
        rawBody: rawPayload,
        providerId: "mock",
      });

      expect(result.status).toBe("processed");
      expect(result.podAvailable).toBe(true);

      const dispute = fallbackDisputes.find((d) => d.id === "disp_1064_goods_not_received");
      const proof = dispute?.evidenceItems.find((e) => e.type === "shipping_proof");
      expect(proof?.documentRef).toBe(realPodUrl);
      expect(proof?.note).toContain("POD document verified");
    });
  });

  describe("3. Event Ordering & Anti-Regression", () => {
    it("does not regress a DELIVERED shipment when older IN_TRANSIT event arrives out of order", async () => {
      const deliveryTimestamp = new Date(Date.now() - 3600 * 1000); // 1 hour ago
      const olderScanTimestamp = new Date(Date.now() - 7200 * 1000); // 2 hours ago

      // Step 1: Confirmed delivery arrives
      await processCourierWebhook({
        rawBody: JSON.stringify({
          trackingId: "BD889210492IN",
          orderId: "order_upi_1064_001",
          status: "DELIVERED",
          timestamp: deliveryTimestamp.toISOString(),
          signatureCaptured: true,
        }),
        providerId: "mock",
      });

      const dispute = fallbackDisputes.find((d) => d.id === "disp_1064_goods_not_received");
      expect(dispute?.order?.delivery?.deliveredAt).toBeDefined();

      // Step 2: Delayed / out-of-order in-transit event arrives with older timestamp
      const delayedResult = await processCourierWebhook({
        rawBody: JSON.stringify({
          trackingId: "BD889210492IN",
          orderId: "order_upi_1064_001",
          status: "IN_TRANSIT",
          timestamp: olderScanTimestamp.toISOString(),
        }),
        providerId: "mock",
      });

      expect(delayedResult.status).toBe("processed");

      // Verify delivery state was NOT corrupted/regressed
      expect(dispute?.order?.delivery?.deliveredAt).toBeDefined();
      const proof = dispute?.evidenceItems.find((e) => e.type === "shipping_proof");
      expect(proof?.present).toBe(true);
    });
  });

  describe("4. Automated Downstream Scoring Recomputation", () => {
    it("automatically calculates updated winnability score and emits telemetry", async () => {
      const rawPayload = JSON.stringify({
        trackingId: "BD889210492IN",
        orderId: "order_upi_1064_001",
        status: "DELIVERED",
        signatureCaptured: true,
        timestamp: new Date().toISOString(),
      });

      const result = await processCourierWebhook({
        rawBody: rawPayload,
        providerId: "mock",
      });

      expect(result.scoreRecomputed).toBe(true);
      expect(result.newScore).toBeGreaterThanOrEqual(80);
    });
  });

  describe("5. Delhivery Real API Client Hardening", () => {
    const adapter = new DelhiveryAdapter();

    it("fails closed in production if DELHIVERY_API_TOKEN is not configured", async () => {
      Object.assign(process.env, {
        NODE_ENV: "production",
      });
      delete process.env.DELHIVERY_API_TOKEN;
      delete process.env.DELHIVERY_API_KEY;

      await expect(adapter.fetchTracking("1234567890")).rejects.toThrow(
        "[Delhivery Integration] Missing DELHIVERY_API_TOKEN in production environment."
      );
    });
  });
});
