import { NextRequest, NextResponse } from "next/server";
import { disconnectMerchantAccount } from "@/lib/merchantAccount";
import { AuditService, extractTraceContext } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const trace = extractTraceContext(request);
  const { correlationId, requestId, ipAddress, userAgent } = trace;

  try {
    await disconnectMerchantAccount();

    await AuditService.record({
      eventType: "MERCHANT_DISCONNECTED",
      action: "MERCHANT_DISCONNECTED",
      actorType: "merchant",
      source: "ui",
      correlationId,
      requestId,
      ipAddress,
      userAgent,
      metadata: {
        switchedMode: "test",
      },
    });

    await AuditService.record({
      eventType: "TEST_MODE_ENABLED",
      action: "TEST_MODE_ENABLED",
      actorType: "merchant",
      source: "ui",
      correlationId,
      requestId,
      ipAddress,
      userAgent,
      metadata: {
        mode: "test",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Merchant account disconnected successfully. Switched to Test Mode.",
      mode: "test",
    });
  } catch (error: unknown) {
    logger.error("Error in POST /api/merchant/disconnect", error, {
      module: "ApiMerchantDisconnect",
      correlationId,
      requestId,
    });
    return NextResponse.json(
      { ok: false, error: "Failed to disconnect merchant account" },
      { status: 500 }
    );
  }
}
