import { describe, it, expect } from "vitest";

describe("E2E Aegis Defense Pipeline & Dashboard Verification", () => {
  const BASE_URL = "http://localhost:3000";

  it("1. Health Endpoint responds OK", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.service).toBe("razorpay-aegis");
  });

  it("2. GET /api/disputes returns seeded records with deterministic winnability & KPI stats", async () => {
    const res = await fetch(`${BASE_URL}/api/disputes`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.count).toBeGreaterThanOrEqual(6);
    expect(json.stats.totalCount).toBeGreaterThanOrEqual(6);
    expect(json.stats.high.count).toBeGreaterThanOrEqual(4);
    expect(json.stats.low.count).toBeGreaterThanOrEqual(2);

    const dispute1064 = json.data.find(
      (d: { id: string }) => d.id === "disp_1064_goods_not_received"
    );
    expect(dispute1064).toBeDefined();
    expect(dispute1064.winnability.score).toBe(100);
    expect(dispute1064.winnability.band).toBe("high");
    expect(dispute1064.winnability.recommendation).toBe("contest");
  });

  it("3. GET /api/disputes/[id] returns detail file, scoring rules, and evidence checklist", async () => {
    const res = await fetch(
      `${BASE_URL}/api/disputes/disp_1064_goods_not_received`
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.id).toBe("disp_1064_goods_not_received");
    expect(json.data.reasonDefinition.label).toBe("Goods / Services Not Received");
    expect(json.data.evidenceItems.length).toBe(4);
    expect(json.data.winnability.reasons.length).toBe(5);
  });

  it("4. POST /api/disputes/[id]/draft generates grounded rebuttal & stages contest on Razorpay in DRAFT mode", async () => {
    const res = await fetch(
      `${BASE_URL}/api/disputes/disp_1064_goods_not_received/draft`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customInstructions: "Highlight courier OTP verification and GST invoice",
        }),
      }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.mode).toBe("draft");
    expect(json.draftedRebuttal.summary.length).toBeLessThanOrEqual(1000);
    expect(json.draftedRebuttal.citedEvidence).toContain("shipping_proof");
    expect(json.razorpayContestResult.success).toBe(true);
    expect(json.razorpayContestResult.action).toBe("draft");
    expect(json.razorpayContestResult.response.evidence.shipping_proof).toBeDefined();
  });

  it("5. POST /api/disputes/[id]/accept accepts dispute & calls Razorpay accept", async () => {
    const res = await fetch(
      `${BASE_URL}/api/disputes/disp_1084_duplicate_processing/accept`,
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.status).toBe("lost");
    expect(json.razorpayResult.success).toBe(true);
  });

  it("6. POST /api/disputes/sync synchronizes gateway dispute feed", async () => {
    const res = await fetch(`${BASE_URL}/api/disputes/sync`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.synced).toBe(true);
    expect(json.localDisputesCount).toBeGreaterThanOrEqual(6);
  });

  it("7. Page routes (/overview, /disputes, /transactions, /settlements, /settings) return 200 HTML", async () => {
    const routes = [
      "/overview",
      "/disputes",
      "/transactions",
      "/settlements",
      "/settings",
    ];
    for (const route of routes) {
      const res = await fetch(`${BASE_URL}${route}`);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain("Razorpay");
      expect(text).toContain("AEGIS");
    }
  });
});
