import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptDispute } from "@/lib/razorpay";
import { getInMemoryDisputeById, updateInMemoryDisputeStatus } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("forceError") === "500") {
      return NextResponse.json(
        { ok: false, error: "Simulated error accepting dispute (500)" },
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
    try {
      const dbPromise = prisma.dispute.findFirst({
        where: {
          OR: [{ id: id }, { rzpDisputeId: id }],
        },
      });
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("DB Timeout")), 2000)
      );
      dispute = await Promise.race([dbPromise, timeoutPromise]);
    } catch (dbError: unknown) {
      console.warn(`⚠️ [API /api/disputes/${id}/accept] DB query timeout/error, using mock store:`, dbError instanceof Error ? dbError.message : dbError);
      dispute = getInMemoryDisputeById(id);
    }

    if (!dispute) {
      dispute = getInMemoryDisputeById(id);
    }

    if (!dispute) {
      return NextResponse.json(
        { ok: false, error: `Dispute ${id} not found` },
        { status: 404 }
      );
    }

    // Idempotency check: if dispute was already accepted and marked lost, return existing state safely
    if (dispute.status === "lost") {
      return NextResponse.json({
        ok: true,
        disputeId: dispute.id,
        status: "lost",
        message: "Dispute already accepted",
        razorpayResult: { success: true, message: "Dispute already accepted" },
        idempotent: true,
      });
    }

    // Call Razorpay accept endpoint with error resilience
    let rzpResult: { success: boolean; disputeId?: string; message?: string; response?: unknown } = {
      success: true,
      message: "Accepted locally in test mode",
    };

    try {
      rzpResult = await acceptDispute(dispute.rzpDisputeId || dispute.id);
    } catch (rzpErr) {
      console.warn("⚠️ Razorpay API accept call warning (continuing with local state update):", rzpErr);
    }

    // Update in-memory store
    updateInMemoryDisputeStatus(dispute.id, "lost");

    // Update local database if reachable
    let updated = { ...dispute, status: "lost" };
    try {
      const updatePromise = prisma.dispute.update({
        where: { id: dispute.id },
        data: { status: "lost" }, // Razorpay moves accepted disputes to lost phase
      });
      const timeoutPromise = new Promise<typeof updated>((_, reject) =>
        setTimeout(() => reject(new Error("DB Timeout")), 1500)
      );
      updated = await Promise.race([updatePromise, timeoutPromise]);
    } catch (updateErr) {
      console.warn("⚠️ Non-fatal: unable to persist accepted status to remote DB:", updateErr);
    }

    return NextResponse.json({
      ok: true,
      disputeId: updated.id,
      status: updated.status,
      razorpayResult: rzpResult,
      idempotent: false,
    });
  } catch (error: unknown) {
    console.error("❌ [API /api/disputes/[id]/accept] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to accept dispute";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
