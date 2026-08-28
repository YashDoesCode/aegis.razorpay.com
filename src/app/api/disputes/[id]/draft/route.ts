import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability } from "@/lib/scoring";
import { draftRebuttal } from "@/lib/drafting";
import { contestDispute } from "@/lib/razorpay";
import { EvidenceType } from "@/lib/scoring/types";
import { getInMemoryDisputeById, updateInMemoryDisputeStatus } from "@/lib/mockStore";
import { z } from "zod";

export const dynamic = "force-dynamic";

const DraftRequestBodySchema = z.object({
  customInstructions: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("forceError") === "500") {
      return NextResponse.json(
        { ok: false, error: "Simulated error during drafting (500)" },
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

    let customInstructions: string | undefined;
    try {
      const body = await request.json();
      const parsed = DraftRequestBodySchema.safeParse(body);
      if (parsed.success) {
        customInstructions = parsed.data.customInstructions;
      }
    } catch {
      // Optional body - proceed without custom instructions
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dispute: any = null;
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
      console.warn(`⚠️ [API /api/disputes/${id}/draft] Database query timeout/error, using mock store:`, dbError instanceof Error ? dbError.message : dbError);
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

    const customer = dispute.order?.customer;
    const evidenceItems = dispute.evidenceItems || [];

    // 1. Compute deterministic winnability
    const winnability = computeWinnability(dispute, evidenceItems, customer);

    // 2. Draft structured rebuttal (guaranteed never to throw in production)
    const forceFallback = searchParams.get("forceFallback") === "true";
    const rebuttal = await draftRebuttal(
      {
        dispute,
        evidenceItems,
        winnability,
        customer,
        customInstructions,
      },
      { forceFallback }
    );

    // 3. Prepare evidence map for Razorpay contest API
    const evidenceMap: Partial<Record<EvidenceType, string[]>> = {};
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

    // 4. Call Razorpay contest API in DRAFT mode with error tolerance
    let rzpContestResult: Record<string, unknown> = {
      success: true,
      action: "draft",
      response: {
        dispute_id: dispute.rzpDisputeId || dispute.id,
        status: "draft",
        evidence: evidenceMap,
      },
    };

    try {
      const liveContest = await contestDispute(
        dispute.rzpDisputeId || dispute.id,
        {
          amount: dispute.amount,
          summary: rebuttal.summary,
          action: "draft", // Strictly draft mode
          evidenceMap,
        }
      );
      if (liveContest) {
        rzpContestResult = liveContest as Record<string, unknown>;
      }
    } catch (rzpErr) {
      console.warn("⚠️ Razorpay contest API staging warning (proceeding with local draft state):", rzpErr);
    }

    // 5. Update status to under_review
    updateInMemoryDisputeStatus(dispute.id, "under_review");

    if (dispute.status === "open") {
      try {
        const updatePromise = prisma.dispute.update({
          where: { id: dispute.id },
          data: { status: "under_review" },
        });
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("DB Timeout")), 1500)
        );
        await Promise.race([updatePromise, timeoutPromise]);
      } catch (updateErr) {
        console.warn("⚠️ Non-fatal: unable to update dispute status in remote DB:", updateErr);
      }
    }

    return NextResponse.json({
      ok: true,
      disputeId: dispute.id,
      winnability,
      draftedRebuttal: rebuttal,
      razorpayContestResult: rzpContestResult,
      mode: "draft",
      source: rebuttal.source || "fallback",
    });
  } catch (error: unknown) {
    console.error("❌ [API /api/disputes/[id]/draft] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to draft dispute rebuttal";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
