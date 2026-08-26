import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability, getReasonCodeDefinition } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const dispute = await prisma.dispute.findFirst({
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

    if (!dispute) {
      return NextResponse.json(
        { ok: false, error: `Dispute ${id} not found` },
        { status: 404 }
      );
    }

    const customer = dispute.order?.customer;
    const winnability = computeWinnability(
      dispute,
      dispute.evidenceItems,
      customer
    );
    const reasonDefinition = getReasonCodeDefinition(dispute.reasonCode);

    return NextResponse.json({
      ok: true,
      data: {
        ...dispute,
        winnability,
        reasonDefinition,
      },
    });
  } catch (error: unknown) {
    console.error("❌ [API /api/disputes/[id]] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error fetching dispute detail" },
      { status: 500 }
    );
  }
}
