import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api/response";
import { verifyWebhookSignature } from "@/lib/webhooks/verifySignature";
import { RazorpayWebhookPayloadSchema } from "@/lib/webhooks/schemas";
import { processWebhookPayload } from "@/lib/webhooks/service";
import { extractTraceContext } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const trace = extractTraceContext(request);
  const { correlationId, requestId, ipAddress, userAgent } = trace;

  try {
    const signature = request.headers.get("x-razorpay-signature");
    const rawBody = await request.text();

    if (!rawBody || rawBody.trim() === "") {
      logger.warn("Webhook rejected: empty body", {
        module: "RazorpayWebhook",
        correlationId,
        requestId,
      });
      return apiError("Empty request body", 400, "EMPTY_BODY");
    }

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      process.env.RAZORPAY_KEY_SECRET ||
      "";

    const isSignatureValid = verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret
    );

    if (!isSignatureValid) {
      const durationMs = Date.now() - startTime;
      logger.warn("Webhook rejected: invalid or missing HMAC signature", {
        module: "RazorpayWebhook",
        correlationId,
        requestId,
        durationMs,
        signaturePresent: Boolean(signature),
      });
      return apiError("Invalid webhook signature", 401, "UNAUTHORIZED_WEBHOOK");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      const durationMs = Date.now() - startTime;
      logger.warn("Webhook rejected: malformed JSON payload", {
        module: "RazorpayWebhook",
        correlationId,
        requestId,
        durationMs,
      });
      return apiError("Malformed JSON payload", 400, "MALFORMED_JSON");
    }

    const validationResult = RazorpayWebhookPayloadSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      const durationMs = Date.now() - startTime;
      logger.warn("Webhook rejected: payload schema validation failed", {
        module: "RazorpayWebhook",
        correlationId,
        requestId,
        durationMs,
        issues: validationResult.error.issues.map((i) => i.message),
      });
      return apiError(
        "Invalid webhook payload schema",
        400,
        "SCHEMA_VALIDATION_ERROR"
      );
    }

    const rawHeaders = JSON.stringify(
      Object.fromEntries(request.headers.entries())
    );

    const result = await processWebhookPayload({
      payload: validationResult.data,
      rawBody,
      rawHeaders,
      signatureVerified: true,
      requestId,
      correlationId,
      ipAddress,
      userAgent,
    });

    const durationMs = Date.now() - startTime;
    logger.info("Webhook handled successfully", {
      module: "RazorpayWebhook",
      correlationId,
      requestId,
      durationMs,
      status: result.status,
      eventType: result.eventType,
      disputeId: result.disputeId,
    });

    if (result.status === "duplicate") {
      return NextResponse.json(
        {
          ok: true,
          status: "duplicate",
          message: result.message,
          disputeId: result.disputeId,
          eventType: result.eventType,
        },
        { status: 200 }
      );
    }

    if (result.status === "ignored") {
      return NextResponse.json(
        {
          ok: true,
          status: "ignored",
          message: result.message,
          eventType: result.eventType,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: "processed",
        message: result.message,
        disputeId: result.disputeId,
        eventType: result.eventType,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    logger.error("Unhandled exception during webhook processing", error, {
      module: "RazorpayWebhook",
      requestId,
      durationMs,
    });
    return apiError("Internal webhook error", 500, "INTERNAL_ERROR");
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
      error: "Method Not Allowed. Razorpay webhooks only support POST requests.",
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
