import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability, getReasonCodeDefinition } from "@/lib/scoring";
import { getInMemoryDisputeById } from "@/lib/mockStore";
import { fetchDispute } from "@/lib/razorpay";
import { computeFraudSignal } from "@/lib/fraudSignal";
import { DisputeWithRelations } from "@/lib/types/domain";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { extractTraceContext } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const trace = extractTraceContext(request);
  const { correlationId, requestId } = trace;

  try {
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "test").toLowerCase() as "test" | "live";

    if (searchParams.get("forceError") === "500") {
      return apiError("Simulated database connection failure (500)", 500, "SIMULATED_FAILURE");
    }

    const resolvedParams = await context.params;
    const id = resolvedParams?.id?.trim();

    if (!id) {
      return apiError("Dispute ID is required", 400, "INVALID_ID");
    }

    let dispute: DisputeWithRelations | null = null;

    if (mode === "live") {
      // In Live mode: check memory or fetch directly from Razorpay API
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
            module: "ApiDisputeDetail",
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
        logger.warn(`Database unreachable for dispute ${id}, using mock store`, {
          module: "ApiDisputeDetail",
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

    const customer = dispute.order?.customer;
    const evidenceItems = dispute.evidenceItems || [];
    const winnability = computeWinnability(
      dispute,
      evidenceItems,
      customer
    );
    const reasonDefinition = getReasonCodeDefinition(dispute.reasonCode);
    const fraudSignal = computeFraudSignal(
      dispute,
      evidenceItems,
      customer
    );

    return apiSuccess(
      {
        ...dispute,
        mode,
        winnability,
        fraudSignal,
        reasonDefinition,
      },
      200
    );
  } catch (error: unknown) {
    logger.error("Error in GET /api/disputes/[id]", error, {
      module: "ApiDisputeDetail",
      correlationId,
      requestId,
    });
    return apiError("Internal server error fetching dispute detail", 500, "INTERNAL_ERROR");
  }
}
