import Razorpay from "razorpay";
import { EvidenceType } from "./scoring/types";
import { getActiveRazorpayClient } from "./merchantAccount";
import { logger } from "./logger";

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

  logger.info(`Fetching dispute feed from Razorpay API`, {
    module: "RazorpaySDK",
    mode,
    maskedKey,
  });

  try {
    const res = await (client.disputes as unknown as {
      all: (p?: Record<string, unknown>) => Promise<{ entity: string; count: number; items: RazorpayDisputeResponse[] }>;
    }).all(params);

    logger.debug(`Razorpay API disputes returned count: ${res?.count ?? 0}`, {
      module: "RazorpaySDK",
      count: res?.count ?? 0,
    });
    return res;
  } catch (error: unknown) {
    const err = error as { statusCode?: number; error?: { description?: string; code?: string }; message?: string };
    logger.warn(`Razorpay fetchDisputes API call returned error: ${err.error?.description || err.message}`, {
      module: "RazorpaySDK",
      mode,
    });
    throw error;
  }
}

export async function fetchDispute(
  disputeId: string,
  mode: "test" | "live" = "test"
): Promise<RazorpayDisputeResponse> {
  const client = getRazorpayClient(mode);
  logger.info(`Fetching dispute ${disputeId} from Razorpay API`, {
    module: "RazorpaySDK",
    disputeId,
    mode,
  });

  try {
    const res = await (client.disputes as unknown as {
      fetch: (id: string) => Promise<RazorpayDisputeResponse>;
    }).fetch(disputeId);
    return res;
  } catch (error: unknown) {
    const err = error as { statusCode?: number; error?: { description?: string } };
    logger.warn(`Razorpay fetchDispute(${disputeId}) returned warning: ${err.error?.description}`, {
      module: "RazorpaySDK",
      disputeId,
    });
    throw error;
  }
}

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

  const contestBody: ContestEvidencePayload = {
    amount: payload.amount,
    summary: payload.summary.slice(0, 1000),
    action: action,
    ...payload.rawEvidence,
  };

  if (payload.evidenceMap) {
    for (const [key, docs] of Object.entries(payload.evidenceMap)) {
      if (docs && docs.length > 0) {
        contestBody[key] = docs;
      }
    }
  }

  logger.info(`Staging contest on Razorpay API for dispute ${disputeId} (Action: ${action})`, {
    module: "RazorpaySDK",
    disputeId,
    action,
    mode,
  });

  try {
    const res = await (client.disputes as unknown as {
      contest: (id: string, data: ContestEvidencePayload) => Promise<unknown>;
    }).contest(disputeId, contestBody);

    logger.info(`Razorpay contest draft staged successfully for ${disputeId}`, {
      module: "RazorpaySDK",
      disputeId,
    });
    return {
      success: true,
      disputeId,
      action,
      response: res,
      mode: "live",
    };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; error?: { description?: string; code?: string }; message?: string };
    logger.warn(`Razorpay contest call returned error/warning: ${err.error?.description || err.message}`, {
      module: "RazorpaySDK",
      disputeId,
      mode,
    });

    if (mode === "live") {
      throw error;
    }

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

export async function acceptDispute(
  disputeId: string,
  mode: "test" | "live" = "test"
): Promise<{ success: boolean; disputeId: string; response: unknown; mode: "live" | "mock_fallback" }> {
  const client = getRazorpayClient(mode);
  logger.info(`Accepting dispute ${disputeId} on Razorpay API`, {
    module: "RazorpaySDK",
    disputeId,
    mode,
  });

  try {
    const res = await (client.disputes as unknown as { accept: (id: string) => Promise<unknown> }).accept(disputeId);
    logger.info(`Dispute ${disputeId} accepted successfully`, {
      module: "RazorpaySDK",
      disputeId,
    });
    return {
      success: true,
      disputeId,
      response: res,
      mode: "live",
    };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; error?: { description?: string }; message?: string };
    logger.warn(`Razorpay accept call returned: ${err.error?.description || err.message}`, {
      module: "RazorpaySDK",
      disputeId,
      mode,
    });

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
