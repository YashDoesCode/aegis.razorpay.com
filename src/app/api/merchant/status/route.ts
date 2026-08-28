import { NextResponse } from "next/server";
import { getMerchantConnectionStatus } from "@/lib/merchantAccount";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getMerchantConnectionStatus();
    return NextResponse.json({
      ok: true,
      ...status,
    });
  } catch (error: unknown) {
    console.error("❌ [API /api/merchant/status] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to retrieve merchant connection status" },
      { status: 500 }
    );
  }
}
