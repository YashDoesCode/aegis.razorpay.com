import { NextRequest } from "next/server";
import { connectMerchantAccount } from "@/lib/merchantAccount";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { AuditService, extractTraceContext } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ConnectBodySchema = z.object({
  keyId: z.string().trim().refine((val) => val.startsWith("rzp_live_") || val.startsWith("rzp_test_"), {
    message: "Invalid Key ID format. Razorpay Key ID must start with rzp_live_ or rzp_test_",
  }),
  keySecret: z.string().trim().min(8, { message: "Key secret must be at least 8 characters" }),
  merchantName: z.string().trim().max(100).optional(),
});

export async function POST(request: NextRequest) {
  const trace = extractTraceContext(request);
  const { correlationId, requestId, ipAddress, userAgent } = trace;

  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = ConnectBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Invalid input parameters";
      return apiError(firstIssue, 400, "VALIDATION_FAILED");
    }

    const { keyId, keySecret, merchantName } = parsed.data;

    logger.info("Connecting merchant account", {
      module: "ApiMerchantConnect",
      correlationId,
      requestId,
      maskedKey: `${keyId.slice(0, 8)}...`,
    });

    const result = await connectMerchantAccount({
      keyId,
      keySecret,
      merchantName,
    });

    if (!result.ok) {
      return apiError(result.error || "Failed to authenticate with Razorpay API", 401, "AUTH_FAILED");
    }

    const connectedMode = keyId.startsWith("rzp_live_") ? "live" : "test";
    const merchantId = result.merchant?.merchantId;

    await AuditService.record({
      eventType: "MERCHANT_CONNECTED",
      action: "MERCHANT_CONNECTED",
      actorType: "merchant",
      actorId: merchantId,
      source: "ui",
      merchantId,
      correlationId,
      requestId,
      ipAddress,
      userAgent,
      metadata: {
        mode: connectedMode,
        maskedKeyId: `${keyId.slice(0, 8)}...`,
        merchantName: result.merchant?.name,
      },
    });

    await AuditService.record({
      eventType: connectedMode === "live" ? "LIVE_MODE_ENABLED" : "TEST_MODE_ENABLED",
      action: connectedMode === "live" ? "LIVE_MODE_ENABLED" : "TEST_MODE_ENABLED",
      actorType: "merchant",
      actorId: merchantId,
      source: "ui",
      merchantId,
      correlationId,
      requestId,
      ipAddress,
      userAgent,
      metadata: {
        mode: connectedMode,
      },
    });

    return apiSuccess({
      message: "Razorpay merchant account connected successfully",
      merchant: result.merchant,
    }, 200);
  } catch (error: unknown) {
    logger.error("Error in POST /api/merchant/connect", error, {
      module: "ApiMerchantConnect",
      correlationId,
      requestId,
    });
    return apiError("Internal error connecting merchant account", 500, "INTERNAL_ERROR");
  }
}
