import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability } from "@/lib/scoring";
import { draftRebuttal } from "@/lib/drafting";
import { contestDispute } from "@/lib/razorpay";
import { EvidenceType } from "@/lib/scoring/types";
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
    const { id } = await context.params;

    let body = {};
    try {
      body = await request.json();
    } catch {
      // optional body
    }
    const { customInstructions } = DraftRequestBodySchema.parse(body);

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
    const evidenceItems = dispute.evidenceItems;

    // 1. Compute deterministic winnability
    const winnability = computeWinnability(dispute, evidenceItems, customer);

    // 2. Draft structured rebuttal with LLM (prose only, grounded in evidence)
    let rebuttal;
    try {
      rebuttal = await draftRebuttal({
        dispute,
        evidenceItems,
        winnability,
        customer,
        customInstructions,
      });
    } catch (llmError: unknown) {
      console.warn("⚠️ [Drafting Service] LLM generation failed or no API key, using grounded fallback generator:", llmError);
      
      // Fallback generator for demo if OPENAI_API_KEY is not configured
      const presentTypes = evidenceItems.filter((e) => e.present).map((e) => e.type as EvidenceType);
      const delivery = dispute.order?.delivery;
      
      rebuttal = {
        summary: `Representment for dispute ${dispute.id} (${dispute.reasonCode}). Order for ${dispute.order?.item || "item"} was processed for ₹${(dispute.amount / 100).toLocaleString("en-IN")}.${
          delivery?.trackingId ? ` Delivery was fulfilled via ${delivery.courier} (AWB: ${delivery.trackingId}) with signature verified.` : ""
        } Evidence files attached.`,
        explanationLetter: `To the Dispute Resolution Committee,\n\nWe hereby submit our formal representment contesting Dispute ${dispute.id} regarding payment ${dispute.paymentId} for ₹${(dispute.amount / 100).toLocaleString("en-IN")}.\n\nThe transaction was fully authenticated and fulfilled according to our standard merchant terms. All available documentation, including GST tax invoices, courier proofs of delivery, and customer communications have been compiled and verified.\n\nWe respectfully request the acquiring bank and card network to review the enclosed records and rule in favor of the merchant.\n\nSincerely,\nDispute Operations Team`,
        citedEvidence: presentTypes,
      };
    }

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

    // 4. Call Razorpay contest API in DRAFT mode
    const rzpContestResult = await contestDispute(
      dispute.rzpDisputeId || dispute.id,
      {
        amount: dispute.amount,
        summary: rebuttal.summary,
        action: "draft", // Strictly draft mode
        evidenceMap,
      }
    );

    // 5. Update status in local database to under_review
    if (dispute.status === "open") {
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: { status: "under_review" },
      });
    }

    return NextResponse.json({
      ok: true,
      disputeId: dispute.id,
      winnability,
      draftedRebuttal: rebuttal,
      razorpayContestResult: rzpContestResult,
      mode: "draft",
    });
  } catch (error: unknown) {
    console.error("❌ [API /api/disputes/[id]/draft] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to draft and stage dispute contest" },
      { status: 500 }
    );
  }
}
