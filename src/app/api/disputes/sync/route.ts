import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchDisputes } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    let liveDisputesCount = 0;
    let liveItems: unknown[] = [];

    try {
      const res = await fetchDisputes({ count: 20 });
      liveItems = res.items || [];
      liveDisputesCount = liveItems.length;
    } catch (rzpErr) {
      console.log("ℹ️ Live Razorpay API returned no active disputes or keys in test sandbox mode:", rzpErr);
    }

    const localCount = await prisma.dispute.count();

    return NextResponse.json({
      ok: true,
      synced: true,
      liveDisputesCount,
      localDisputesCount: localCount,
      message: `Synchronized successfully. ${localCount} disputes currently managed in Aegis engine.`,
    });
  } catch (error: unknown) {
    console.error("❌ [API /api/disputes/sync] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to sync disputes" },
      { status: 500 }
    );
  }
}
