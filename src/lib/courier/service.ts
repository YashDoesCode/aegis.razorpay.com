import crypto from "crypto";
import { logger } from "../logger";
import { AuditService } from "../audit";
import { prisma } from "../prisma";
import {
  CourierWebhookProcessResult,
  NormalizedShipmentWebhookEvent,
  getShipmentStatusRank,
} from "./types";
import { getCourierAdapter } from "./registry";
import {
  getInMemoryWebhookEventByHash,
  addInMemoryWebhookEvent,
  fallbackDisputes,
  getInMemoryDisputeById,
} from "../mockStore";
import { computeWinnability } from "../scoring";
import { computeFraudSignal } from "../fraudSignal";

/**
 * Computes a deterministic SHA-256 hash of the raw webhook body for idempotency.
 */
export function computeCourierPayloadHash(rawBody: string): string {
  return crypto.createHash("sha256").update(rawBody, "utf8").digest("hex");
}

export interface ProcessCourierWebhookParams {
  rawBody: string;
  signature?: string | null;
  providerId?: string;
  secret?: string;
  requestId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Core 3PL shipment webhook processing service.
 * Ingests, verifies, normalizes, and attaches delivery evidence to associated disputes.
 */
export async function processCourierWebhook(
  params: ProcessCourierWebhookParams
): Promise<CourierWebhookProcessResult> {
  const {
    rawBody,
    signature,
    providerId,
    secret,
    requestId = `req_courier_${crypto.randomUUID().slice(0, 8)}`,
    correlationId = `corr_courier_${crypto.randomUUID().slice(0, 8)}`,
    ipAddress,
    userAgent,
  } = params;

  if (!rawBody || rawBody.trim() === "") {
    return {
      status: "error",
      provider: providerId || "unknown",
      message: "Empty webhook payload",
    };
  }

  const payloadHash = computeCourierPayloadHash(rawBody);

  // 1. Idempotency Check: In-Memory
  const inMemoryDup = getInMemoryWebhookEventByHash(payloadHash);
  if (inMemoryDup) {
    logger.info("Duplicate courier webhook payload detected in memory", {
      module: "CourierService",
      correlationId,
      requestId,
      payloadHash,
    });
    return {
      status: "duplicate",
      provider: providerId || "unknown",
      message: "Duplicate courier webhook event ignored (idempotent)",
    };
  }

  // Idempotency Check: Database
  const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
  const isProduction = process.env.NODE_ENV === "production";

  if (!isTest) {
    try {
      const dbDup = await prisma.webhookEvent.findUnique({
        where: { payloadHash },
      });
      if (dbDup) {
        logger.info("Duplicate courier webhook payload detected in database", {
          module: "CourierService",
          correlationId,
          requestId,
          payloadHash,
        });
        return {
          status: "duplicate",
          provider: providerId || "unknown",
          message: "Duplicate courier webhook event ignored (idempotent)",
        };
      }
    } catch {
      // Fallback gracefully to in-memory idempotency if DB is unavailable in dev
    }
  }

  // 2. Resolve Courier Adapter
  const adapter = getCourierAdapter(providerId);

  // 3. Webhook Security: Fail-Closed in Production
  const webhookSecret =
    secret ||
    process.env.DELHIVERY_WEBHOOK_SECRET ||
    process.env.COURIER_WEBHOOK_SECRET ||
    "";

  if (isProduction) {
    if (!webhookSecret) {
      logger.error("Courier webhook rejected: missing webhook secret in production", undefined, {
        module: "CourierService",
        provider: adapter.providerId,
        correlationId,
        requestId,
      });
      return {
        status: "error",
        provider: adapter.providerId,
        message: "Unauthorized: Webhook secret not configured in production",
      };
    }

    const isValid = adapter.verifyWebhookSignature(rawBody, signature || null, webhookSecret);
    if (!isValid) {
      logger.warn("Courier webhook rejected: invalid signature in production", {
        module: "CourierService",
        provider: adapter.providerId,
        correlationId,
        requestId,
      });
      return {
        status: "error",
        provider: adapter.providerId,
        message: "Unauthorized: Invalid courier webhook signature",
      };
    }
  } else if (webhookSecret) {
    // In dev/staging with secret configured, enforce signature check
    const isValid = adapter.verifyWebhookSignature(rawBody, signature || null, webhookSecret);
    if (!isValid) {
      logger.warn("Courier webhook signature verification failed", {
        module: "CourierService",
        provider: adapter.providerId,
        correlationId,
        requestId,
      });
      return {
        status: "error",
        provider: adapter.providerId,
        message: "Invalid courier webhook signature",
      };
    }
  }

  // 4. Parse & Normalize Webhook Event
  let event: NormalizedShipmentWebhookEvent;
  try {
    event = await adapter.parseWebhookEvent(rawBody);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.warn("Failed to parse courier webhook payload", {
      module: "CourierService",
      provider: adapter.providerId,
      correlationId,
      requestId,
      error: errorMsg,
    });
    return {
      status: "error",
      provider: adapter.providerId,
      message: `Failed to parse courier event: ${errorMsg}`,
    };
  }

  // 5. Association & Ambiguity Resolution
  const matchingDisputes = fallbackDisputes.filter((dispute) => {
    const delivery = dispute.order?.delivery;
    const isOrderMatch = event.orderId && dispute.orderId === event.orderId;
    const isTrackingMatch =
      delivery?.trackingId &&
      delivery.trackingId.toLowerCase() === event.trackingId.toLowerCase();
    return isOrderMatch || isTrackingMatch;
  });

  if (matchingDisputes.length > 1 && !event.orderId) {
    logger.warn("Ambiguous tracking ID matches multiple disputes without order reference", {
      module: "CourierService",
      trackingId: event.trackingId,
      matchedCount: matchingDisputes.length,
      correlationId,
      requestId,
    });
    return {
      status: "error",
      provider: adapter.providerId,
      trackingId: event.trackingId,
      message: "Ambiguous tracking ID matches multiple disputes; exact orderId required",
    };
  }

  let matchedDisputeId: string | undefined;
  let matchedOrderId: string | undefined;
  let evidenceAttached = false;
  let podAvailable = false;
  let newScore: number | undefined;
  let scoreRecomputed = false;

  if (matchingDisputes.length === 1) {
    const dispute = matchingDisputes[0];
    matchedDisputeId = dispute.id;
    matchedOrderId = dispute.orderId;

    const existingDelivery = dispute.order?.delivery;
    const existingDeliveredAt = existingDelivery?.deliveredAt;
    const currentStatus = existingDeliveredAt ? "DELIVERED" : "IN_TRANSIT";

    // 6. Anti-Regression & Event Ordering Check
    const isCurrentlyDelivered = Boolean(existingDeliveredAt);
    const incomingRank = getShipmentStatusRank(event.status);
    const currentRank = getShipmentStatusRank(currentStatus);

    const isStaleEvent =
      isCurrentlyDelivered &&
      incomingRank < currentRank &&
      event.timestamp.getTime() <= (existingDeliveredAt ? new Date(existingDeliveredAt).getTime() : Date.now());

    if (isStaleEvent) {
      logger.info("Stale/out-of-order courier event ignored (package already confirmed delivered)", {
        module: "CourierService",
        trackingId: event.trackingId,
        incomingStatus: event.status,
        currentStatus: "DELIVERED",
        correlationId,
        requestId,
      });
    } else {
      // Update in-memory Delivery
      if (dispute.order) {
        dispute.order.delivery = {
          courier: adapter.displayName,
          trackingId: event.trackingId,
          deliveredAt:
            event.status === "DELIVERED"
              ? event.timestamp
              : event.status === "RETURNED" || event.status === "FAILED_DELIVERY"
              ? null
              : existingDelivery?.deliveredAt || null,
          deliveredToAddress:
            event.deliveredToAddress ||
            existingDelivery?.deliveredToAddress ||
            dispute.order.customer?.address ||
            "Verified Destination Address",
          signatureCaptured:
            event.signatureCaptured ??
            (event.status === "DELIVERED" ? true : false),
        };
      }

      // Update or attach EvidenceItem (shipping_proof)
      const existingProofIndex = dispute.evidenceItems.findIndex(
        (e) => e.type === "shipping_proof"
      );

      if (event.status === "DELIVERED") {
        // STRICT FORENSIC INTEGRITY: Only attach podDocumentRef if genuinely present
        const hasRealPod = Boolean(event.podDocumentRef && event.podDocumentRef.trim().length > 0);
        podAvailable = hasRealPod;

        const shippingProof = {
          id: `evi_shipping_${event.trackingId}`,
          type: "shipping_proof",
          present: true,
          documentRef: hasRealPod ? event.podDocumentRef : undefined,
          note: hasRealPod
            ? `Delivered on ${event.timestamp.toLocaleDateString("en-IN")} via ${
                adapter.displayName
              } (AWB: ${event.trackingId}). POD document verified.${
                event.signatureCaptured ? " Recipient OTP/Signature verified." : ""
              }`
            : `Delivered on ${event.timestamp.toLocaleDateString("en-IN")} via ${
                adapter.displayName
              } (AWB: ${event.trackingId}). Carrier delivery confirmation on file (No POD document attached).`,
        };

        if (existingProofIndex >= 0) {
          dispute.evidenceItems[existingProofIndex] = shippingProof;
        } else {
          dispute.evidenceItems.push(shippingProof);
        }
        evidenceAttached = true;
      } else if (event.status === "RETURNED" || event.status === "FAILED_DELIVERY") {
        if (existingProofIndex >= 0) {
          dispute.evidenceItems[existingProofIndex].present = false;
          dispute.evidenceItems[existingProofIndex].note =
            event.status === "RETURNED"
              ? `Package returned to origin (RTO) on ${event.timestamp.toLocaleDateString("en-IN")}`
              : `Delivery attempt failed on ${event.timestamp.toLocaleDateString("en-IN")}`;
        }
      }

      // 7. Automated Downstream Scoring & Fraud Recomputation
      try {
        const calculatedWinnability = computeWinnability(
          dispute,
          dispute.evidenceItems,
          dispute.order?.customer
        );
        newScore = calculatedWinnability.score;
        scoreRecomputed = true;

        const calculatedFraud = computeFraudSignal(dispute, dispute.evidenceItems);

        // Record scoring recalculation in immutable audit ledger
        await AuditService.record({
          eventType: "SCORE_RECOMPUTED",
          action: "WINNABILITY_UPDATED_VIA_COURIER_EVIDENCE",
          actorType: "system",
          disputeId: dispute.id,
          requestId,
          correlationId,
          metadata: {
            previousStatus: currentStatus,
            newStatus: event.status,
            recomputedScore: calculatedWinnability.score,
            band: calculatedWinnability.band,
            recommendation: calculatedWinnability.recommendation,
            fraudScore: calculatedFraud.score,
            fraudBand: calculatedFraud.band,
            podAvailable,
          },
        });
      } catch (scoreErr) {
        logger.warn("Automated scoring recomputation failed after courier update", {
          module: "CourierService",
          disputeId: dispute.id,
          error: scoreErr instanceof Error ? scoreErr.message : String(scoreErr),
        });
      }
    }
  }

  // 8. Record in Database if not running purely in-memory test
  if (!isTest) {
    try {
      await prisma.webhookEvent.create({
        data: {
          disputeId: matchedDisputeId || null,
          eventType: `courier.${adapter.providerId}.${event.status.toLowerCase()}`,
          signatureVerified: Boolean(webhookSecret),
          payloadHash,
          rawHeaders: JSON.stringify({ provider: adapter.providerId }),
          status: "processed",
          payload: JSON.stringify({
            provider: adapter.providerId,
            trackingId: event.trackingId,
            status: event.status,
            timestamp: event.timestamp,
            hasPod: Boolean(event.podDocumentRef),
          }), // bounded sanitized payload
        },
      });

      if (matchedOrderId) {
        await prisma.delivery.upsert({
          where: { orderId: matchedOrderId },
          create: {
            orderId: matchedOrderId,
            courier: adapter.displayName,
            trackingId: event.trackingId,
            deliveredAt: event.status === "DELIVERED" ? event.timestamp : null,
            deliveredToAddress:
              event.deliveredToAddress || "Verified Delivery Address",
            signatureCaptured: event.signatureCaptured ?? (event.status === "DELIVERED"),
          },
          update: {
            courier: adapter.displayName,
            trackingId: event.trackingId,
            deliveredAt: event.status === "DELIVERED" ? event.timestamp : null,
            signatureCaptured: event.signatureCaptured ?? (event.status === "DELIVERED"),
          },
        });
      }
    } catch (dbErr) {
      logger.warn("Database sync skipped for courier event, handled in memory", {
        module: "CourierService",
        correlationId,
        requestId,
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      });
    }
  }

  // Record In-Memory Event for idempotency
  addInMemoryWebhookEvent({
    id: `evt_courier_${event.eventId}`,
    disputeId: matchedDisputeId || null,
    eventType: `courier.${adapter.providerId}.${event.status.toLowerCase()}`,
    signatureVerified: Boolean(webhookSecret),
    payloadHash,
    receivedAt: new Date(),
    status: "processed",
    createdAt: new Date(),
  });

  // 9. Record Immutable Financial Audit Event
  await AuditService.record({
    eventType: "WEBHOOK_RECEIVED",
    action: "COURIER_SHIPMENT_UPDATED",
    actorType: "webhook",
    actorId: `3pl_${adapter.providerId}`,
    disputeId: matchedDisputeId,
    requestId,
    correlationId,
    ipAddress,
    userAgent,
    metadata: {
      provider: adapter.providerId,
      trackingId: event.trackingId,
      status: event.status,
      rawStatus: event.rawStatus,
      orderId: matchedOrderId || event.orderId,
      evidenceAttached,
      signatureCaptured: event.signatureCaptured,
      podAvailable,
      source: event.source,
      scoreRecomputed,
      newScore,
    },
  });

  logger.info("Courier shipment update processed successfully", {
    module: "CourierService",
    provider: adapter.providerId,
    trackingId: event.trackingId,
    canonicalStatus: event.status,
    disputeId: matchedDisputeId,
    evidenceAttached,
    podAvailable,
    scoreRecomputed,
    newScore,
    correlationId,
    requestId,
  });

  return {
    status: "processed",
    provider: adapter.providerId,
    trackingId: event.trackingId,
    orderId: matchedOrderId || event.orderId,
    disputeId: matchedDisputeId,
    shipmentStatus: event.status,
    evidenceAttached,
    podAvailable,
    scoreRecomputed,
    newScore,
    message: `Shipment update for AWB ${event.trackingId} processed successfully (${event.status})`,
  };
}

/**
 * On-demand tracking synchronization for a specific dispute.
 */
export async function syncTrackingForDispute(
  disputeId: string,
  customTrackingId?: string,
  providerId?: string
): Promise<{
  success: boolean;
  disputeId: string;
  trackingId?: string;
  status?: string;
  evidenceAttached?: boolean;
}> {
  const dispute = getInMemoryDisputeById(disputeId);
  if (!dispute) {
    throw new Error(`Dispute ${disputeId} not found`);
  }

  const trackingId = customTrackingId || dispute.order?.delivery?.trackingId;
  if (!trackingId) {
    throw new Error(`No tracking/AWB ID found for dispute ${disputeId}`);
  }

  const adapter = getCourierAdapter(providerId);
  const normalized = await adapter.fetchTracking(trackingId);

  // Synthesize normalized event
  const syntheticRawBody = JSON.stringify({
    trackingId: normalized.trackingId,
    status: normalized.status,
    timestamp: normalized.deliveredAt || new Date(),
    orderId: dispute.orderId,
    signatureCaptured: normalized.signatureCaptured,
    podDocumentRef: normalized.podDocumentRef,
  });

  const result = await processCourierWebhook({
    rawBody: syntheticRawBody,
    providerId: adapter.providerId,
  });

  return {
    success: result.status === "processed" || result.status === "duplicate",
    disputeId,
    trackingId: normalized.trackingId,
    status: normalized.status,
    evidenceAttached: result.evidenceAttached,
  };
}
