import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptDispute } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const dispute = await prisma.dispute.findFirst({
      where: {
        OR: [{ id: id }, { rzpDisputeId: id }],
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { ok: false, error: `Dispute ${id} not found` },
        { status: 404 }
      );
    }

    // Call Razorpay accept endpoint
    const rzpResult = await acceptDispute(dispute.rzpDisputeId || dispute.id);

    // Update local database
    const updated = await prisma.dispute.update({
      where: { id: dispute.id },
      data: { status: "lost" }, // Razorpay moves accepted disputes to lost phase
    });

    return NextResponse.json({
      ok: true,
      disputeId: updated.id,
      status: updated.status,
      razorpayResult: rzpResult,
    });
  } catch (error: unknown) {
    console.error("❌ [API /api/disputes/[id]/accept] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to accept dispute" },
      { status: 500 }
    );
  }
}
