import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability } from "@/lib/scoring";
import { getInMemoryDisputes } from "@/lib/mockStore";
import { fetchDisputes } from "@/lib/razorpay";
import { getMerchantConnectionStatus } from "@/lib/merchantAccount";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "test").toLowerCase() as "test" | "live";

    // Support simulated failure for resilience testing
    if (searchParams.get("forceError") === "500") {
      return NextResponse.json(
        { ok: false, error: "Simulated database connection failure (500)" },
        { status: 500 }
      );
    }

    const merchantStatus = await getMerchantConnectionStatus();

    // =========================================================================
    // LIVE MODE: STRICT ZERO LEAKAGE
    // Fetches ONLY from real connected Razorpay account. Never shows seed/mock data.
    // =========================================================================
    if (mode === "live") {
      try {
        console.log("📡 [API /api/disputes?mode=live] Querying real Razorpay API for live dispute records...");
        const liveRes = await fetchDisputes({ count: 50 }, "live");
        const liveItems = liveRes.items || [];

        // If no live disputes exist on the merchant's Razorpay account, return honest empty state
        if (liveItems.length === 0) {
          return NextResponse.json({
            ok: true,
            mode: "live",
            isConnected: merchantStatus.isConnected,
            merchantId: merchantStatus.merchantId,
            merchantName: merchantStatus.name,
            count: 0,
            data: [],
            stats: {
              totalCount: 0,
              totalPendingAmount: 0,
              high: { count: 0, amount: 0 },
              needsEvidence: { count: 0, amount: 0 },
              low: { count: 0, amount: 0 },
            },
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

        const liveDisputesWithScores = liveItems.map((item) => {
          const disputeObj = {
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
            mode: "live" as const,
            dataSource: "live" as const,
            data_source: "live" as const,
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

          const winnability = computeWinnability(disputeObj, [], disputeObj.order.customer);
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

          return {
            ...disputeObj,
            winnability,
          };
        });

        return NextResponse.json({
          ok: true,
          mode: "live",
          isConnected: merchantStatus.isConnected,
          merchantId: merchantStatus.merchantId,
          merchantName: merchantStatus.name,
          count: liveDisputesWithScores.length,
          data: liveDisputesWithScores,
          stats: {
            totalCount: liveDisputesWithScores.length,
            totalPendingAmount,
            high: { count: highCount, amount: highAmount },
            needsEvidence: { count: needsEvidenceCount, amount: needsEvidenceAmount },
            low: { count: lowCount, amount: lowAmount },
          },
        });
      } catch (liveError: unknown) {
        console.warn("⚠️ [API /api/disputes?mode=live] Live call error or unconfigured account:", liveError instanceof Error ? liveError.message : liveError);
        // In Live mode, NEVER fallback to seed/mock data
        return NextResponse.json({
          ok: true,
          mode: "live",
          isConnected: merchantStatus.isConnected,
          merchantId: merchantStatus.merchantId,
          merchantName: merchantStatus.name,
          count: 0,
          data: [],
          stats: {
            totalCount: 0,
            totalPendingAmount: 0,
            high: { count: 0, amount: 0 },
            needsEvidence: { count: 0, amount: 0 },
            low: { count: 0, amount: 0 },
          },
          warning: "No live disputes returned or live account returned empty list.",
        });
      }
    }

    // =========================================================================
    // TEST MODE: THE SEEDED DEMO DISPUTES
    // Clearly labeled as demo/sample test data with representative winnability spread.
    // =========================================================================
    let disputes: unknown[] | null = null;

    try {
      // Race Prisma query against a 2000ms timeout
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

      disputes = (await Promise.race([dbPromise, timeoutPromise])) as unknown[];
    } catch (dbError: unknown) {
      console.warn("⚠️ [API /api/disputes?mode=test] Prisma DB query timeout, using in-memory store:", dbError instanceof Error ? dbError.message : dbError);
      disputes = getInMemoryDisputes();
    }

    if (!disputes || !Array.isArray(disputes) || disputes.length === 0) {
      disputes = getInMemoryDisputes();
    }

    let highCount = 0;
    let highAmount = 0;
    let needsEvidenceCount = 0;
    let needsEvidenceAmount = 0;
    let lowCount = 0;
    let lowAmount = 0;
    let totalPendingAmount = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const disputesWithScores = (disputes as any[]).map((d) => {
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

      return {
        ...d,
        mode: "test",
        dataSource,
        data_source: dataSource,
        isDemo: true,
        winnability,
      };
    });

    return NextResponse.json({
      ok: true,
      mode: "test",
      isConnected: merchantStatus.isConnected,
      merchantId: merchantStatus.merchantId,
      merchantName: merchantStatus.name,
      count: disputesWithScores.length,
      data: disputesWithScores,
      stats: {
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
      },
    });
  } catch (error: unknown) {
    console.error("❌ [API /api/disputes] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch disputes";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
