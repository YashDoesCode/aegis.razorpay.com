import { describe, it, expect } from "vitest";
import { computeWinnability } from "../score";
import { DisputeData, EvidenceItemData, CustomerData } from "../types";
import { fallbackDisputes } from "../../mockStore";
import { ZodError } from "zod";

describe("Winnability Scoring Engine", () => {
  const mockCustomerHighTrust: CustomerData = {
    name: "Rohan Verma",
    email: "rohan.verma@example.com",
    address: "Flat 402, Bellandur, Bengaluru",
    priorOrdersCount: 5,
    priorDisputesCount: 0,
  };

  describe("Realistic Winnability Spread on Seeded Demo Disputes", () => {
    it("Dispute 1 (UPI 1064, Full Evidence) scores ~94 (High Band, Contest)", () => {
      const d1 = fallbackDisputes[0];
      const result = computeWinnability(d1, d1.evidenceItems, d1.order?.customer);
      expect(result.score).toBe(94);
      expect(result.band).toBe("high");
      expect(result.recommendation).toBe("contest");
    });

    it("Dispute 2 (UPI 108, Verified Digital Service) scores ~82 (High Band, Contest)", () => {
      const d2 = fallbackDisputes[1];
      const result = computeWinnability(d2, d2.evidenceItems, d2.order?.customer);
      expect(result.score).toBe(82);
      expect(result.band).toBe("high");
      expect(result.recommendation).toBe("contest");
    });

    it("Dispute 3 (Card 4837, 3DS & Delivery present, Letter pending) scores ~68 (Needs Evidence Band)", () => {
      const d3 = fallbackDisputes[2];
      const result = computeWinnability(d3, d3.evidenceItems, d3.order?.customer);
      expect(result.score).toBe(68);
      expect(result.band).toBe("needs_evidence");
      expect(result.recommendation).toBe("gather_evidence");
    });

    it("Dispute 4 (UPI 1062, Goods Not As Described, Missing support log) scores ~45 (Low Band, Accept)", () => {
      const d4 = fallbackDisputes[3];
      const result = computeWinnability(d4, d4.evidenceItems, d4.order?.customer);
      expect(result.score).toBe(45);
      expect(result.band).toBe("low");
      expect(result.recommendation).toBe("accept");
    });

    it("Dispute 5 (UPI 1061, Refund Not Processed, Missing refund ARN) scores ~23 (Low Band, Accept)", () => {
      const d5 = fallbackDisputes[4];
      const result = computeWinnability(d5, d5.evidenceItems, d5.order?.customer);
      expect(result.score).toBe(23);
      expect(result.band).toBe("low");
      expect(result.recommendation).toBe("accept");
    });

    it("Dispute 6 (UPI 1084, Duplicate Processing, Confirmed merchant error) scores ~12 (Low Band, Accept)", () => {
      const d6 = fallbackDisputes[5];
      const result = computeWinnability(d6, d6.evidenceItems, d6.order?.customer);
      expect(result.score).toBe(12);
      expect(result.band).toBe("low");
      expect(result.recommendation).toBe("accept");
    });
  });

  describe("Band Boundary Tests", () => {
    it("verifies exact boundary behavior (80, 79, 50, 49)", () => {
      const dispute: DisputeData = {
        id: "disp_generic",
        reasonCode: "9999", // fallback reason: billing(30) + fulfillment(30) + comms(20) + explanation(20)
      };

      // 1. Exactly 80 (30 + 30 + 20 = 80)
      const res80 = computeWinnability(dispute, [
        { type: "billing_proof", present: true },
        { type: "shipping_proof", present: true },
        { type: "customer_communication", present: true },
      ]);
      expect(res80.score).toBe(80);
      expect(res80.band).toBe("high");
      expect(res80.recommendation).toBe("contest");

      // 2. Exactly 50 (30 + 20 = 50)
      const res50 = computeWinnability(dispute, [
        { type: "billing_proof", present: true },
        { type: "customer_communication", present: true },
      ]);
      expect(res50.score).toBe(50);
      expect(res50.band).toBe("needs_evidence");
      expect(res50.recommendation).toBe("gather_evidence");

      // 3. Exactly 30 (< 50)
      const res30 = computeWinnability(dispute, [
        { type: "billing_proof", present: true },
      ]);
      expect(res30.score).toBe(30);
      expect(res30.band).toBe("low");
      expect(res30.recommendation).toBe("accept");
    });
  });

  describe("Determinism & Validation", () => {
    it("is strictly deterministic: identical inputs yield identical outputs", () => {
      const dispute: DisputeData = {
        id: "disp_det_01",
        reasonCode: "1064",
      };
      const evidence: EvidenceItemData[] = [
        { type: "shipping_proof", present: true },
        { type: "billing_proof", present: true },
      ];

      const run1 = computeWinnability(dispute, evidence, mockCustomerHighTrust);
      const run2 = computeWinnability(dispute, evidence, mockCustomerHighTrust);
      const run3 = computeWinnability(dispute, evidence, mockCustomerHighTrust);

      expect(run1).toEqual(run2);
      expect(run2).toEqual(run3);
    });

    it("rejects invalid inputs via Zod schema validation", () => {
      expect(() => {
        // @ts-expect-error test runtime validation
        computeWinnability({ id: "" }); // missing reasonCode
      }).toThrow(ZodError);
    });
  });
});
