import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { POST, GET, PUT, DELETE } from "../../../app/api/webhooks/razorpay/route";
import {
  getInMemoryDisputeById,
  getInMemoryWebhookEvents,
  getInMemoryAuditEvents,
  resetInMemoryWebhookStore,
} from "../../mockStore";

describe("Razorpay Webhook Ingestion Pipeline", () => {
  const testSecret = "whsec_super_secret_test_key_98765";
  const originalEnvSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;
    resetInMemoryWebhookStore();
  });

  afterAll(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = originalEnvSecret;
  });

  function createSignedRequest(
    payload: unknown,
    options?: {
      overrideSignature?: string | null;
      customSecret?: string;
      customHeaders?: Record<string, string>;
      rawString?: string;
    }
  ): NextRequest {
    const bodyStr =
      options?.rawString !== undefined
        ? options.rawString
        : JSON.stringify(payload);

    const secretToUse = options?.customSecret ?? testSecret;
    const signature =
      options?.overrideSignature !== undefined
        ? options.overrideSignature
        : crypto
            .createHmac("sha256", secretToUse)
            .update(bodyStr, "utf8")
            .digest("hex");

    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-request-id": `req_test_${crypto.randomUUID().slice(0, 8)}`,
      ...(options?.customHeaders || {}),
    };

    if (signature !== null) {
      headers["x-razorpay-signature"] = signature;
    }

    return new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers,
      body: bodyStr,
    });
  }

  it("successfully ingests dispute.created event and creates dispute in store", async () => {
    const disputeId = `disp_test_create_${Date.now()}`;
    const payload = {
      entity: "event",
      account_id: "acc_demo_test_01",
      event: "dispute.created",
      contains: ["dispute"],
      payload: {
        dispute: {
          entity: {
            id: disputeId,
            payment_id: "pay_test_payment_1001",
            amount: 550000,
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

    const request = createSignedRequest(payload);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.status).toBe("processed");
    expect(json.disputeId).toBe(disputeId);
    expect(json.eventType).toBe("dispute.created");

    const dispute = getInMemoryDisputeById(disputeId);
    expect(dispute).toBeDefined();
    expect(dispute?.amount).toBe(550000);
    expect(dispute?.status).toBe("open");
    expect(dispute?.reasonCode).toBe("1064");

    const webhookEvents = getInMemoryWebhookEvents();
    expect(webhookEvents.length).toBe(1);
    expect(webhookEvents[0].disputeId).toBe(disputeId);
    expect(webhookEvents[0].status).toBe("processed");
    expect(webhookEvents[0].signatureVerified).toBe(true);

    const auditEvents = getInMemoryAuditEvents(disputeId);
    expect(auditEvents.length).toBe(2);
    expect(auditEvents.some((a) => a.action === "WEBHOOK_RECEIVED")).toBe(true);
    expect(auditEvents.some((a) => a.action === "DISPUTE_CREATED")).toBe(true);
  });

  it("successfully ingests dispute.under_review and updates dispute status", async () => {
    const disputeId = "disp_1064_goods_not_received";
    const payload = {
      entity: "event",
      event: "dispute.under_review",
      contains: ["dispute"],
      payload: {
        dispute: {
          entity: {
            id: disputeId,
            payment_id: "pay_O1064UPI0001",
            amount: 2499900,
            currency: "INR",
            reason_code: "1064",
            status: "under_review",
          },
        },
      },
    };

    const request = createSignedRequest(payload);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.status).toBe("processed");

    const dispute = getInMemoryDisputeById(disputeId);
    expect(dispute?.status).toBe("under_review");

    const auditEvents = getInMemoryAuditEvents(disputeId);
    expect(auditEvents.some((a) => a.action === "DISPUTE_UNDER_REVIEW")).toBe(true);
  });

  it("successfully ingests dispute.won event and marks dispute won", async () => {
    const disputeId = "disp_108_beneficiary_not_credited";
    const payload = {
      entity: "event",
      event: "dispute.won",
      contains: ["dispute"],
      payload: {
        dispute: {
          entity: {
            id: disputeId,
            payment_id: "pay_O108UPI0002",
            amount: 850000,
            currency: "INR",
            status: "won",
          },
        },
      },
    };

    const request = createSignedRequest(payload);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.status).toBe("processed");

    const dispute = getInMemoryDisputeById(disputeId);
    expect(dispute?.status).toBe("won");
  });

  it("successfully ingests dispute.lost event and marks dispute lost", async () => {
    const disputeId = "disp_4837_no_cardholder_auth";
    const payload = {
      entity: "event",
      event: "dispute.lost",
      contains: ["dispute"],
      payload: {
        dispute: {
          entity: {
            id: disputeId,
            payment_id: "pay_O4837CARD0003",
            amount: 1450000,
            currency: "INR",
            status: "lost",
          },
        },
      },
    };

    const request = createSignedRequest(payload);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.status).toBe("processed");

    const dispute = getInMemoryDisputeById(disputeId);
    expect(dispute?.status).toBe("lost");
  });

  it("prevents duplicate execution when identical webhook is delivered twice (idempotency)", async () => {
    const disputeId = `disp_idempotency_${Date.now()}`;
    const payload = {
      entity: "event",
      event: "dispute.created",
      contains: ["dispute"],
      payload: {
        dispute: {
          entity: {
            id: disputeId,
            payment_id: "pay_idem_001",
            amount: 120000,
            currency: "INR",
            status: "open",
          },
        },
      },
    };

    const firstRequest = createSignedRequest(payload);
    const firstResponse = await POST(firstRequest);
    const firstJson = await firstResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(firstJson.status).toBe("processed");

    const secondRequest = createSignedRequest(payload);
    const secondResponse = await POST(secondRequest);
    const secondJson = await secondResponse.json();

    expect(secondResponse.status).toBe(200);
    expect(secondJson.ok).toBe(true);
    expect(secondJson.status).toBe("duplicate");

    const webhookEvents = getInMemoryWebhookEvents();
    expect(webhookEvents.length).toBe(1);
  });

  it("rejects webhook request with missing signature with HTTP 401", async () => {
    const payload = { event: "dispute.created" };
    const request = createSignedRequest(payload, { overrideSignature: null });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.code).toBe("UNAUTHORIZED_WEBHOOK");
  });

  it("rejects webhook request with invalid HMAC signature with HTTP 401", async () => {
    const payload = { event: "dispute.created" };
    const request = createSignedRequest(payload, {
      overrideSignature: "bad_signature_abcdef123456",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.code).toBe("UNAUTHORIZED_WEBHOOK");
  });

  it("rejects webhook request computed with wrong secret with HTTP 401", async () => {
    const payload = { event: "dispute.created" };
    const request = createSignedRequest(payload, {
      customSecret: "wrong_secret_attack_key",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.code).toBe("UNAUTHORIZED_WEBHOOK");
  });

  it("rejects malformed JSON payload with HTTP 400", async () => {
    const rawMalformed = "{ bad_json: true, ";
    const request = createSignedRequest(null, { rawString: rawMalformed });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.code).toBe("MALFORMED_JSON");
  });

  it("rejects empty request body with HTTP 400", async () => {
    const request = createSignedRequest(null, { rawString: "" });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.code).toBe("EMPTY_BODY");
  });

  it("rejects payload failing schema validation with HTTP 400", async () => {
    const invalidSchemaPayload = {
      event: "dispute.created",
      payload: {
        dispute: {
          entity: {
            id: "disp_missing_payment_id",
          },
        },
      },
    };

    const request = createSignedRequest(invalidSchemaPayload);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.code).toBe("SCHEMA_VALIDATION_ERROR");
  });

  it("gracefully ignores unsupported non-dispute events with HTTP 200", async () => {
    const unsupportedPayload = {
      entity: "event",
      event: "order.paid",
      contains: ["order"],
      payload: {
        dispute: {
          entity: {
            id: "disp_dummy",
            payment_id: "pay_dummy",
            amount: 10000,
            status: "open",
          },
        },
      },
    };

    const request = createSignedRequest(unsupportedPayload);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.status).toBe("ignored");

    const webhookEvents = getInMemoryWebhookEvents();
    expect(webhookEvents.length).toBe(1);
    expect(webhookEvents[0].status).toBe("ignored");
  });

  it("returns HTTP 405 Method Not Allowed for GET, PUT, DELETE", async () => {
    const getRes = await GET();
    expect(getRes.status).toBe(405);
    expect(getRes.headers.get("Allow")).toBe("POST");

    const putRes = await PUT();
    expect(putRes.status).toBe(405);

    const deleteRes = await DELETE();
    expect(deleteRes.status).toBe(405);
  });
});
