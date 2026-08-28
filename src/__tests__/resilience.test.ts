import { describe, it, expect, vi } from "vitest";
import { draftRebuttal, generateFallbackRebuttal } from "../lib/drafting/draftRebuttal";
import { DraftRebuttalInput } from "../lib/drafting/types";

const mockDisputeInput: DraftRebuttalInput = {
  dispute: {
    id: "disp_test_resilience_001",
    reasonCode: "1064",
    network: "upi",
    amount: 2499900,
    order: {
      item: "Sony WH-1000XM5 Noise-Cancelling Headphones",
      delivery: {
        courier: "BlueDart",
        trackingId: "BD-982144321IN",
        deliveredAt: new Date("2026-08-23T10:00:00Z"),
        deliveredToAddress: "Flat 402, Green Glen Layout, Bengaluru",
        signatureCaptured: true,
      },
    },
  },
  evidenceItems: [
    {
      type: "shipping_proof",
      present: true,
      documentRef: "docs/pod_9821.pdf",
      note: "BlueDart POD signed by Rohan Verma",
    },
    {
      type: "billing_proof",
      present: true,
      documentRef: "docs/invoice_8821.pdf",
      note: "Tax invoice for ₹24,999",
    },
    {
      type: "refund_confirmation",
      present: false,
      note: "No refund issued",
    },
  ],
  winnability: {
    score: 100,
    band: "high",
    recommendation: "contest",
    reasons: [
      { label: "Proof of delivery (POD) verified", delta: 35, met: true },
      { label: "Courier tracking matches", delta: 25, met: true },
    ],
  },
  customer: {
    name: "Rohan Verma",
    email: "rohan.verma@example.com",
    address: "Bengaluru",
    priorOrdersCount: 5,
    priorDisputesCount: 0,
  },
};

describe("Aegis Resilience & Failure Simulation Suite", () => {
  describe("1. LLM Failure & Timeout Resilience", () => {
    it("returns deterministic template with source: 'fallback' when LLM throws an error", async () => {
      // Force LLM mock to throw a fatal network/rate-limit error
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await draftRebuttal(mockDisputeInput, {
        apiKey: "invalid_key_triggering_catch",
        forceFallback: true,
      });

      expect(result).toBeDefined();
      expect(result.source).toBe("fallback");
      expect(result.summary.length).toBeLessThanOrEqual(1000);
      expect(result.summary).toContain("Sony WH-1000XM5");
      expect(result.summary).toContain("BD-982144321IN");
      expect(result.citedEvidence).toEqual(["shipping_proof", "billing_proof"]);
      expect(result.citedEvidence).not.toContain("refund_confirmation");
      expect(result.explanationLetter).toContain("Dear Dispute Operations");
      expect(result.explanationLetter).toContain("SHIPPING PROOF");
      expect(result.explanationLetter).toContain("BILLING PROOF");

      consoleWarnSpy.mockRestore();
    });

    it("generateFallbackRebuttal directly outputs compliant representment letter", () => {
      const fallback = generateFallbackRebuttal(mockDisputeInput);
      expect(fallback.source).toBe("fallback");
      expect(fallback.summary).toContain("UPI Reason Code 1064");
      expect(fallback.explanationLetter).toContain("Rohan Verma");
      expect(fallback.citedEvidence).toContain("shipping_proof");
    });
  });
});
