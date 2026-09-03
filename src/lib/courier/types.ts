import { z } from "zod";

/**
 * Canonical Aegis shipment lifecycle statuses across all 3PL logistics carriers.
 */
export const CanonicalShipmentStatusSchema = z.enum([
  "CREATED",          // Manifest/AWB created, awaiting pickup
  "PICKED_UP",        // Package collected from merchant warehouse
  "IN_TRANSIT",       // In transit between carrier hubs/branches
  "OUT_FOR_DELIVERY", // Package out on delivery van
  "DELIVERED",        // Successfully delivered to recipient
  "FAILED_DELIVERY",  // Attempted delivery failed (customer not available, etc.)
  "RETURNED",         // Returned to merchant origin (RTO)
  "CANCELLED",        // Shipment cancelled
  "LOST",             // Package lost in transit
  "EXCEPTION",        // Customs, weather, or operational exception
]);

export type CanonicalShipmentStatus = z.infer<typeof CanonicalShipmentStatusSchema>;

/**
 * Individual tracking checkpoint/event from a carrier.
 */
export interface NormalizedShipmentEvent {
  eventId: string;
  status: CanonicalShipmentStatus;
  rawStatus: string;
  timestamp: Date;
  location?: string;
  description?: string;
  signatureCaptured?: boolean;
  podUrl?: string;
}

/**
 * Canonical Aegis normalized shipment record.
 */
export interface NormalizedShipment {
  trackingId: string;
  provider: string; // e.g. "delhivery", "bluedart", "shadowfax", "mock"
  orderId?: string;
  status: CanonicalShipmentStatus;
  recipientName?: string;
  recipientAddress?: string;
  pickupAt?: Date;
  deliveredAt?: Date;
  outForDeliveryAt?: Date;
  signatureCaptured: boolean;
  podDocumentRef?: string;
  events: NormalizedShipmentEvent[];
  lastSyncedAt: Date;
}

/**
 * Normalized payload produced after parsing a 3PL webhook event.
 */
export interface NormalizedShipmentWebhookEvent {
  eventId: string;
  provider: string;
  trackingId: string;
  orderId?: string;
  status: CanonicalShipmentStatus;
  rawStatus: string;
  timestamp: Date;
  location?: string;
  deliveredToAddress?: string;
  signatureCaptured?: boolean;
  podDocumentRef?: string;
  rawPayload?: Record<string, unknown>;
}

export const NormalizedShipmentWebhookEventSchema = z.object({
  eventId: z.string().min(1),
  provider: z.string().min(1),
  trackingId: z.string().min(1),
  orderId: z.string().optional(),
  status: CanonicalShipmentStatusSchema,
  rawStatus: z.string(),
  timestamp: z.date(),
  location: z.string().optional(),
  deliveredToAddress: z.string().optional(),
  signatureCaptured: z.boolean().optional(),
  podDocumentRef: z.string().optional(),
  rawPayload: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Provider-agnostic 3PL adapter contract.
 */
export interface CourierAdapter {
  readonly providerId: string;
  readonly displayName: string;

  /**
   * Cryptographically verifies the webhook signature using provider-specific algorithms
   * (e.g. HMAC-SHA256, shared token, or header hash) in constant time.
   */
  verifyWebhookSignature(
    rawBody: string,
    signature: string | null,
    secret: string
  ): boolean;

  /**
   * Parses the raw webhook payload into the canonical Aegis webhook event representation.
   */
  parseWebhookEvent(
    rawBody: string,
    headers?: Record<string, string>
  ): Promise<NormalizedShipmentWebhookEvent>;

  /**
   * Pulls real-time shipment & tracking data on-demand for a given tracking/AWB ID.
   */
  fetchTracking(
    trackingId: string,
    credentials?: Record<string, string>
  ): Promise<NormalizedShipment>;
}

/**
 * Result returned by CourierService webhook processing.
 */
export interface CourierWebhookProcessResult {
  status: "processed" | "duplicate" | "ignored" | "error";
  provider: string;
  trackingId?: string;
  orderId?: string;
  disputeId?: string;
  shipmentStatus?: CanonicalShipmentStatus;
  message: string;
  evidenceAttached?: boolean;
}
