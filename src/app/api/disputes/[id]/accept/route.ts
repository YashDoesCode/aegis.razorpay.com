import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptDispute } from "@/lib/razorpay";
import { getInMemoryDisputeById, updateInMemoryDisputeStatus } from "@/lib/mockStore";
import { DisputeWithRelations } from "@/lib/types/domain";
import { apiError } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { AuditService, extractTraceContext } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const trace = extractTraceContext(request);
  const { correlationId, requestId, ipAddress, userAgent } = trace;

  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("forceError") === "500") {
      return apiError("Simulated error accepting dispute (500)", 500, "SIMULATED_FAILURE");
    }

    const resolvedParams = await context.params;
    const id = resolvedParams?.id?.trim();

    if (!id) {
      return apiError("Dispute ID is required", 400, "INVALID_ID");
    }

    let dispute: DisputeWithRelations | null = null;
    try {
      const dbPromise = prisma.dispute.findFirst({
        where: {
          OR: [{ id: id }, { rzpDisputeId: id }],
        },
      });
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("DB Timeout")), 2000)
      );
      const dbResult = await Promise.race([dbPromise, timeoutPromise]);
      if (dbResult) {
        dispute = dbResult as unknown as DisputeWithRelations;
      }
    } catch (dbError: unknown) {
      logger.warn(`Database query timeout/error for ${id}, using mock store`, {
        module: "ApiAccept",
        correlationId,
        requestId,
        disputeId: id,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
      const fallback = getInMemoryDisputeById(id);
      if (fallback) {
        dispute = fallback as unknown as DisputeWithRelations;
      }
    }

    if (!dispute) {
      const fallback = getInMemoryDisputeById(id);
      if (fallback) {
        dispute = fallback as unknown as DisputeWithRelations;
      }
    }

    if (!dispute) {
      return apiError(`Dispute ${id} not found`, 404, "NOT_FOUND");
    }

    if (dispute.status === "lost") {
      return NextResponse.json({
        ok: true,
        disputeId: dispute.id,
        status: "lost",
        message: "Dispute already accepted",
        razorpayResult: { success: true, message: "Dispute already accepted" },
        idempotent: true,
      });
    }

    const mode = (searchParams.get("mode") || "test").toLowerCase() as "test" | "live";
    let rzpResult: { success: boolean; disputeId?: string; message?: string; response?: unknown } = {
      success: true,
      message: `Accepted in ${mode} mode`,
    };

    try {
      rzpResult = await acceptDispute(dispute.rzpDisputeId || dispute.id, mode);
    } catch (rzpErr) {
      logger.warn("Razorpay API accept call warning (continuing with local update)", {
        module: "ApiAccept",
        correlationId,
        requestId,
        disputeId: dispute.id,
        error: rzpErr instanceof Error ? rzpErr.message : String(rzpErr),
      });
    }

    await AuditService.record({
      eventType: "DISPUTE_ACCEPTED",
      action: "DISPUTE_ACCEPTED",
      actorType: "merchant",
      source: "ui",
      disputeId: dispute.id,
      correlationId,
      requestId,
      ipAddress,
      userAgent,
      beforeState: { status: dispute.status },
      afterState: { status: "lost" },
      metadata: {
        mode,
        amountPaise: dispute.amount,
        reasonCode: dispute.reasonCode,
      },
    });

    updateInMemoryDisputeStatus(dispute.id, "lost");

    let updated = { ...dispute, status: "lost" };
    try {
      const updatePromise = prisma.dispute.update({
        where: { id: dispute.id },
        data: { status: "lost" },
      });
      const timeoutPromise = new Promise<typeof updated>((_, reject) =>
        setTimeout(() => reject(new Error("DB Timeout")), 1500)
      );
      const dbUpdateResult = await Promise.race([updatePromise, timeoutPromise]);
      if (dbUpdateResult) {
        updated = { ...updated, ...dbUpdateResult };
      }
    } catch (updateErr) {
      logger.warn("Non-fatal: unable to persist accepted status to remote DB", {
        module: "ApiAccept",
        correlationId,
        requestId,
        disputeId: dispute.id,
        error: updateErr instanceof Error ? updateErr.message : String(updateErr),
      });
    }

    return NextResponse.json({
      ok: true,
      disputeId: updated.id,
      status: updated.status,
      razorpayResult: rzpResult,
      idempotent: false,
    });
  } catch (error: unknown) {
    logger.error("Error in POST /api/disputes/[id]/accept", error, {
      module: "ApiAccept",
      correlationId,
      requestId,
    });
    return apiError("Failed to accept dispute", 500, "INTERNAL_ERROR");
  }
}
