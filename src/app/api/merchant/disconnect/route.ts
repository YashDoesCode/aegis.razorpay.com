import { NextResponse } from "next/server";
import { disconnectMerchantAccount } from "@/lib/merchantAccount";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await disconnectMerchantAccount();
    return NextResponse.json({
      ok: true,
      message: "Merchant account disconnected successfully. Switched to Test Mode.",
      mode: "test",
    });
  } catch (error: unknown) {
    console.error("❌ [API /api/merchant/disconnect] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to disconnect merchant account" },
      { status: 500 }
    );
  }
}
