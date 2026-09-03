import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { DelhiveryAdapter, mapDelhiveryStatus } from "../adapters/delhivery";
import { MockCourierAdapter } from "../adapters/mock";
import { getCourierAdapter, getRegisteredProviders } from "../registry";

describe("3PL Courier Adapter Layer", () => {
  describe("Delhivery Adapter", () => {
    const adapter = new DelhiveryAdapter();
    const secret = "test_delhivery_webhook_secret_key_123";

    it("1. Maps Delhivery status codes accurately to canonical Aegis statuses", () => {
      expect(mapDelhiveryStatus("DL")).toBe("DELIVERED");
      expect(mapDelhiveryStatus("Delivered successfully")).toBe("DELIVERED");
      expect(mapDelhiveryStatus("OFD")).toBe("OUT_FOR_DELIVERY");
      expect(mapDelhiveryStatus("Out for delivery")).toBe("OUT_FOR_DELIVERY");
      expect(mapDelhiveryStatus("PU")).toBe("PICKED_UP");
      expect(mapDelhiveryStatus("IT")).toBe("IN_TRANSIT");
      expect(mapDelhiveryStatus("In Transit")).toBe("IN_TRANSIT");
      expect(mapDelhiveryStatus("UD")).toBe("FAILED_DELIVERY");
      expect(mapDelhiveryStatus("Undelivered")).toBe("FAILED_DELIVERY");
      expect(mapDelhiveryStatus("RT")).toBe("RETURNED");
      expect(mapDelhiveryStatus("Return to origin")).toBe("RETURNED");
      expect(mapDelhiveryStatus("Cancelled")).toBe("CANCELLED");
      expect(mapDelhiveryStatus("Lost in transit")).toBe("LOST");
      expect(mapDelhiveryStatus("SOMETHING_ELSE")).toBe("EXCEPTION");
    });

    it("2. Verifies valid HMAC-SHA256 signature in constant time", () => {
      const payload = JSON.stringify({
        Waybill: "DLV9928172635",
        Status: { Status: "Delivered", StatusDateTime: "2026-03-01T10:00:00Z" },
        Signature: true,
      });

      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(payload, "utf8")
        .digest("hex");

      expect(adapter.verifyWebhookSignature(payload, validSignature, secret)).toBe(true);
      expect(adapter.verifyWebhookSignature(payload, "invalid_signature", secret)).toBe(false);
      expect(adapter.verifyWebhookSignature(payload, null, secret)).toBe(false);
      expect(adapter.verifyWebhookSignature("", validSignature, secret)).toBe(false);
    });

    it("3. Parses standard Delhivery webhook payload into canonical event", async () => {
      const payload = JSON.stringify({
        Waybill: "1234567890",
        Status: {
          Status: "Delivered",
          StatusDateTime: "2026-03-01T14:30:00.000Z",
          StatusLocation: "Indiranagar Hub, Bengaluru",
        },
        ReferenceNo: "order_upi_1064_001",
        Signature: true,
        POD: "https://pod.delhivery.com/pods/1234567890.pdf",
      });

      const event = await adapter.parseWebhookEvent(payload);
      expect(event.provider).toBe("delhivery");
      expect(event.trackingId).toBe("1234567890");
      expect(event.status).toBe("DELIVERED");
      expect(event.orderId).toBe("order_upi_1064_001");
      expect(event.signatureCaptured).toBe(true);
      expect(event.podDocumentRef).toBe("https://pod.delhivery.com/pods/1234567890.pdf");
      expect(event.location).toBe("Indiranagar Hub, Bengaluru");
    });

    it("4. Rejects malformed or missing payload", async () => {
      await expect(adapter.parseWebhookEvent("")).rejects.toThrow("Cannot parse empty Delhivery webhook payload");
      await expect(adapter.parseWebhookEvent("{ invalid json")).rejects.toThrow("Malformed Delhivery webhook JSON payload");
      await expect(adapter.parseWebhookEvent("{}")).rejects.toThrow("missing Waybill");
    });
  });

  describe("Mock Courier Adapter & Registry", () => {
    const mockAdapter = new MockCourierAdapter();

    it("5. Mock adapter parses structured events deterministically", async () => {
      const raw = JSON.stringify({
        trackingId: "MOCK_TRACK_88",
        status: "DELIVERED",
        signatureCaptured: true,
        orderId: "order_99",
      });

      const parsed = await mockAdapter.parseWebhookEvent(raw);
      expect(parsed.provider).toBe("mock");
      expect(parsed.trackingId).toBe("MOCK_TRACK_88");
      expect(parsed.status).toBe("DELIVERED");
      expect(parsed.signatureCaptured).toBe(true);
    });

    it("6. Registry resolves adapters correctly", () => {
      const delhivery = getCourierAdapter("delhivery");
      expect(delhivery.providerId).toBe("delhivery");

      const mock = getCourierAdapter("mock");
      expect(mock.providerId).toBe("mock");

      expect(getRegisteredProviders()).toContain("delhivery");
      expect(getRegisteredProviders()).toContain("mock");
    });
  });
});
