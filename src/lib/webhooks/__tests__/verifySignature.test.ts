import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  verifyWebhookSignature,
  computePayloadHash,
} from "../verifySignature";
import {
  RazorpayWebhookPayloadSchema,
  isSupportedDisputeEvent,
} from "../schemas";

describe("Razorpay Webhook Signature Verification", () => {
  const secret = "whsec_test_secret_12345";
  const samplePayload = JSON.stringify({
    entity: "event",
    account_id: "acc_demo_test_01",
    event: "dispute.created",
    contains: ["dispute"],
    payload: {
      dispute: {
        entity: {
          id: "disp_test_webhook_001",
          payment_id: "pay_test_001",
          amount: 2499900,
          currency: "INR",
          reason_code: "1064",
          status: "open",
          phase: "chargeback",
          created_at: 1700000000,
          respond_by: 1700259200,
        },
      },
    },
    created_at: 1700000000,
  });

  it("successfully verifies valid HMAC-SHA256 signature", () => {
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(samplePayload, "utf8")
      .digest("hex");

    const result = verifyWebhookSignature(samplePayload, validSignature, secret);
    expect(result).toBe(true);
  });

  it("rejects invalid signature string", () => {
    const invalidSignature = "deadbeefcafebabe0123456789abcdef";
    const result = verifyWebhookSignature(samplePayload, invalidSignature, secret);
    expect(result).toBe(false);
  });

  it("rejects signature computed with a different secret", () => {
    const wrongSignature = crypto
      .createHmac("sha256", "different_secret")
      .update(samplePayload, "utf8")
      .digest("hex");

    const result = verifyWebhookSignature(samplePayload, wrongSignature, secret);
    expect(result).toBe(false);
  });

  it("rejects empty or null signature", () => {
    expect(verifyWebhookSignature(samplePayload, null, secret)).toBe(false);
    expect(verifyWebhookSignature(samplePayload, undefined, secret)).toBe(false);
    expect(verifyWebhookSignature(samplePayload, "", secret)).toBe(false);
  });

  it("rejects empty or null payload", () => {
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(samplePayload, "utf8")
      .digest("hex");

    expect(verifyWebhookSignature("", validSignature, secret)).toBe(false);
  });

  it("computes deterministic payload hash", () => {
    const hash1 = computePayloadHash(samplePayload);
    const hash2 = computePayloadHash(samplePayload);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });
});

describe("Razorpay Webhook Payload Validation", () => {
  it("validates compliant dispute payload", () => {
    const payload = {
      entity: "event",
      account_id: "acc_demo_test_01",
      event: "dispute.created",
      contains: ["dispute"],
      payload: {
        dispute: {
          entity: {
            id: "disp_test_webhook_001",
            payment_id: "pay_test_001",
            amount: 2499900,
            currency: "INR",
            reason_code: "1064",
            status: "open",
            phase: "chargeback",
            created_at: 1700000000,
            respond_by: 1700259200,
          },
        },
      },
      created_at: 1700000000,
    };

    const parsed = RazorpayWebhookPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("fails on malformed dispute payload missing payment_id or amount", () => {
    const malformed = {
      event: "dispute.created",
      payload: {
        dispute: {
          entity: {
            id: "disp_001",
          },
        },
      },
    };

    const parsed = RazorpayWebhookPayloadSchema.safeParse(malformed);
    expect(parsed.success).toBe(false);
  });

  it("identifies supported dispute events", () => {
    expect(isSupportedDisputeEvent("dispute.created")).toBe(true);
    expect(isSupportedDisputeEvent("dispute.under_review")).toBe(true);
    expect(isSupportedDisputeEvent("dispute.won")).toBe(true);
    expect(isSupportedDisputeEvent("dispute.lost")).toBe(true);
    expect(isSupportedDisputeEvent("payment.captured")).toBe(false);
    expect(isSupportedDisputeEvent("refund.processed")).toBe(false);
  });
});
