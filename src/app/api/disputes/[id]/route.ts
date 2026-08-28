import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinnability, getReasonCodeDefinition } from "@/lib/scoring";
import { getInMemoryDisputeById } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);

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
      console.warn(`⚠️ [API /api/disputes/${id}] DB unreachable, falling back to mock store:`, dbError instanceof Error ? dbError.message : dbError);
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
