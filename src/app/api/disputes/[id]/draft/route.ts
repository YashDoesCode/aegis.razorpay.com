import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability } from "@/lib/scoring";
import { draftRebuttal } from "@/lib/drafting";
import { contestDispute } from "@/lib/razorpay";
import { EvidenceType } from "@/lib/scoring/types";
import { getInMemoryDisputeById, updateInMemoryDisputeStatus } from "@/lib/mockStore";
import { DisputeWithRelations } from "@/lib/types/domain";
import { apiError } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { AuditService, extractTraceContext } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const DraftRequestBodySchema = z.object({
  customInstructions: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const trace = extractTraceContext(request);
  const { correlationId, requestId, ipAddress, userAgent } = trace;

  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("forceError") === "500") {
      return apiError("Simulated error during drafting (500)", 500, "SIMULATED_FAILURE");
    }

    const resolvedParams = await context.params;
    const id = resolvedParams?.id?.trim();

    if (!id) {
      return apiError("Dispute ID is required", 400, "INVALID_ID");
    }

    let customInstructions: string | undefined;
    try {
      const body = await request.json();
      const parsed = DraftRequestBodySchema.safeParse(body);
      if (parsed.success) {
        customInstructions = parsed.data.customInstructions;
      }
    } catch {
      // Optional body
    }

    let dispute: DisputeWithRelations | null = null;
    try {
      const dbPromise = prisma.dispute.findFirst({
        where: {
          OR: [{ id: id }, { rzpDisputeId: id }],
        },
        include: {
          order: {
            include: {
              customer: true,
              delivery: true,
              communications: true,
              refunds: true,
            },
          },
          evidenceItems: true,
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
        module: "ApiDraft",
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

    const customer = dispute.order?.customer;
    const evidenceItems = dispute.evidenceItems || [];

    const winnability = computeWinnability(dispute, evidenceItems, customer);

    await AuditService.record({
      eventType: "SCORE_RECOMPUTED",
      action: "SCORE_RECOMPUTED",
      actorType: "system",
      source: "api",
      disputeId: dispute.id,
      correlationId,
      requestId,
      ipAddress,
      userAgent,
      metadata: {
        score: winnability.score,
        band: winnability.band,
        recommendation: winnability.recommendation,
        reasonCode: dispute.reasonCode,
      },
    });

    const forceFallback = searchParams.get("forceFallback") === "true";
    const rebuttal = await draftRebuttal(
      {
        dispute,
        evidenceItems,
        winnability,
        customer,
        customInstructions,
      },
      { forceFallback }
    );

    if (rebuttal.source === "fallback" || forceFallback) {
      await AuditService.record({
        eventType: "SAFE_MODE_USED",
        action: "SAFE_MODE_USED",
        actorType: "system",
        source: "api",
        disputeId: dispute.id,
        correlationId,
        requestId,
        ipAddress,
        userAgent,
        metadata: {
          reason: "Deterministic fallback template engine activated",
        },
      });
    }

    await AuditService.record({
      eventType: "REBUTTAL_GENERATED",
      action: "REBUTTAL_GENERATED",
      actorType: "merchant",
      source: "ui",
      disputeId: dispute.id,
      correlationId,
      requestId,
      ipAddress,
      userAgent,
      metadata: {
        source: rebuttal.source || "fallback",
        rebuttalLength: rebuttal.summary?.length || 0,
        hasCustomInstructions: Boolean(customInstructions),
      },
    });

    const evidenceMap: Partial<Record<EvidenceType, string[]>> = {};
    for (const item of evidenceItems) {
      if (item.present) {
        const type = item.type as EvidenceType;
        const ref = item.documentRef || `doc_${item.id}`;
        if (!evidenceMap[type]) {
          evidenceMap[type] = [];
        }
        evidenceMap[type]?.push(ref);
      }
    }

    const mode = (searchParams.get("mode") || "test").toLowerCase() as "test" | "live";
    let rzpContestResult: Record<string, unknown> = {
      success: true,
      action: "draft",
      response: {
        dispute_id: dispute.rzpDisputeId || dispute.id,
        status: "draft",
        evidence: evidenceMap,
      },
    };

    try {
      const liveContest = await contestDispute(
        dispute.rzpDisputeId || dispute.id,
        {
          amount: dispute.amount,
          summary: rebuttal.summary,
          action: "draft",
          evidenceMap,
        },
        mode
      );
      if (liveContest) {
        rzpContestResult = liveContest as Record<string, unknown>;
      }
    } catch (rzpErr) {
      logger.warn("Razorpay contest API staging warning (proceeding with draft state)", {
        module: "ApiDraft",
        correlationId,
        requestId,
        disputeId: dispute.id,
        error: rzpErr instanceof Error ? rzpErr.message : String(rzpErr),
      });
    }

    await AuditService.record({
      eventType: "DRAFT_STAGED",
      action: "DRAFT_STAGED",
      actorType: "merchant",
      source: "ui",
      disputeId: dispute.id,
      correlationId,
      requestId,
      ipAddress,
      userAgent,
      beforeState: { status: dispute.status },
      afterState: { status: "under_review" },
      metadata: {
        mode,
        stagedAction: "draft",
        evidenceItemCount: Object.keys(evidenceMap).length,
      },
    });

    updateInMemoryDisputeStatus(dispute.id, "under_review");

    if (dispute.status === "open") {
      try {
        const updatePromise = prisma.dispute.update({
          where: { id: dispute.id },
          data: { status: "under_review" },
        });
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("DB Timeout")), 1500)
        );
        await Promise.race([updatePromise, timeoutPromise]);
      } catch (updateErr) {
        logger.warn("Non-fatal: unable to update dispute status in remote DB", {
          module: "ApiDraft",
          correlationId,
          requestId,
          disputeId: dispute.id,
          error: updateErr instanceof Error ? updateErr.message : String(updateErr),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      disputeId: dispute.id,
      winnability,
      draftedRebuttal: rebuttal,
      razorpayContestResult: rzpContestResult,
      mode: "draft",
      source: rebuttal.source || "fallback",
    });
  } catch (error: unknown) {
    logger.error("Error in POST /api/disputes/[id]/draft", error, {
      module: "ApiDraft",
      correlationId,
      requestId,
    });
    return apiError("Failed to draft dispute rebuttal", 500, "INTERNAL_ERROR");
  }
}
