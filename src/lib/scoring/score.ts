import {
  DisputeData,
  EvidenceItemData,
  CustomerData,
  WinnabilityResult,
  WinnabilityBand,
  Recommendation,
  ScoringContext,
  ScoreBreakdownItem,
} from "./types";
import { getReasonCodeDefinition } from "./reasonCodes";
import { ComputeWinnabilityInputSchema } from "./schemas";

/**
 * Computes deterministic winnability score and rebuttal recommendation
 * for a payment dispute based on reason code, evidence presence, and customer context.
 *
 * Bands:
 *  - High: >= 80 (Recommendation: "contest")
 *  - Needs Evidence: 50–79 (Recommendation: "gather_evidence")
 *  - Low: < 50 (Recommendation: "accept")
 */
export function computeWinnability(
  disputeInput: DisputeData,
  evidenceItemsInput: EvidenceItemData[] = [],
  customerInput?: CustomerData
): WinnabilityResult {
  // 1. Validate inputs via Zod
  const validated = ComputeWinnabilityInputSchema.parse({
    dispute: disputeInput,
    evidenceItems: evidenceItemsInput,
    customer: customerInput,
  });

  const dispute = validated.dispute;
  const evidenceItems = validated.evidenceItems;
  const customer = validated.customer || dispute.order?.customer;
  const delivery = dispute.order?.delivery || null;
  const communications = dispute.order?.communications || [];
  const refunds = dispute.order?.refunds || [];

  // 2. Resolve reason code definition & rule checklist
  const definition = getReasonCodeDefinition(dispute.reasonCode);

  const context: ScoringContext = {
    dispute,
    evidenceItems,
    customer,
    delivery,
    communications,
    refunds,
  };

  let totalScore = 0;
  const reasons: ScoreBreakdownItem[] = [];

  // 3. Evaluate each rule deterministically
  for (const rule of definition.scoringRules) {
    const isMet = rule.evaluate(context);
    const delta = isMet ? rule.weight : 0;
    totalScore += delta;

    reasons.push({
      label: rule.label,
      delta: rule.weight,
      met: isMet,
    });
  }

  // 4. Clamp score between 0 and 100
  const score = Math.max(0, Math.min(100, Math.round(totalScore)));

  // 5. Determine Band and Recommendation
  let band: WinnabilityBand;
  let recommendation: Recommendation;

  if (score >= 80) {
    band = "high";
    recommendation = "contest";
  } else if (score >= 50) {
    band = "needs_evidence";
    recommendation = "gather_evidence";
  } else {
    band = "low";
    recommendation = "accept";
  }

  return {
    score,
    band,
    reasons,
    recommendation,
  };
}
