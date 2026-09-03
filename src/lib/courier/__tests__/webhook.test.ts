import { describe, it, expect } from "vitest";
import { POST, GET } from "../../../app/api/webhooks/courier/route";
import { NextRequest } from "next/server";

describe("3PL Courier Webhook API Route", () => {
  it("1. Accepts valid courier webhook payload", async () => {
    const payload = JSON.stringify({
      trackingId: "AWB_TEST_WEBHOOK_001",
      orderId: "order_upi_1064_001",
      status: "DELIVERED",
      signatureCaptured: true,
      timestamp: new Date().toISOString(),
    });

    const req = new NextRequest("http://localhost:3000/api/webhooks/courier?provider=mock", {
      method: "POST",
      body: payload,
      headers: {
        "content-type": "application/json",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.status).toBe("processed");
    expect(json.trackingId).toBe("AWB_TEST_WEBHOOK_001");
  });

  it("2. Rejects empty body with 400 Bad Request", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/courier", {
      method: "POST",
      body: "",
      headers: {
        "content-type": "application/json",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Empty request body");
  });

  it("3. Returns 405 Method Not Allowed for GET requests", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toContain("Method Not Allowed");
  });
});
