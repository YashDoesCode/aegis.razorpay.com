import crypto from "crypto";
import { z } from "zod";
import {
  CourierAdapter,
  CanonicalShipmentStatus,
  NormalizedShipment,
  NormalizedShipmentWebhookEvent,
} from "../types";
import { logger } from "../../logger";

/**
 * Maps Delhivery raw scan/status codes into canonical Aegis shipment statuses.
 */
export function mapDelhiveryStatus(rawStatus: string): CanonicalShipmentStatus {
  const normalized = (rawStatus || "").trim().toUpperCase();

  if (
    normalized === "UD" ||
    normalized.includes("UNDELIVERED") ||
    normalized.includes("FAILED") ||
    normalized.includes("DELIVERY ATTEMPTED") ||
    normalized.includes("UNSUCCESSFUL")
  ) {
    return "FAILED_DELIVERY";
  }

  if (
    normalized === "DL" ||
    normalized.includes("DELIVERED") ||
    normalized.includes("SUCCESSFUL DELIVERY")
  ) {
    return "DELIVERED";
  }

  if (
    normalized === "OFD" ||
    normalized.includes("OUT FOR DELIVERY") ||
    normalized.includes("OUT_FOR_DELIVERY")
  ) {
    return "OUT_FOR_DELIVERY";
  }

  if (
    normalized === "PU" ||
    normalized.includes("PICKED UP") ||
    normalized.includes("PICKUP DONE") ||
    normalized.includes("MANIFEST CREATED")
  ) {
    return "PICKED_UP";
  }

  if (normalized.includes("LOST") || normalized.includes("DAMAGED")) {
    return "LOST";
  }

  if (normalized.includes("CANCEL")) {
    return "CANCELLED";
  }

  if (
    normalized === "RT" ||
    normalized.includes("RTO") ||
    normalized.includes("RETURN TO ORIGIN") ||
    normalized.includes("RETURNED")
  ) {
    return "RETURNED";
  }

  if (
    normalized === "IT" ||
    normalized.includes("IN TRANSIT") ||
    normalized.includes("DISPATCHED") ||
    normalized.includes("REACHED HUB") ||
    normalized.includes("BAG ADDED")
  ) {
    return "IN_TRANSIT";
  }

  if (normalized === "MANIFEST" || normalized === "OPEN") {
    return "CREATED";
  }

  return "EXCEPTION";
}

// Zod schema for official Delhivery package tracking JSON API response
const DelhiveryScanSchema = z.object({
  ScanDetail: z.object({
    Scan: z.string().optional(),
    ScanDateTime: z.string().optional(),
    ScannedLocation: z.string().optional(),
    Instructions: z.string().optional(),
  }).optional(),
});

const DelhiveryShipmentSchema = z.object({
  AWB: z.string().optional(),
  Status: z.object({
    Status: z.string().optional(),
    StatusDateTime: z.string().optional(),
    StatusLocation: z.string().optional(),
    Instructions: z.string().optional(),
  }).optional(),
  PickUpDate: z.string().optional(),
  ExpectedDate: z.string().optional(),
  Destination: z.string().optional(),
  POD: z.string().optional(),
  Scans: z.array(DelhiveryScanSchema).optional(),
});

const DelhiveryApiResponseSchema = z.object({
  ShipmentData: z.array(
    z.object({
      Shipment: DelhiveryShipmentSchema.optional(),
      Error: z.string().optional(),
    })
  ).optional(),
  Error: z.string().optional(),
});

/**
 * Production Delhivery Logistics Adapter for Indian fulfillment evidence ingestion.
 */
export class DelhiveryAdapter implements CourierAdapter {
  readonly providerId = "delhivery";
  readonly displayName = "Delhivery Logistics";

  /**
   * Constant-time signature / secret verification for Delhivery webhooks.
   * Supports HMAC-SHA256 signature and shared token comparison.
   */
  verifyWebhookSignature(
    rawBody: string,
    signature: string | null,
    secret: string
  ): boolean {
    if (!signature || !secret) {
      return false;
    }

    try {
      const cleanSecret = secret.trim();
      const cleanSignature = signature.trim();

      // Case 1: HMAC-SHA256 digest comparison
      const expectedHmac = crypto
        .createHmac("sha256", cleanSecret)
        .update(rawBody, "utf8")
        .digest("hex");

      const expectedHmacBuf = Buffer.from(expectedHmac, "utf8");
      const signatureBuf = Buffer.from(cleanSignature, "utf8");

      if (expectedHmacBuf.length === signatureBuf.length) {
        if (crypto.timingSafeEqual(expectedHmacBuf, signatureBuf)) {
          return true;
        }
      }

      // Case 2: Shared Secret / Bearer Token comparison
      const secretBuf = Buffer.from(cleanSecret, "utf8");
      if (secretBuf.length === signatureBuf.length) {
        return crypto.timingSafeEqual(secretBuf, signatureBuf);
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Parses incoming Delhivery webhook payload into Aegis canonical event.
   * STRICT FORENSIC RULE: Never manufactures fake POD references.
   */
  async parseWebhookEvent(
    rawBody: string
  ): Promise<NormalizedShipmentWebhookEvent> {
    if (!rawBody || rawBody.trim() === "") {
      throw new Error("Cannot parse empty Delhivery webhook payload");
    }

    let json: Record<string, unknown>;
    try {
      json = JSON.parse(rawBody);
    } catch {
      throw new Error("Malformed Delhivery webhook JSON payload");
    }

    const waybill = String(
      json.Waybill ||
      json.waybill ||
      json.awb ||
      json.trackingId ||
      json.ShipmentId ||
      ""
    ).trim();

    if (!waybill) {
      throw new Error("Delhivery webhook payload missing Waybill / AWB identifier");
    }

    const rawStatusObj = json.Status as Record<string, unknown> | undefined;
    const rawStatus = String(
      (rawStatusObj && rawStatusObj.Status) ||
      json.Status ||
      json.status ||
      json.ScanType ||
      "UNKNOWN"
    );

    const canonicalStatus = mapDelhiveryStatus(rawStatus);

    const timeStr = String(
      (rawStatusObj && rawStatusObj.StatusDateTime) ||
      json.StatusDateTime ||
      json.ScanDateTime ||
      json.timestamp ||
      new Date().toISOString()
    );

    const parsedDate = new Date(timeStr);
    const timestamp = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    const location = String(
      (rawStatusObj && rawStatusObj.StatusLocation) ||
      json.StatusLocation ||
      json.ScannedLocation ||
      json.location ||
      ""
    ).trim() || undefined;

    const orderId = json.ReferenceNo || json.orderId || json.refNo
      ? String(json.ReferenceNo || json.orderId || json.refNo).trim()
      : undefined;

    const signatureCaptured = Boolean(
      json.Signature ||
      json.signature ||
      json.OTPVerified ||
      json.otpVerified ||
      (canonicalStatus === "DELIVERED" && json.DeliveredTo)
    );

    // FORENSIC INTEGRITY: Only set podDocumentRef if the payload genuinely contains a POD URL or reference
    const rawPod = json.POD || json.podUrl || json.podRef || json.pod_url;
    const podDocumentRef = typeof rawPod === "string" && rawPod.trim().length > 0
      ? rawPod.trim()
      : undefined;

    const eventId = String(
      json.EventId ||
      json.eventId ||
      json.ScanId ||
      `dlv_${waybill}_${timestamp.getTime()}`
    );

    return {
      eventId,
      provider: this.providerId,
      trackingId: waybill,
      orderId,
      status: canonicalStatus,
      rawStatus,
      timestamp,
      location,
      signatureCaptured,
      podDocumentRef,
      source: "delhivery_webhook",
      rawPayload: json,
    };
  }

  /**
   * Fetches real-time shipment & tracking data from Delhivery Package Tracking API.
   * Includes authentication token, timeout, schema validation, and structured error handling.
   */
  async fetchTracking(
    trackingId: string,
    credentials?: { apiToken?: string; baseUrl?: string }
  ): Promise<NormalizedShipment> {
    const cleanId = (trackingId || "").trim();
    if (!cleanId) {
      throw new Error("Tracking ID / Waybill is required");
    }

    const apiToken =
      credentials?.apiToken ||
      process.env.DELHIVERY_API_TOKEN ||
      process.env.DELHIVERY_API_KEY ||
      "";

    const isProduction = process.env.NODE_ENV === "production";

    // In production, require configured credentials
    if (isProduction && !apiToken) {
      throw new Error(
        "[Delhivery Integration] Missing DELHIVERY_API_TOKEN in production environment."
      );
    }

    // In dev / test when token is absent, return structured test fixture with explicit provenance
    if (!apiToken) {
      logger.warn("Delhivery API token not configured; using offline sandbox mock", {
        module: "DelhiveryAdapter",
        trackingId: cleanId,
      });

      const isDelivered = cleanId.toUpperCase().includes("DELIV") || cleanId.startsWith("DLV");
      const status: CanonicalShipmentStatus = isDelivered ? "DELIVERED" : "IN_TRANSIT";

      return {
        trackingId: cleanId,
        provider: this.providerId,
        status,
        signatureCaptured: isDelivered,
        deliveredAt: isDelivered ? new Date() : undefined,
        podDocumentRef: undefined, // No manufactured fake POD
        events: [
          {
            eventId: `evt_${cleanId}_01`,
            status,
            rawStatus: isDelivered ? "Delivered" : "In Transit",
            timestamp: new Date(),
            location: "Bengaluru Logistics Hub, KA",
            signatureCaptured: isDelivered,
          },
        ],
        lastSyncedAt: new Date(),
        source: "synthetic_test",
      };
    }

    const baseUrl =
      credentials?.baseUrl ||
      process.env.DELHIVERY_API_BASE_URL ||
      "https://track.delhivery.com/api/v1/packages/json/";

    const url = new URL(baseUrl);
    url.searchParams.set("waybill", cleanId);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Token ${apiToken}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Delhivery API HTTP error ${response.status}: ${response.statusText}`
        );
      }

      const rawJson = await response.json();
      const parsed = DelhiveryApiResponseSchema.parse(rawJson);

      const shipmentItem = parsed.ShipmentData?.[0]?.Shipment;
      if (!shipmentItem) {
        throw new Error(
          parsed.Error ||
          parsed.ShipmentData?.[0]?.Error ||
          `No shipment data returned by Delhivery for waybill ${cleanId}`
        );
      }

      const rawStatus = shipmentItem.Status?.Status || "UNKNOWN";
      const canonicalStatus = mapDelhiveryStatus(rawStatus);

      const statusDateStr = shipmentItem.Status?.StatusDateTime;
      const statusDate = statusDateStr ? new Date(statusDateStr) : new Date();

      const isDelivered = canonicalStatus === "DELIVERED";
      const deliveredAt = isDelivered ? statusDate : undefined;

      const rawPod = shipmentItem.POD;
      const podDocumentRef = typeof rawPod === "string" && rawPod.trim().length > 0
        ? rawPod.trim()
        : undefined;

      const scans = (shipmentItem.Scans || []).map((s, idx) => {
        const scan = s.ScanDetail;
        const scanRaw = scan?.Scan || "Scan";
        const scanDate = scan?.ScanDateTime ? new Date(scan.ScanDateTime) : new Date();
        return {
          eventId: `scan_${cleanId}_${idx}`,
          status: mapDelhiveryStatus(scanRaw),
          rawStatus: scanRaw,
          timestamp: scanDate,
          location: scan?.ScannedLocation || undefined,
          description: scan?.Instructions || undefined,
        };
      });

      return {
        trackingId: cleanId,
        provider: this.providerId,
        status: canonicalStatus,
        recipientAddress: shipmentItem.Destination || undefined,
        deliveredAt,
        signatureCaptured: isDelivered,
        podDocumentRef,
        events: scans.length > 0 ? scans : [
          {
            eventId: `evt_${cleanId}_curr`,
            status: canonicalStatus,
            rawStatus,
            timestamp: statusDate,
            location: shipmentItem.Status?.StatusLocation || undefined,
          },
        ],
        lastSyncedAt: new Date(),
        source: "delhivery_api",
      };
    } catch (fetchErr: unknown) {
      const isAbort = fetchErr instanceof Error && fetchErr.name === "AbortError";
      const message = isAbort
        ? "Delhivery API request timed out after 5000ms"
        : fetchErr instanceof Error
        ? fetchErr.message
        : String(fetchErr);

      logger.error("Delhivery tracking API fetch failed", fetchErr, {
        module: "DelhiveryAdapter",
        trackingId: cleanId,
      });

      throw new Error(`Failed to fetch Delhivery tracking for ${cleanId}: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
