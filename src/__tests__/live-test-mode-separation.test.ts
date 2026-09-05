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
    expect(json.count).toBe(10);
    expect(json.data.length).toBe(10);

    for (const d of json.data) {
      expect(d.mode).toBe("test");
      expect(d.dataSource).toBe("seed");
      expect(d.isDemo).toBe(true);
      expect(d.winnability).toBeDefined();
      expect(typeof d.winnability.score).toBe("number");
    }

    expect(json.stats.high.count).toBe(4);
    expect(json.stats.needsEvidence.count).toBe(1);
    expect(json.stats.low.count).toBe(5);
  });

  it("3. GET /api/disputes?mode=live NEVER leaks seeded or mock demo data", async () => {
    const res = await fetch(`${BASE_URL}/api/disputes?mode=live`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.mode).toBe("live");

    if (json.count === 0) {
      expect(json.data).toEqual([]);
      expect(json.stats.totalCount).toBe(0);
      expect(json.stats.totalPendingAmount).toBe(0);
    } else {
      const seedIds = [
        "disp_1064_goods_not_received",
        "disp_108_beneficiary_not_credited",
        "disp_4837_no_cardholder_auth",
        "disp_1062_goods_not_as_described",
        "disp_1061_credit_not_processed",
        "disp_1084_duplicate_processing",
        "disp_4853_defective_merchandise",
        "disp_4834_amount_differ",
        "disp_1063_cancelled_recurring",
        "disp_4837_velocity_spike",
      ];
      for (const d of json.data) {
        expect(seedIds).not.toContain(d.id);
        expect(d.dataSource).toBe("live");
      }
    }
  });

  it("4. POST /api/merchant/connect validates credentials and rejects invalid formats", async () => {
    const res1 = await fetch(`${BASE_URL}/api/merchant/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res1.status).toBe(400);
    const json1 = await res1.json();
    expect(json1.ok).toBe(false);

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
    const resTest = await fetch(`${BASE_URL}/api/disputes/sync?mode=test`, {
      method: "POST",
    });
    expect(resTest.status).toBe(200);
    const jsonTest = await resTest.json();
    expect(jsonTest.ok).toBe(true);
    expect(jsonTest.mode).toBe("test");
    expect(jsonTest.totalManagedCount).toBeGreaterThanOrEqual(6);

    const resLive = await fetch(`${BASE_URL}/api/disputes/sync?mode=live`, {
      method: "POST",
    });
    expect(resLive.status).toBe(200);
    const jsonLive = await resLive.json();
    expect(jsonLive.ok).toBe(true);
    expect(jsonLive.mode).toBe("live");
  });
});
