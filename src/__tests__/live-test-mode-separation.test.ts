import { describe, it, expect } from "vitest";

describe("Strict Live vs Test Mode Data Separation & Merchant Connect Flow", () => {
  const BASE_URL = "http://localhost:3000";

  it("1. GET /api/merchant/status returns merchant connection information", async () => {
    const res = await fetch(`${BASE_URL}/api/merchant/status`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.merchantId).toBeDefined();
    expect(json.name).toBeDefined();
  });

  it("2. GET /api/disputes?mode=test returns ONLY seeded demo disputes with correct tagging", async () => {
    const res = await fetch(`${BASE_URL}/api/disputes?mode=test`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.mode).toBe("test");
    expect(json.count).toBeGreaterThanOrEqual(6);
    expect(json.data.length).toBeGreaterThanOrEqual(6);

    // Verify all returned records have mode: "test" and isDemo: true
    for (const d of json.data) {
      expect(d.mode).toBe("test");
      expect(d.dataSource).toBe("seed");
      expect(d.isDemo).toBe(true);
      expect(d.winnability).toBeDefined();
      expect(typeof d.winnability.score).toBe("number");
    }

    // Verify representative winnability spread
    expect(json.stats.high.count).toBe(2);
    expect(json.stats.needsEvidence.count).toBe(1);
    expect(json.stats.low.count).toBe(3);
  });

  it("3. GET /api/disputes?mode=live NEVER leaks seeded or mock demo data", async () => {
    const res = await fetch(`${BASE_URL}/api/disputes?mode=live`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.mode).toBe("live");

    // In Live mode, if account has 0 disputes, count must be 0 and data must be empty
    if (json.count === 0) {
      expect(json.data).toEqual([]);
      expect(json.stats.totalCount).toBe(0);
      expect(json.stats.totalPendingAmount).toBe(0);
    } else {
      // If live disputes exist, verify none of them are seeded demo dispute IDs
      const seedIds = [
        "disp_1064_goods_not_received",
        "disp_108_beneficiary_not_credited",
        "disp_4837_no_cardholder_auth",
        "disp_1062_goods_not_as_described",
        "disp_1061_credit_not_processed",
        "disp_1084_duplicate_processing",
      ];
      for (const d of json.data) {
        expect(seedIds).not.toContain(d.id);
        expect(d.dataSource).toBe("live");
      }
    }
  });

  it("4. POST /api/merchant/connect validates credentials and rejects invalid formats", async () => {
    // Missing credentials
    const res1 = await fetch(`${BASE_URL}/api/merchant/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res1.status).toBe(400);
    const json1 = await res1.json();
    expect(json1.ok).toBe(false);

    // Invalid key prefix
    const res2 = await fetch(`${BASE_URL}/api/merchant/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyId: "invalid_prefix_12345",
        keySecret: "secret12345",
      }),
    });
    expect(res2.status).toBe(400);
    const json2 = await res2.json();
    expect(json2.ok).toBe(false);
    expect(json2.error).toContain("rzp_live_ or rzp_test_");
  });

  it("5. POST /api/merchant/disconnect succeeds and resets mode", async () => {
    const res = await fetch(`${BASE_URL}/api/merchant/disconnect`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.mode).toBe("test");
  });

  it("6. POST /api/disputes/sync?mode=live vs mode=test maintains data isolation", async () => {
    // Test mode sync
    const resTest = await fetch(`${BASE_URL}/api/disputes/sync?mode=test`, {
      method: "POST",
    });
    expect(resTest.status).toBe(200);
    const jsonTest = await resTest.json();
    expect(jsonTest.ok).toBe(true);
    expect(jsonTest.mode).toBe("test");
    expect(jsonTest.totalManagedCount).toBeGreaterThanOrEqual(6);

    // Live mode sync
    const resLive = await fetch(`${BASE_URL}/api/disputes/sync?mode=live`, {
      method: "POST",
    });
    expect(resLive.status).toBe(200);
    const jsonLive = await resLive.json();
    expect(jsonLive.ok).toBe(true);
    expect(jsonLive.mode).toBe("live");
  });
});
