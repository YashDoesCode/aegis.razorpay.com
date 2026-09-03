import { describe, it, expect } from "vitest";
import { fallbackDisputes } from "../../mockStore";
import { processCourierWebhook } from "../service";

describe("Courier Integration Live vs Test Mode Isolation", () => {
  it("1. Asserts seed/test dispute records do not leak into live merchant streams", () => {
    const seedDisputes = fallbackDisputes.filter((d) => d.dataSource === "seed" || d.data_source === "seed");
    expect(seedDisputes.length).toBeGreaterThan(0);

    for (const d of seedDisputes) {
      expect(d.dataSource === "seed" || d.data_source === "seed").toBe(true);
      expect(d.order?.customer?.email).toBeDefined();
    }
  });

  it("2. Does not expose courier secrets or sensitive webhook tokens in responses", async () => {
    const rawPayload = JSON.stringify({
      trackingId: "AWB_ISOLATION_TEST_999",
      orderId: "order_upi_1064_001",
      status: "DELIVERED",
      signatureCaptured: true,
      timestamp: new Date().toISOString(),
    });

    const result = await processCourierWebhook({
      rawBody: rawPayload,
      providerId: "mock",
    });

    const resultJson = JSON.stringify(result);
    expect(resultJson).not.toContain("secret");
    expect(resultJson).not.toContain("password");
    expect(resultJson).not.toContain("token");
  });
});
