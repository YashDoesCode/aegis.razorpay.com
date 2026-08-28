import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability } from "@/lib/scoring";
import { getInMemoryDisputes } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Support simulated failure for resilience testing
    if (searchParams.get("forceError") === "500") {
      return NextResponse.json(
        { ok: false, error: "Simulated database connection failure (500)" },
        { status: 500 }
      );
    }

    let disputes: unknown[] | null = null;

    try {
      // Race Prisma query against a 2000ms timeout so offline DBs never hang the UI
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
        setTimeout(() => reject(new Error("DB Timeout")), 2000)
      );

      disputes = (await Promise.race([dbPromise, timeoutPromise])) as unknown[];
    } catch (dbError: unknown) {
      console.warn("⚠️ [API /api/disputes] Prisma DB unreachable, using resilient in-memory dispute store:", dbError instanceof Error ? dbError.message : dbError);
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
      const dataSource = d.dataSource || d.data_source || "seed";

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
        dataSource,
        data_source: dataSource,
        winnability,
      };
    });

    return NextResponse.json({
      ok: true,
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
