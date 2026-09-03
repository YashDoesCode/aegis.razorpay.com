import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api/response";
import { extractTraceContext } from "@/lib/audit";
import { processCourierWebhook } from "@/lib/courier";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const trace = extractTraceContext(request);
  const { correlationId, requestId, ipAddress, userAgent } = trace;

  try {
    const rawBody = await request.text();

    if (!rawBody || rawBody.trim() === "") {
      logger.warn("Courier webhook rejected: empty request body", {
        module: "CourierWebhookRoute",
        correlationId,
        requestId,
      });
      return apiError("Empty request body", 400, "EMPTY_BODY");
    }

    // Resolve provider from header or query param
    const url = new URL(request.url);
    const providerParam =
      url.searchParams.get("provider") ||
      request.headers.get("x-courier-provider") ||
      request.headers.get("x-provider") ||
      undefined;

    // Resolve signature from carrier headers
    const signature =
      request.headers.get("x-courier-signature") ||
      request.headers.get("x-delhivery-signature") ||
      request.headers.get("x-signature") ||
      null;

    const result = await processCourierWebhook({
      rawBody,
      signature,
      providerId: providerParam,
      requestId,
      correlationId,
      ipAddress,
      userAgent,
    });

    const durationMs = Date.now() - startTime;

    if (result.status === "error") {
      logger.warn("Courier webhook processing failed", {
        module: "CourierWebhookRoute",
        correlationId,
        requestId,
        durationMs,
        provider: result.provider,
        message: result.message,
      });

      if (result.message.includes("signature") || result.message.includes("Unauthorized")) {
        return apiError("Invalid or missing webhook signature", 401, "UNAUTHORIZED_WEBHOOK");
      }

      return apiError(result.message, 400, "COURIER_PROCESSING_ERROR");
    }

    logger.info("Courier webhook processed successfully", {
      module: "CourierWebhookRoute",
      correlationId,
      requestId,
      durationMs,
      provider: result.provider,
      trackingId: result.trackingId,
      disputeId: result.disputeId,
      shipmentStatus: result.shipmentStatus,
      status: result.status,
    });

    return NextResponse.json(
      {
        ok: true,
        status: result.status,
        provider: result.provider,
        trackingId: result.trackingId,
        disputeId: result.disputeId,
        shipmentStatus: result.shipmentStatus,
        evidenceAttached: result.evidenceAttached,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    logger.error("Unhandled exception during courier webhook handling", error, {
      module: "CourierWebhookRoute",
      requestId,
      durationMs,
    });
    return apiError("Internal courier webhook error", 500, "INTERNAL_ERROR");
  }
}

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

function methodNotAllowed(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "Method Not Allowed. 3PL courier webhooks only support POST requests.",
      timestamp: new Date().toISOString(),
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
      },
    }
  );
}
