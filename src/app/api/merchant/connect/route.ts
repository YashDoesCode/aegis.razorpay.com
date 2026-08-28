import { NextRequest, NextResponse } from "next/server";
import { connectMerchantAccount } from "@/lib/merchantAccount";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyId, keySecret, merchantName } = body || {};

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { ok: false, error: "Razorpay Key ID and Key Secret are required" },
        { status: 400 }
      );
    }

    const cleanKey = String(keyId).trim();
    const cleanSecret = String(keySecret).trim();

    if (!cleanKey.startsWith("rzp_live_") && !cleanKey.startsWith("rzp_test_")) {
      return NextResponse.json(
        { ok: false, error: "Invalid Key ID format. Razorpay Key ID must start with rzp_live_ or rzp_test_" },
        { status: 400 }
      );
    }

    const result = await connectMerchantAccount({
      keyId: cleanKey,
      keySecret: cleanSecret,
      merchantName: merchantName ? String(merchantName).trim() : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Failed to authenticate with Razorpay API" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Razorpay merchant account connected successfully",
      merchant: result.merchant,
    });
  } catch (error: unknown) {
    console.error("❌ [API /api/merchant/connect] Error:", error);
    const message = error instanceof Error ? error.message : "Internal error connecting merchant account";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
