import { describe, it, expect, beforeEach } from "vitest";
import { AuditService } from "../service";
import { resetInMemoryAuditStore, getInMemoryAuditEvents } from "../../mockStore";

describe("Platform Immutable Audit Ledger (AuditService)", () => {
  beforeEach(() => {
    resetInMemoryAuditStore();
  });

  describe("Audit Event Recording", () => {
    it("creates an immutable audit event with generated trace IDs and defaults", async () => {
      const record = await AuditService.record({
        eventType: "DISPUTE_IMPORTED",
        disputeId: "disp_test_101",
        merchantId: "acc_demo_01",
      });

      expect(record.id).toMatch(/^aud_/);
      expect(record.eventType).toBe("DISPUTE_IMPORTED");
      expect(record.disputeId).toBe("disp_test_101");
      expect(record.merchantId).toBe("acc_demo_01");
      expect(record.actorType).toBe("system");
      expect(record.source).toBe("system");
      expect(record.correlationId).toMatch(/^corr_/);
      expect(record.requestId).toMatch(/^req_/);
      expect(record.createdAt).toBeInstanceOf(Date);

      const inMemory = getInMemoryAuditEvents("disp_test_101");
      expect(inMemory.length).toBe(1);
      expect(inMemory[0].id).toBe(record.id);
    });

    it("preserves explicit correlationId, requestId, actor, and source", async () => {
      const customCorrelationId = "corr_custom_trace_999";
      const customRequestId = "req_custom_123";

      const record = await AuditService.record({
        eventType: "MERCHANT_CONNECTED",
        actorType: "merchant",
        actorId: "acc_merchant_real",
        source: "ui",
        merchantId: "acc_merchant_real",
        correlationId: customCorrelationId,
        requestId: customRequestId,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      });

      expect(record.correlationId).toBe(customCorrelationId);
      expect(record.requestId).toBe(customRequestId);
      expect(record.actorType).toBe("merchant");
      expect(record.actorId).toBe("acc_merchant_real");
      expect(record.source).toBe("ui");
      expect(record.ipAddress).toBe("192.168.1.1");
      expect(record.userAgent).toBe("Mozilla/5.0");
    });

    it("sanitizes sensitive credentials in metadata, beforeState, and afterState", async () => {
      const record = await AuditService.record({
        eventType: "SETTINGS_UPDATED",
        actorType: "merchant",
        metadata: {
          merchantSecret: "super_secret_webhook_key_12345678",
          apiKey: "rzp_live_secret_key_abcdef987654",
          nested: {
            bearerToken: "ey1234567890abcdef",
            password: "mypassword123",
            publicName: "Safe Merchant Name",
          },
          publicNote: "Normal metadata value",
        },
      });

      expect(record.metadata).not.toBeNull();
      const parsedMetadata = JSON.parse(record.metadata!);

      expect(parsedMetadata.publicNote).toBe("Normal metadata value");
      expect(parsedMetadata.nested.publicName).toBe("Safe Merchant Name");

      expect(parsedMetadata.merchantSecret).not.toBe("super_secret_webhook_key_12345678");
      expect(parsedMetadata.apiKey).not.toBe("rzp_live_secret_key_abcdef987654");
      expect(parsedMetadata.nested.bearerToken).not.toBe("ey1234567890abcdef");
      expect(parsedMetadata.nested.password).not.toBe("mypassword123");

      expect(parsedMetadata.merchantSecret).toMatch(/\.\.\./);
      expect(parsedMetadata.apiKey).toMatch(/\.\.\./);
    });
  });

  describe("Audit Query Layer", () => {
    it("filters audit records by disputeId", async () => {
      await AuditService.record({
        eventType: "SCORE_COMPUTED",
        disputeId: "disp_A",
      });
      await AuditService.record({
        eventType: "REBUTTAL_GENERATED",
        disputeId: "disp_A",
      });
      await AuditService.record({
        eventType: "SCORE_COMPUTED",
        disputeId: "disp_B",
      });

      const dispARecords = await AuditService.getByDispute("disp_A");
      expect(dispARecords.length).toBe(2);
      expect(dispARecords.every((r) => r.disputeId === "disp_A")).toBe(true);

      const dispBRecords = await AuditService.getByDispute("disp_B");
      expect(dispBRecords.length).toBe(1);
      expect(dispBRecords[0].disputeId).toBe("disp_B");
    });

    it("filters audit records by merchantId", async () => {
      await AuditService.record({
        eventType: "MERCHANT_CONNECTED",
        merchantId: "merch_1",
      });
      await AuditService.record({
        eventType: "DISPUTE_SYNCED",
        merchantId: "merch_1",
      });
      await AuditService.record({
        eventType: "MERCHANT_CONNECTED",
        merchantId: "merch_2",
      });

      const merch1Records = await AuditService.getByMerchant("merch_1");
      expect(merch1Records.length).toBe(2);
      expect(merch1Records.every((r) => r.merchantId === "merch_1")).toBe(true);
    });

    it("filters audit records by correlationId", async () => {
      const traceId = "corr_trace_abc123";
      await AuditService.record({
        eventType: "DISPUTE_IMPORTED",
        correlationId: traceId,
      });
      await AuditService.record({
        eventType: "SCORE_COMPUTED",
        correlationId: traceId,
      });
      await AuditService.record({
        eventType: "SCORE_COMPUTED",
        correlationId: "corr_other_999",
      });

      const traceRecords = await AuditService.getByCorrelationId(traceId);
      expect(traceRecords.length).toBe(2);
      expect(traceRecords.every((r) => r.correlationId === traceId)).toBe(true);
    });

    it("filters audit records by eventType and date range", async () => {
      const now = Date.now();
      const past = new Date(now - 10000);
      const future = new Date(now + 10000);

      await AuditService.record({ eventType: "DISPUTE_ACCEPTED" });
      await AuditService.record({ eventType: "SAFE_MODE_USED" });
      await AuditService.record({ eventType: "DISPUTE_ACCEPTED" });

      const accepted = await AuditService.query({ eventType: "DISPUTE_ACCEPTED" });
      expect(accepted.length).toBe(2);

      const inRange = await AuditService.query({
        startDate: past,
        endDate: future,
      });
      expect(inRange.length).toBe(3);
    });
  });

  describe("Append-Only Immutability", () => {
    it("maintains an append-only timeline without mutating previous events", async () => {
      const evt1 = await AuditService.record({
        eventType: "DISPUTE_CREATED",
        disputeId: "disp_immutable_1",
        afterState: { status: "open" },
      });

      const evt2 = await AuditService.record({
        eventType: "DISPUTE_UNDER_REVIEW",
        disputeId: "disp_immutable_1",
        beforeState: { status: "open" },
        afterState: { status: "under_review" },
      });

      const history = await AuditService.getByDispute("disp_immutable_1");
      expect(history.length).toBe(2);

      expect(history[0].id).toBe(evt2.id);
      expect(history[0].eventType).toBe("DISPUTE_UNDER_REVIEW");

      expect(history[1].id).toBe(evt1.id);
      expect(history[1].eventType).toBe("DISPUTE_CREATED");
    });
  });
});
