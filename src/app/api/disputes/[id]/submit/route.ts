import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability } from "@/lib/scoring";
import { draftRebuttal } from "@/lib/drafting";
import { contestDispute, fetchDispute } from "@/lib/razorpay";
import { EvidenceType } from "@/lib/scoring/types";
import { getInMemoryDisputeById, updateInMemoryDisputeStatus } from "@/lib/mockStore";
import { DisputeWithRelations } from "@/lib/types/domain";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { AuditService, extractTraceContext } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SubmitRequestBodySchema = z.object({
  summary: z.string().max(2000).optional(),
  customInstructions: z.string().max(1000).optional(),
  evidenceMap: z.record(z.string(), z.array(z.string())).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const trace = extractTraceContext(request);
  const { correlationId, requestId, ipAddress, userAgent } = trace;

  try {
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "test").toLowerCase() as "test" | "live";

    if (searchParams.get("forceError") === "500") {
      return apiError("Simulated error during dispute submission (500)", 500, "SIMULATED_FAILURE");
    }

    const resolvedParams = await context.params;
    const id = resolvedParams?.id?.trim();

    if (!id) {
      return apiError("Dispute ID is required", 400, "INVALID_ID");
    }

    let requestBody: z.infer<typeof SubmitRequestBodySchema> = {};
    try {
      const json = await request.json();
      const parsed = SubmitRequestBodySchema.safeParse(json);
      if (parsed.success) {
        requestBody = parsed.data;
      }
    } catch {
    }

    let dispute: DisputeWithRelations | null = null;

    if (mode === "live") {
      const cached = getInMemoryDisputeById(id);
      if (cached) {
        dispute = cached as unknown as DisputeWithRelations;
      }

      if (!dispute) {
        try {
          const liveRzp = await fetchDispute(id, "live");
          if (liveRzp && liveRzp.id) {
            dispute = {
              id: liveRzp.id,
              rzpDisputeId: liveRzp.id,
              orderId: `order_${liveRzp.payment_id}`,
              paymentId: liveRzp.payment_id,
              reasonCode: liveRzp.reason_code || "1064",
              network: "upi",
              amount: liveRzp.amount,
              currency: liveRzp.currency || "INR",
              phase: liveRzp.phase || "chargeback",
              status: liveRzp.status || "open",
              mode: "live",
              dataSource: "live",
              data_source: "live",
              isDemo: false,
              respondBy: liveRzp.respond_by
                ? new Date(liveRzp.respond_by * 1000).toISOString()
                : new Date(Date.now() + 3 * 86400000).toISOString(),
              createdAt: liveRzp.created_at
                ? new Date(liveRzp.created_at * 1000).toISOString()
                : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              order: {
                id: `order_${liveRzp.payment_id}`,
                rzpPaymentId: liveRzp.payment_id,
                item: `Live Payment (${liveRzp.payment_id})`,
                amount: liveRzp.amount,
                currency: liveRzp.currency || "INR",
                status: "captured",
                customer: {
                  id: `cust_${liveRzp.payment_id.slice(-6)}`,
                  name: "Verified Razorpay Customer",
                  email: "customer@live-razorpay.in",
                  address: "India",
                  priorOrdersCount: 1,
                  priorDisputesCount: 0,
                },
                delivery: null,
                communications: [],
                refunds: [],
              },
              evidenceItems: [],
            };
          }
        } catch (liveFetchErr) {
          logger.warn(`Live dispute fetch error for ID ${id}`, {
            module: "ApiSubmit",
            correlationId,
            requestId,
            disputeId: id,
            error: liveFetchErr instanceof Error ? liveFetchErr.message : String(liveFetchErr),
          });
        }
      }
    } else {
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
        logger.warn(`Database query error for ${id}, using mock store`, {
          module: "ApiSubmit",
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
    }

    if (!dispute) {
      return apiError(`Dispute ${id} not found`, 404, "NOT_FOUND");
    }

    if (["won", "lost", "accepted"].includes(dispute.status)) {
      return apiError(`Dispute ${id} is already ${dispute.status} and cannot be submitted`, 400, "DISPUTE_FINALIZED");
    }

    const customer = dispute.order?.customer;
    const evidenceItems = dispute.evidenceItems || [];
    const winnability = computeWinnability(dispute, evidenceItems, customer);

    let rebuttalSummary = requestBody.summary;
    if (!rebuttalSummary) {
      const forceFallback = searchParams.get("forceFallback") === "true";
      const draftResult = await draftRebuttal(
        {
          dispute,
          evidenceItems,
          winnability,
          customer,
          customInstructions: requestBody.customInstructions,
        },
        { forceFallback }
      );
      rebuttalSummary = draftResult.summary;
    }

    const evidenceMap: Partial<Record<EvidenceType, string[]>> = requestBody.evidenceMap as Partial<Record<EvidenceType, string[]>> || {};
    if (Object.keys(evidenceMap).length === 0) {
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
    }

    const contestResult = await contestDispute(
      dispute.rzpDisputeId || dispute.id,
      {
        amount: dispute.amount,
        summary: rebuttalSummary || `Dispute defense rebuttal for reason code ${dispute.reasonCode}`,
        action: "submit",
        evidenceMap,
      },
      mode
    );

    const previousStatus = dispute.status;
    const newStatus = "under_review";

    try {
      await prisma.dispute.updateMany({
        where: {
          OR: [{ id: dispute.id }, { rzpDisputeId: dispute.id }],
        },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
      });
    } catch (dbUpdateError: unknown) {
      logger.warn(`Failed to persist dispute status update in DB for ${dispute.id}`, {
        module: "ApiSubmit",
        correlationId,
        requestId,
        error: dbUpdateError instanceof Error ? dbUpdateError.message : String(dbUpdateError),
      });
    }

    updateInMemoryDisputeStatus(dispute.id, newStatus);
    if (dispute.rzpDisputeId) {
      updateInMemoryDisputeStatus(dispute.rzpDisputeId, newStatus);
    }

    await AuditService.record({
      eventType: "DISPUTE_CONTESTED",
      action: "DISPUTE_CONTESTED",
      actorType: "merchant",
      source: "ui",
      disputeId: dispute.id,
      correlationId,
      requestId,
      ipAddress,
      userAgent,
      beforeState: { status: previousStatus },
      afterState: { status: newStatus },
      metadata: {
        amount: dispute.amount,
        reasonCode: dispute.reasonCode,
        mode,
        contestMode: contestResult.mode,
        evidenceTypes: Object.keys(evidenceMap),
      },
    });

    logger.info(`Dispute ${dispute.id} contested and submitted successfully`, {
      module: "ApiSubmit",
      correlationId,
      requestId,
      disputeId: dispute.id,
      previousStatus,
      newStatus,
      mode,
    });

    return apiSuccess(
      {
        ok: true,
        disputeId: dispute.id,
        status: newStatus,
        contestResult,
        mode,
      },
      200
    );
  } catch (error: unknown) {
    logger.error("Error submitting dispute contest in POST /api/disputes/[id]/submit", error, {
      module: "ApiSubmit",
      correlationId,
      requestId,
    });
    return apiError("Internal server error submitting dispute rebuttal", 500, "INTERNAL_ERROR");
  }
}
