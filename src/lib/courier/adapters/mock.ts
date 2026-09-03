import crypto from "crypto";
import {
  CourierAdapter,
  CanonicalShipmentStatus,
  NormalizedShipment,
  NormalizedShipmentWebhookEvent,
} from "../types";

/**
 * Deterministic Mock Logistics Adapter for automated test suites and isolated sandbox demos.
 */
export class MockCourierAdapter implements CourierAdapter {
  readonly providerId = "mock";
  readonly displayName = "Deterministic Mock Courier";

  verifyWebhookSignature(
    rawBody: string,
    signature: string | null,
    secret: string
  ): boolean {
    if (!rawBody || !signature || !secret) {
      return false;
    }

    try {
      const cleanSecret = secret.trim();
      const cleanSignature = signature.trim();

      const expectedHmac = crypto
        .createHmac("sha256", cleanSecret)
        .update(rawBody, "utf8")
        .digest("hex");

      const expectedBuf = Buffer.from(expectedHmac, "utf8");
      const signatureBuf = Buffer.from(cleanSignature, "utf8");

      if (expectedBuf.length !== signatureBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, signatureBuf);
    } catch {
      return false;
    }
  }

  async parseWebhookEvent(
    rawBody: string
  ): Promise<NormalizedShipmentWebhookEvent> {
    if (!rawBody || rawBody.trim() === "") {
      throw new Error("Cannot parse empty mock webhook payload");
    }

    let json: Record<string, unknown>;
    try {
      json = JSON.parse(rawBody);
    } catch {
      throw new Error("Malformed mock webhook JSON payload");
    }

    const trackingId = String(json.trackingId || json.awb || "MOCK_AWB_001").trim();
    const rawStatus = String(json.status || json.rawStatus || "DELIVERED");
    const status = (json.canonicalStatus as CanonicalShipmentStatus) ||
      (rawStatus.toUpperCase() as CanonicalShipmentStatus) ||
      "DELIVERED";

    const timestamp = json.timestamp ? new Date(String(json.timestamp)) : new Date();
    const eventId = String(json.eventId || `mock_evt_${trackingId}_${timestamp.getTime()}`);

    return {
      eventId,
      provider: this.providerId,
      trackingId,
      orderId: json.orderId ? String(json.orderId) : undefined,
      status,
      rawStatus,
      timestamp,
      location: json.location ? String(json.location) : "Bengaluru Sorting Center",
      deliveredToAddress: json.deliveredToAddress ? String(json.deliveredToAddress) : undefined,
      signatureCaptured: Boolean(json.signatureCaptured ?? (status === "DELIVERED")),
      podDocumentRef: json.podDocumentRef ? String(json.podDocumentRef) : status === "DELIVERED" ? `POD-MOCK-${trackingId}` : undefined,
      rawPayload: json,
    };
  }

  async fetchTracking(trackingId: string): Promise<NormalizedShipment> {
    const cleanId = (trackingId || "").trim();
    if (!cleanId) {
      throw new Error("Tracking ID is required");
    }

    const isDelivered = !cleanId.toLowerCase().includes("transit");
    const status: CanonicalShipmentStatus = isDelivered ? "DELIVERED" : "IN_TRANSIT";

    return {
      trackingId: cleanId,
      provider: this.providerId,
      status,
      signatureCaptured: isDelivered,
      deliveredAt: isDelivered ? new Date() : undefined,
      podDocumentRef: isDelivered ? `POD-MOCK-${cleanId}` : undefined,
      events: [
        {
          eventId: `evt_${cleanId}_01`,
          status,
          rawStatus: isDelivered ? "Delivered" : "In Transit",
          timestamp: new Date(),
          location: "Bengaluru Logistics Hub",
          signatureCaptured: isDelivered,
        },
      ],
      lastSyncedAt: new Date(),
    };
  }
}
