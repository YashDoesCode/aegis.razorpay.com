import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const disputes = await prisma.dispute.findMany({
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

    let highCount = 0;
    let highAmount = 0;
    let needsEvidenceCount = 0;
    let needsEvidenceAmount = 0;
    let lowCount = 0;
    let lowAmount = 0;
    let totalPendingAmount = 0;

    const disputesWithScores = disputes.map((d) => {
      const customer = d.order?.customer;
      const evidenceItems = d.evidenceItems;
      const winnability = computeWinnability(d, evidenceItems, customer);

      totalPendingAmount += d.amount;

      if (winnability.band === "high") {
        highCount += 1;
        highAmount += d.amount;
      } else if (winnability.band === "needs_evidence") {
        needsEvidenceCount += 1;
        needsEvidenceAmount += d.amount;
      } else {
        lowCount += 1;
        lowAmount += d.amount;
      }

      return {
        ...d,
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
    console.error("❌ [API /api/disputes] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch disputes" },
      { status: 500 }
    );
  }
}
