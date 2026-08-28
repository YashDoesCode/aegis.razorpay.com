import Razorpay from "razorpay";
import { EvidenceType } from "./scoring/types";
import { getActiveRazorpayClient } from "./merchantAccount";

/**
 * Returns an instance of the Razorpay SDK configured with environment secrets.
 * Ensures server-side credentials are never hardcoded or exposed client-side.
 */
export function getRazorpayClient(mode: "test" | "live" = "test"): Razorpay {
  return getActiveRazorpayClient(mode);
}

export const razorpay = getRazorpayClient("test");

export interface ContestEvidencePayload {
  amount?: number;
  summary?: string;
  action?: "draft" | "submit";
  shipping_proof?: string[];
  billing_proof?: string[];
  customer_communication?: string[];
  proof_of_service?: string[];
  explanation_letter?: string[];
  refund_confirmation?: string[];
  access_activity_log?: string[];
  refund_cancellation_policy?: string[];
  term_and_conditions?: string[];
  others?: string[];
  [key: string]: unknown;
}

export interface RazorpayDisputeResponse {
  id: string;
  entity: string;
  payment_id: string;
  amount: number;
  currency: string;
  reason_code: string;
  status: string;
  phase: string;
  created_at: number;
  respond_by?: number;
  evidence?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Fetch all disputes from Razorpay API (/v1/disputes)
 */
export async function fetchDisputes(
  params?: {
    count?: number;
    skip?: number;
    from?: number;
    to?: number;
  },
  mode: "test" | "live" = "test"
): Promise<{ entity: string; count: number; items: RazorpayDisputeResponse[] }> {
  const client = getRazorpayClient(mode);
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const maskedKey = keyId ? `${keyId.slice(0, 8)}...` : "placeholder";

  console.log(`📡 [Razorpay ${mode.toUpperCase()} API] Calling GET https://api.razorpay.com/v1/disputes (Key: ${maskedKey})`);

  try {
    const res = await (client.disputes as unknown as {
      all: (p?: Record<string, unknown>) => Promise<{ entity: string; count: number; items: RazorpayDisputeResponse[] }>;
    }).all(params);

    console.log(`📦 [Razorpay ${mode.toUpperCase()} API] GET /v1/disputes raw response count:`, res?.count ?? 0);
    return res;
  } catch (error: unknown) {
    const err = error as { statusCode?: number; error?: { description?: string; code?: string }; message?: string };
    console.warn(`⚠️ [Razorpay ${mode.toUpperCase()} API] fetchDisputes response/error:`, err.error?.description || err.message || err);
    throw error;
  }
}

/**
 * Fetch a single dispute by ID (/v1/disputes/:id)
 */
export async function fetchDispute(
  disputeId: string,
  mode: "test" | "live" = "test"
): Promise<RazorpayDisputeResponse> {
  const client = getRazorpayClient(mode);
  console.log(`📡 [Razorpay ${mode.toUpperCase()} API] Calling GET https://api.razorpay.com/v1/disputes/${disputeId}`);

  try {
    const res = await (client.disputes as unknown as {
      fetch: (id: string) => Promise<RazorpayDisputeResponse>;
    }).fetch(disputeId);
    console.log(`📦 [Razorpay ${mode.toUpperCase()} API] GET /v1/disputes/${disputeId} response:`, res?.id);
    return res;
  } catch (error: unknown) {
    const err = error as { statusCode?: number; error?: { description?: string } };
    console.warn(`⚠️ [Razorpay ${mode.toUpperCase()} API] fetchDispute(${disputeId}) warning:`, err.error?.description || err);
    throw error;
  }
}

/**
 * Contest a dispute in draft or submit mode (/v1/disputes/:id/contest)
 * Default action is strictly "draft" to ensure no accidental live submissions.
 */
export async function contestDispute(
  disputeId: string,
  payload: {
    amount?: number;
    summary: string;
    action?: "draft" | "submit";
    evidenceMap?: Partial<Record<EvidenceType, string[]>>;
    rawEvidence?: Partial<ContestEvidencePayload>;
  },
  mode: "test" | "live" = "test"
): Promise<{ success: boolean; disputeId: string; action: string; response: unknown; mode: "live" | "mock_fallback" }> {
  const client = getRazorpayClient(mode);
  const action = payload.action || "draft";

  // Build the official Razorpay contest body
  const contestBody: ContestEvidencePayload = {
    amount: payload.amount,
    summary: payload.summary.slice(0, 1000),
    action: action,
    ...payload.rawEvidence,
  };

  // Map typed evidence arrays if provided
  if (payload.evidenceMap) {
    for (const [key, docs] of Object.entries(payload.evidenceMap)) {
      if (docs && docs.length > 0) {
        contestBody[key] = docs;
      }
    }
  }

  console.log(`📡 [Razorpay ${mode.toUpperCase()} API] Calling PATCH https://api.razorpay.com/v1/disputes/${disputeId}/contest (Action: ${action})`);

  try {
    // Attempt actual SDK call against API
    const res = await (client.disputes as unknown as {
      contest: (id: string, data: ContestEvidencePayload) => Promise<unknown>;
    }).contest(disputeId, contestBody);

    console.log(`✅ [Razorpay ${mode.toUpperCase()} API] Contest Response:`, JSON.stringify(res, null, 2));
    return {
      success: true,
      disputeId,
      action,
      response: res,
      mode: "live",
    };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; error?: { description?: string; code?: string }; message?: string };
    console.warn(`⚠️ [Razorpay ${mode.toUpperCase()} API] Contest call returned:`, err.error?.description || err.message || err);

    // In LIVE mode, NEVER synthesize or fabricate contest success if the API failed
    if (mode === "live") {
      throw error;
    }

    // In TEST mode, return safe fallback state for seeded demo IDs
    return {
      success: true,
      disputeId,
      action,
      response: {
        id: disputeId,
        entity: "dispute",
        status: "under_review",
        phase: "chargeback",
        action: action,
        summary: payload.summary,
        evidence: contestBody,
        updated_at: Math.floor(Date.now() / 1000),
        _mode: "test_contest_draft_acknowledged",
        _gateway_attempt_logged: true,
      },
      mode: "mock_fallback",
    };
  }
}

/**
 * Accept a dispute (/v1/disputes/:id/accept)
 */
export async function acceptDispute(
  disputeId: string,
  mode: "test" | "live" = "test"
): Promise<{ success: boolean; disputeId: string; response: unknown; mode: "live" | "mock_fallback" }> {
  const client = getRazorpayClient(mode);
  console.log(`📡 [Razorpay ${mode.toUpperCase()} API] Calling POST https://api.razorpay.com/v1/disputes/${disputeId}/accept`);

  try {
    const res = await (client.disputes as unknown as { accept: (id: string) => Promise<unknown> }).accept(disputeId);
    console.log(`✅ [Razorpay ${mode.toUpperCase()} API] Accept Response:`, JSON.stringify(res, null, 2));
    return {
      success: true,
      disputeId,
      response: res,
      mode: "live",
    };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; error?: { description?: string }; message?: string };
    console.warn(`⚠️ [Razorpay ${mode.toUpperCase()} API] Accept call returned:`, err.error?.description || err.message || err);

    if (mode === "live") {
      throw error;
    }

    return {
      success: true,
      disputeId,
      response: {
        id: disputeId,
        entity: "dispute",
        status: "lost",
        phase: "chargeback",
        updated_at: Math.floor(Date.now() / 1000),
        _mode: "test_accepted_acknowledged",
      },
      mode: "mock_fallback",
    };
  }
}

export default razorpay;

