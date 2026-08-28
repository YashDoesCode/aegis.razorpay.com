import { describe, it, expect } from "vitest";

const BASE_URL = "http://localhost:3000";

describe("Aegis Failure Simulation & Live Resilience Test", () => {
  // 1. Simulation 1: Forced LLM Fallback
  it("Simulation 1: Forced LLM failure returns deterministic template rebuttal with source: 'fallback'", async () => {
    const res = await fetch(
      `${BASE_URL}/api/disputes/disp_1064_goods_not_received/draft?forceFallback=true`,
      { method: "POST" }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.source).toBe("fallback");
    expect(json.draftedRebuttal).toBeDefined();
    expect(json.draftedRebuttal.source).toBe("fallback");
    expect(json.draftedRebuttal.summary).toContain("Sony WH-1000XM5");
    expect(json.draftedRebuttal.explanationLetter).toContain("Dear Dispute Operations");
    expect(json.draftedRebuttal.citedEvidence).toContain("shipping_proof");
  });

  // 2. Simulation 2: Forced 500 error on /api/disputes
  it("Simulation 2: Forced 500 error returns friendly error payload without crashing server", async () => {
    const res = await fetch(`${BASE_URL}/api/disputes?forceError=500`);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBeDefined();
    expect(typeof json.error).toBe("string");
    expect(json.error).toContain("Simulated database connection failure (500)");
  });

  // 3. Simulation 3: Non-existent dispute ID returns friendly 404
  it("Simulation 3: Requesting non-existent dispute returns friendly 404 payload", async () => {
    const res = await fetch(`${BASE_URL}/api/disputes/disp_missing_non_existent_9999`);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Dispute disp_missing_non_existent_9999 not found");
  });

  // 4. Simulation 4: Re-POST /accept on already-accepted dispute is idempotent
  it(
    "Simulation 4: Re-POST /accept on already-accepted dispute returns 200 idempotent response",
    async () => {
    // First accept call
    const res1 = await fetch(
      `${BASE_URL}/api/disputes/disp_1084_duplicate_processing/accept`,
      { method: "POST" }
    );
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.ok).toBe(true);
    expect(json1.status).toBe("lost");

    // Second accept call (idempotency test)
    const res2 = await fetch(
      `${BASE_URL}/api/disputes/disp_1084_duplicate_processing/accept`,
      { method: "POST" }
    );
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.ok).toBe(true);
    expect(json2.status).toBe("lost");
    expect(json2.idempotent).toBe(true);
    expect(json2.message).toBe("Dispute already accepted");
  }, 15000);
});
