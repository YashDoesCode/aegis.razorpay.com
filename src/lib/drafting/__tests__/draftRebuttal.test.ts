import { describe, it, expect } from "vitest";
import { draftRebuttal, validateEvidenceGuardrail } from "../draftRebuttal";
import { buildUserPrompt, buildSystemPrompt } from "../prompt";
import { DraftRebuttalInput, RebuttalOutput } from "../types";

describe("Rebuttal Drafting Service", () => {
  const sampleDisputeInput: DraftRebuttalInput = {
    dispute: {
      id: "disp_1064_goods_not_received",
      reasonCode: "1064",
      network: "upi",
      amount: 2499900,
      order: {
        item: "Sony WH-1000XM5 Noise-Cancelling Headphones",
        delivery: {
          courier: "BlueDart",
          trackingId: "BD-982144321IN",
          deliveredAt: new Date("2026-08-23T10:00:00Z"),
          deliveredToAddress: "Flat 402, Green Glen Layout, Bellandur, Bengaluru, KA 560103",
          signatureCaptured: true,
        },
        communications: [
          {
            direction: "inbound",
            channel: "email",
            body: "Hi, received the package yesterday. Where can I find the warranty card?",
            sentAt: new Date("2026-08-24T08:00:00Z"),
          },
        ],
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
        type: "customer_communication",
        present: true,
        documentRef: "docs/email_ack.pdf",
        note: "Customer email confirming receipt",
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
        { label: "Proof of delivery (POD) uploaded and verified", delta: 35, met: true },
        { label: "Courier tracking matches customer address", delta: 25, met: true },
        { label: "Customer communication acknowledging receipt on file", delta: 20, met: true },
        { label: "Terms & Conditions on file", delta: 10, met: true },
        { label: "Customer trust score", delta: 10, met: true },
      ],
    },
    customer: {
      name: "Rohan Verma",
      email: "rohan.verma@example.com",
      address: "Flat 402, Green Glen Layout, Bellandur, Bengaluru, KA 560103",
      priorOrdersCount: 5,
      priorDisputesCount: 0,
    },
  };

  describe("Prompt Construction", () => {
    it("generates a tightly grounded prompt containing only present evidence in the verified list", () => {
      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildUserPrompt(sampleDisputeInput);

      expect(systemPrompt).toContain("PROSE ONLY");
      expect(systemPrompt).toContain("NO INVENTED EVIDENCE");

      expect(userPrompt).toContain("**Dispute Reason Code:** 1064 — Goods / Services Not Received");
      expect(userPrompt).toContain("**Network / Channel:** UPI");
      expect(userPrompt).toContain("Sony WH-1000XM5");
      expect(userPrompt).toContain("BD-982144321IN");
      expect(userPrompt).toContain("Rohan Verma");
      expect(userPrompt).toContain("₹24,999");
      expect(userPrompt).toContain("**Calculated Winnability Score:** 100/100");

      // Present evidence items appear under VERIFIED PRESENT EVIDENCE
      expect(userPrompt).toContain("shipping_proof");
      expect(userPrompt).toContain("billing_proof");
      expect(userPrompt).toContain("customer_communication");

      // Absent evidence appears under MISSING EVIDENCE section
      expect(userPrompt).toContain("[MISSING] refund_confirmation");
    });
  });

  describe("Structured Rebuttal Generation & Guardrails", () => {
    it("successfully drafts a typed rebuttal when LLM cites only verified present evidence", async () => {
      const mockLLMResponse: RebuttalOutput = {
        summary:
          "The customer disputes payment claiming non-receipt (UPI 1064) for Sony WH-1000XM5 Headphones (₹24,999). However, BlueDart tracking BD-982144321IN confirms delivery with recipient signature to the billing address on 23 Aug 2026. Furthermore, customer acknowledged receipt in email support ticket. We request the acquiring bank to reject this dispute.",
        explanationLetter:
          "To the Dispute Resolution Committee,\n\nWe are submitting this formal representment to contest Dispute disp_1064_goods_not_received for transaction amount ₹24,999.00. The merchandise (Sony WH-1000XM5 Noise-Cancelling Headphones) was successfully delivered via BlueDart AWB BD-982144321IN on 23 August 2026, with GPS coordinates and recipient signature on file. Attached please find our GST Tax Invoice, Courier Proof of Delivery, and customer post-delivery email correspondence.",
        citedEvidence: ["shipping_proof", "billing_proof", "customer_communication"],
      };

      const result = await draftRebuttal(sampleDisputeInput, {
        mockClient: async () => mockLLMResponse,
      });

      expect(result.summary.length).toBeLessThanOrEqual(1000);
      expect(result.summary).toContain("BlueDart");
      expect(result.citedEvidence).toEqual([
        "shipping_proof",
        "billing_proof",
        "customer_communication",
      ]);
      expect(result.explanationLetter).toContain("Dispute Resolution Committee");
    });

    it("triggers guardrail and rejects/catches when LLM tries to cite absent evidence", async () => {
      const invalidMockLLMResponse: RebuttalOutput = {
        summary: "Formal representment for dispute case under contestation.",
        explanationLetter:
          "To the Dispute Resolution Department: We hereby submit our formal representment contesting this chargeback based on attached documentation including invalidly cited refund proof.",
        // 'refund_confirmation' is present: false in sampleDisputeInput
        citedEvidence: ["shipping_proof", "refund_confirmation"],
      };

      await expect(
        draftRebuttal(sampleDisputeInput, {
          mockClient: async () => invalidMockLLMResponse,
        })
      ).rejects.toThrow(/Guardrail Violation: LLM cited absent evidence items \[refund_confirmation\]/);
    });

    it("validateEvidenceGuardrail correctly identifies missing evidence citations", () => {
      const presentSet = new Set(["shipping_proof", "billing_proof"]);

      const validCheck = validateEvidenceGuardrail(["shipping_proof"], presentSet);
      expect(validCheck.valid).toBe(true);
      expect(validCheck.invalidCitations).toHaveLength(0);

      const invalidCheck = validateEvidenceGuardrail(
        ["shipping_proof", "refund_confirmation", "access_activity_log"],
        presentSet
      );
      expect(invalidCheck.valid).toBe(false);
      expect(invalidCheck.invalidCitations).toEqual([
        "refund_confirmation",
        "access_activity_log",
      ]);
    });
  });
});
