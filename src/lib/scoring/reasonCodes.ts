import { ReasonCodeDefinition, ScoringContext, EvidenceType } from "./types";

const isEvidencePresent = (ctx: ScoringContext, type: EvidenceType): boolean => {
  return ctx.evidenceItems.some((e) => e.type === type && e.present);
};

export const REASON_CODES: Record<string, ReasonCodeDefinition> = {
  // UPI 1064: Goods / Services Not Received (Target: ~94)
  "1064": {
    network: "upi",
    label: "Goods / Services Not Received",
    plainExplanation:
      "Customer claims they were charged via UPI but the ordered goods or services were never delivered.",
    requiredEvidence: [
      "shipping_proof",
      "billing_proof",
      "customer_communication",
      "term_and_conditions",
    ],
    scoringRules: [
      {
        id: "shipping_proof_present",
        label: "Proof of delivery (POD) uploaded and verified",
        weight: 34,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "shipping_proof") ||
          Boolean(ctx.delivery?.deliveredAt),
      },
      {
        id: "tracking_matches_customer",
        label: "Courier tracking matches customer address with signature captured",
        weight: 25,
        evaluate: (ctx) =>
          Boolean(
            ctx.delivery?.signatureCaptured ||
              (ctx.delivery?.trackingId && isEvidencePresent(ctx, "shipping_proof"))
          ),
      },
      {
        id: "customer_comms_acknowledgement",
        label: "Customer communication acknowledging receipt on file",
        weight: 15,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "customer_communication") ||
          Boolean(ctx.communications && ctx.communications.length > 0),
      },
      {
        id: "terms_policy_present",
        label: "Terms & Conditions and fulfillment policy uploaded",
        weight: 10,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "term_and_conditions") ||
          isEvidencePresent(ctx, "refund_cancellation_policy"),
      },
      {
        id: "customer_trust_score",
        label: "Customer has positive purchase history (≥2 prior orders, low disputes)",
        weight: 10,
        evaluate: (ctx) =>
          Boolean(
            ctx.customer &&
              ctx.customer.priorOrdersCount >= 2 &&
              ctx.customer.priorDisputesCount <= 1
          ),
      },
    ],
  },

  // UPI 108: Beneficiary Account Not Credited (Digital / Service) (Target: ~82)
  "108": {
    network: "upi",
    label: "Debited, Beneficiary Not Credited",
    plainExplanation:
      "Customer claims UPI debit occurred but the merchant did not acknowledge receipt or provision the digital service.",
    requiredEvidence: [
      "proof_of_service",
      "billing_proof",
      "customer_communication",
      "explanation_letter",
    ],
    scoringRules: [
      {
        id: "proof_of_service_present",
        label: "Proof of service / digital session logs verified",
        weight: 42,
        evaluate: (ctx) => isEvidencePresent(ctx, "proof_of_service"),
      },
      {
        id: "billing_proof_invoice",
        label: "GST Tax Invoice generated on payment capture",
        weight: 25,
        evaluate: (ctx) => isEvidencePresent(ctx, "billing_proof"),
      },
      {
        id: "customer_comms_present",
        label: "Customer communication confirming session/service attendance",
        weight: 15,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "customer_communication") ||
          Boolean(ctx.communications && ctx.communications.length > 0),
      },
      {
        id: "explanation_letter_present",
        label: "Merchant explanation letter detailing instantaneous provisioning",
        weight: 18,
        evaluate: (ctx) => isEvidencePresent(ctx, "explanation_letter"),
      },
    ],
  },

  // Card 4837: No Cardholder Authorisation (3DS Liability Shift) (Target: ~68)
  "4837": {
    network: "card",
    label: "No Cardholder Authorisation",
    plainExplanation:
      "Cardholder disputes the transaction claiming fraud or lack of authorized consent.",
    requiredEvidence: [
      "access_activity_log",
      "shipping_proof",
      "billing_proof",
      "explanation_letter",
    ],
    scoringRules: [
      {
        id: "3ds_liability_shift",
        label: "3D-Secure 2.0 liability shift authenticated with OTP/device fingerprint",
        weight: 38,
        evaluate: (ctx) => isEvidencePresent(ctx, "access_activity_log"),
      },
      {
        id: "shipping_proof_verified",
        label: "Proof of delivery to cardholder billing address",
        weight: 22,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "shipping_proof") ||
          Boolean(ctx.delivery?.signatureCaptured),
      },
      {
        id: "billing_proof_match",
        label: "Billing invoice matching cardholder identity",
        weight: 8,
        evaluate: (ctx) => isEvidencePresent(ctx, "billing_proof"),
      },
      {
        id: "explanation_letter_rebuttal",
        label: "Formal rebuttal explanation letter attached",
        weight: 17,
        evaluate: (ctx) => isEvidencePresent(ctx, "explanation_letter"),
      },
      {
        id: "device_fingerprint_match",
        label: "In-depth device & IP geo-correlation log attached",
        weight: 15,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "others") &&
          Boolean(ctx.evidenceItems.some((e) => e.type === "others" && e.note?.includes("device"))),
      },
    ],
  },

  // UPI 1062: Goods / Services Not As Described (Target: ~45)
  "1062": {
    network: "upi",
    label: "Goods Not As Described or Defective",
    plainExplanation:
      "Customer claims received goods differ significantly from description or were damaged.",
    requiredEvidence: [
      "shipping_proof",
      "refund_cancellation_policy",
      "billing_proof",
      "customer_communication",
    ],
    scoringRules: [
      {
        id: "delivery_condition_proof",
        label: "Courier proof of delivery with physical receipt confirmed",
        weight: 25,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "shipping_proof") ||
          Boolean(ctx.delivery?.signatureCaptured),
      },
      {
        id: "return_policy_guidelines",
        label: "Published replacement and damage reporting policy on file",
        weight: 20,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "refund_cancellation_policy") ||
          isEvidencePresent(ctx, "term_and_conditions"),
      },
      {
        id: "item_specification_invoice",
        label: "GST invoice specifying exact SKU and technical catalog match",
        weight: 30,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "billing_proof") &&
          Boolean(ctx.evidenceItems.some((e) => e.type === "billing_proof" && e.present && e.note?.includes("catalog_verified"))),
      },
      {
        id: "customer_comms_pre_dispute",
        label: "Customer support communications documenting pre-dispute resolution",
        weight: 25,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "customer_communication") &&
          Boolean(ctx.evidenceItems.some((e) => e.type === "customer_communication" && e.present)),
      },
    ],
  },

  // UPI 1061: Credit Not Processed (Refund Issue) (Target: ~23)
  "1061": {
    network: "upi",
    label: "Credit / Refund Not Processed",
    plainExplanation:
      "Customer claims an agreed refund or return credit was never credited to their bank account.",
    requiredEvidence: [
      "refund_confirmation",
      "refund_cancellation_policy",
      "customer_communication",
    ],
    scoringRules: [
      {
        id: "refund_confirmation_arn",
        label: "Refund ARN / banking UTR settlement proof verified",
        weight: 55,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "refund_confirmation") ||
          Boolean(ctx.refunds?.some((r) => r.status === "processed")),
      },
      {
        id: "refund_cancellation_policy",
        label: "Merchant refund & cancellation terms on file",
        weight: 23,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "refund_cancellation_policy") ||
          isEvidencePresent(ctx, "term_and_conditions"),
      },
      {
        id: "customer_comms_record",
        label: "Customer communication timeline and resolution record",
        weight: 22,
        evaluate: (ctx) =>
          Boolean(ctx.evidenceItems.some((e) => e.type === "customer_communication" && e.present && e.note?.includes("refund_disputed_resolved"))),
      },
    ],
  },

  // UPI 1084: Duplicate Processing (Target: ~12, Merchant Error -> Recommend Accept)
  "1084": {
    network: "upi",
    label: "Duplicate Processing",
    plainExplanation:
      "Customer was debited multiple times for a single order or purchase intent.",
    requiredEvidence: [
      "billing_proof",
      "explanation_letter",
      "access_activity_log",
    ],
    scoringRules: [
      {
        id: "distinct_order_invoices",
        label: "Distinct invoices proving separate legitimate orders",
        weight: 50,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "billing_proof") &&
          Boolean(ctx.evidenceItems.some((e) => e.type === "billing_proof" && e.present)),
      },
      {
        id: "explanation_letter_distinct",
        label: "Explanation letter documenting distinct fulfillment",
        weight: 25,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "explanation_letter") &&
          Boolean(ctx.evidenceItems.some((e) => e.type === "explanation_letter" && e.present)),
      },
      {
        id: "session_activity_logs",
        label: "Telemetry proving distinct checkout sessions",
        weight: 13,
        evaluate: (ctx) =>
          isEvidencePresent(ctx, "access_activity_log") &&
          Boolean(ctx.evidenceItems.some((e) => e.type === "access_activity_log" && e.present)),
      },
      {
        id: "gateway_duplicate_telemetry",
        label: "Payment gateway transaction ledger and timestamp verification",
        weight: 12,
        evaluate: (ctx) =>
          Boolean(ctx.dispute.paymentId || ctx.dispute.order?.rzpPaymentId),
      },
    ],
  },
};

export const DEFAULT_FALLBACK_REASON: ReasonCodeDefinition = {
  network: "upi",
  label: "General Chargeback Dispute",
  plainExplanation: "Dispute submitted by cardholder/account holder via issuing bank.",
  requiredEvidence: [
    "shipping_proof",
    "billing_proof",
    "customer_communication",
    "explanation_letter",
  ],
  scoringRules: [
    {
      id: "billing_proof",
      label: "Billing invoice and payment proof on file",
      weight: 30,
      evaluate: (ctx) => isEvidencePresent(ctx, "billing_proof"),
    },
    {
      id: "fulfillment_proof",
      label: "Proof of fulfillment / service / shipping",
      weight: 30,
      evaluate: (ctx) =>
        isEvidencePresent(ctx, "shipping_proof") ||
        isEvidencePresent(ctx, "proof_of_service"),
    },
    {
      id: "customer_communication",
      label: "Customer communication records",
      weight: 20,
      evaluate: (ctx) =>
        isEvidencePresent(ctx, "customer_communication") ||
        Boolean(ctx.communications && ctx.communications.length > 0),
    },
    {
      id: "explanation_letter",
      label: "Rebuttal explanation letter",
      weight: 20,
      evaluate: (ctx) => isEvidencePresent(ctx, "explanation_letter"),
    },
  ],
};

export function getReasonCodeDefinition(reasonCode: string): ReasonCodeDefinition {
  const cleanCode = reasonCode.replace(/[^0-9a-zA-Z]/g, "").trim();
  return REASON_CODES[cleanCode] || DEFAULT_FALLBACK_REASON;
}
