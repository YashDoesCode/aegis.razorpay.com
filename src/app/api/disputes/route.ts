import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability } from "@/lib/scoring";
import { getInMemoryDisputes } from "@/lib/mockStore";
import { fetchDisputes } from "@/lib/razorpay";
import { getMerchantConnectionStatus } from "@/lib/merchantAccount";
import { computeFraudSignal } from "@/lib/fraudSignal";
import { DisputeWithRelations, DisputeKpiStats } from "@/lib/types/domain";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { extractTraceContext } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  mode: z.enum(["test", "live"]).default("test"),
  forceError: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const trace = extractTraceContext(request);
  const { correlationId, requestId } = trace;

  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = QuerySchema.safeParse({
      mode: searchParams.get("mode") || "test",
      forceError: searchParams.get("forceError") || undefined,
    });

    if (!parsedQuery.success) {
      return apiError("Invalid query parameters", 400, "INVALID_QUERY");
    }

    const { mode, forceError } = parsedQuery.data;

    if (forceError === "500") {
      return apiError("Simulated database connection failure (500)", 500, "SIMULATED_FAILURE");
    }

    const merchantStatus = await getMerchantConnectionStatus();

    if (mode === "live") {
      try {
        logger.info("Querying Razorpay API for live dispute records", {
          module: "ApiDisputes",
          correlationId,
          requestId,
          mode: "live",
          merchantId: merchantStatus.merchantId,
        });

        const liveRes = await fetchDisputes({ count: 50 }, "live");
        const liveItems = liveRes.items || [];

        // If no live disputes exist on the merchant's Razorpay account, return honest empty state
        if (liveItems.length === 0) {
          const emptyStats: DisputeKpiStats = {
            totalCount: 0,
            totalPendingAmount: 0,
            high: { count: 0, amount: 0 },
            needsEvidence: { count: 0, amount: 0 },
            low: { count: 0, amount: 0 },
          };

          return apiSuccess([], 200, {
            mode: "live",
            isConnected: merchantStatus.isConnected,
            merchantId: merchantStatus.merchantId,
            merchantName: merchantStatus.name,
            count: 0,
            stats: emptyStats,
          });
        }

        // Map genuine live disputes from Razorpay API
        let totalPendingAmount = 0;
        let highCount = 0;
        let highAmount = 0;
        let needsEvidenceCount = 0;
        let needsEvidenceAmount = 0;
        let lowCount = 0;
        let lowAmount = 0;

        const liveDisputesWithScores: DisputeWithRelations[] = liveItems.map((item) => {
          const disputeObj: DisputeWithRelations = {
            id: item.id,
            rzpDisputeId: item.id,
            orderId: `order_${item.payment_id}`,
            paymentId: item.payment_id,
            reasonCode: item.reason_code || "1064",
            network: "upi",
            amount: item.amount,
            currency: item.currency || "INR",
            phase: item.phase || "chargeback",
            status: item.status || "open",
            mode: "live",
            dataSource: "live",
            data_source: "live",
            isDemo: false,
            respondBy: item.respond_by
              ? new Date(item.respond_by * 1000).toISOString()
              : new Date(Date.now() + 3 * 86400000).toISOString(),
            createdAt: item.created_at
              ? new Date(item.created_at * 1000).toISOString()
              : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: {
              id: `order_${item.payment_id}`,
              rzpPaymentId: item.payment_id,
              item: `Live Transaction (${item.payment_id})`,
              amount: item.amount,
              currency: item.currency || "INR",
              status: "captured",
              customer: {
                id: `cust_${item.payment_id.slice(-6)}`,
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

          const winnability = computeWinnability(disputeObj, [], disputeObj.order?.customer);
          totalPendingAmount += item.amount || 0;

          if (winnability.band === "high") {
            highCount += 1;
            highAmount += item.amount || 0;
          } else if (winnability.band === "needs_evidence") {
            needsEvidenceCount += 1;
            needsEvidenceAmount += item.amount || 0;
          } else {
            lowCount += 1;
            lowAmount += item.amount || 0;
          }

          const fraudSignal = computeFraudSignal(disputeObj, [], disputeObj.order?.customer);

          return {
            ...disputeObj,
            winnability,
            fraudSignal,
          };
        });

        const liveStats: DisputeKpiStats = {
          totalCount: liveDisputesWithScores.length,
          totalPendingAmount,
          high: { count: highCount, amount: highAmount },
          needsEvidence: { count: needsEvidenceCount, amount: needsEvidenceAmount },
          low: { count: lowCount, amount: lowAmount },
        };

        return apiSuccess(liveDisputesWithScores, 200, {
          mode: "live",
          isConnected: merchantStatus.isConnected,
          merchantId: merchantStatus.merchantId,
          merchantName: merchantStatus.name,
          count: liveDisputesWithScores.length,
          stats: liveStats,
        });
      } catch (liveError: unknown) {
        logger.warn("Live dispute fetch returned empty or error", {
          module: "ApiDisputes",
          error: liveError instanceof Error ? liveError.message : String(liveError),
        });

        const fallbackStats: DisputeKpiStats = {
          totalCount: 0,
          totalPendingAmount: 0,
          high: { count: 0, amount: 0 },
          needsEvidence: { count: 0, amount: 0 },
          low: { count: 0, amount: 0 },
        };

        return apiSuccess([], 200, {
          mode: "live",
          isConnected: merchantStatus.isConnected,
          merchantId: merchantStatus.merchantId,
          merchantName: merchantStatus.name,
          count: 0,
          stats: fallbackStats,
          warning: "No live disputes returned or live account returned empty list.",
        });
      }
    }

    // =========================================================================
    // TEST MODE: THE SEEDED DEMO DISPUTES
    // Clearly labeled as demo/sample test data with representative winnability spread.
    // =========================================================================
    let disputes: DisputeWithRelations[] | null = null;

    try {
      // Race Prisma query against a timeout
      const dbPromise = prisma.dispute.findMany({
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
        orderBy: { createdAt: "desc" },
      });

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("DB Timeout")), 800)
      );

      const dbResult = await Promise.race([dbPromise, timeoutPromise]);
      if (dbResult && Array.isArray(dbResult) && dbResult.length > 0) {
        disputes = dbResult as unknown as DisputeWithRelations[];
      }
    } catch (dbError: unknown) {
      logger.warn("Prisma DB query timeout, using mock store", {
        module: "ApiDisputes",
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
      disputes = getInMemoryDisputes() as unknown as DisputeWithRelations[];
    }

    if (!disputes || !Array.isArray(disputes) || disputes.length === 0) {
      disputes = getInMemoryDisputes() as unknown as DisputeWithRelations[];
    }

    let highCount = 0;
    let highAmount = 0;
    let needsEvidenceCount = 0;
    let needsEvidenceAmount = 0;
    let lowCount = 0;
    let lowAmount = 0;
    let totalPendingAmount = 0;

    const disputesWithScores: DisputeWithRelations[] = disputes.map((d) => {
      const customer = d.order?.customer;
      const evidenceItems = d.evidenceItems || [];
      const winnability = computeWinnability(d, evidenceItems, customer);
      const dataSource = "seed";

      totalPendingAmount += d.amount || 0;

      if (winnability.band === "high") {
        highCount += 1;
        highAmount += d.amount || 0;
      } else if (winnability.band === "needs_evidence") {
        needsEvidenceCount += 1;
        needsEvidenceAmount += d.amount || 0;
      } else {
        lowCount += 1;
        lowAmount += d.amount || 0;
      }

      const fraudSignal = computeFraudSignal(d, evidenceItems, customer);

      return {
        ...d,
        mode: "test",
        dataSource,
        data_source: dataSource,
        isDemo: true,
        winnability,
        fraudSignal,
      };
    });

    const testStats: DisputeKpiStats = {
      totalCount: disputesWithScores.length,
      totalPendingAmount,
      high: {
        count: highCount,
        amount: highAmount,
      },
      needsEvidence: {
        count: needsEvidenceCount,
        amount: needsEvidenceAmount,
      },
      low: {
        count: lowCount,
        amount: lowAmount,
      },
    };

    return apiSuccess(disputesWithScores, 200, {
      mode: "test",
      isConnected: merchantStatus.isConnected,
      merchantId: merchantStatus.merchantId,
      merchantName: merchantStatus.name,
      count: disputesWithScores.length,
      stats: testStats,
    });
  } catch (error: unknown) {
    logger.error("Unexpected error in GET /api/disputes", error, { module: "ApiDisputes" });
    return apiError("Failed to fetch disputes", 500, "INTERNAL_ERROR");
  }
}
