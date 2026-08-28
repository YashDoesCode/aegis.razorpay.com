import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability, getReasonCodeDefinition } from "@/lib/scoring";
import { getInMemoryDisputeById } from "@/lib/mockStore";
import { fetchDispute } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "test").toLowerCase() as "test" | "live";

    if (searchParams.get("forceError") === "500") {
      return NextResponse.json(
        { ok: false, error: "Simulated database connection failure (500)" },
        { status: 500 }
      );
    }

    const resolvedParams = await context.params;
    const id = resolvedParams?.id?.trim();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Dispute ID is required" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dispute: any = null;

    if (mode === "live") {
      // In Live mode: check memory or fetch directly from Razorpay API
      dispute = getInMemoryDisputeById(id);
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
          console.warn(`⚠️ [API /api/disputes/${id}?mode=live] Live dispute fetch error:`, liveFetchErr);
        }
      }
    } else {
      // Test Mode: Query database or mock store
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

        dispute = await Promise.race([dbPromise, timeoutPromise]);
      } catch (dbError: unknown) {
        console.warn(`⚠️ [API /api/disputes/${id}?mode=test] DB unreachable, falling back to mock store:`, dbError instanceof Error ? dbError.message : dbError);
        dispute = getInMemoryDisputeById(id);
      }

      if (!dispute) {
        dispute = getInMemoryDisputeById(id);
      }
    }

    if (!dispute) {
      return NextResponse.json(
        { ok: false, error: `Dispute ${id} not found` },
        { status: 404 }
      );
    }

    const customer = dispute.order?.customer;
    const evidenceItems = dispute.evidenceItems || [];
    const winnability = computeWinnability(
      dispute,
      evidenceItems,
      customer
    );
    const reasonDefinition = getReasonCodeDefinition(dispute.reasonCode);

    return NextResponse.json({
      ok: true,
      data: {
        ...dispute,
        mode,
        winnability,
        reasonDefinition,
      },
    });
  } catch (error: unknown) {
    console.error("❌ [API /api/disputes/[id]] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error fetching dispute detail";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
