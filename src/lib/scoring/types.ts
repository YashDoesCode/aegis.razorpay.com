export type EvidenceType =
  | "shipping_proof"
  | "billing_proof"
  | "customer_communication"
  | "proof_of_service"
  | "explanation_letter"
  | "refund_confirmation"
  | "access_activity_log"
  | "refund_cancellation_policy"
  | "term_and_conditions"
  | "others";

export type Network = "upi" | "card" | "netbanking" | "wallet";

export type WinnabilityBand = "high" | "needs_evidence" | "low";

export type Recommendation = "contest" | "gather_evidence" | "accept";

export interface EvidenceItemData {
  id?: string;
  type: EvidenceType | string;
  present: boolean;
  documentRef?: string | null;
  note?: string | null;
}

export interface CustomerData {
  id?: string;
  name: string;
  email?: string | null;
  address?: string | null;
  priorOrdersCount: number;
  priorDisputesCount: number;
}

export interface DeliveryData {
  courier?: string | null;
  trackingId?: string | null;
  deliveredAt?: Date | string | null;
  deliveredToAddress?: string | null;
  signatureCaptured?: boolean;
}

export interface CommunicationData {
  direction: string;
  channel: string;
  body: string;
  sentAt?: Date | string;
}

export interface RefundData {
  amount: number;
  status: string;
  rzpRefundId?: string | null;
}

export interface OrderData {
  id?: string;
  rzpPaymentId?: string;
  item?: string;
  amount?: number;
  currency?: string;
  status?: string;
  customer?: CustomerData;
  delivery?: DeliveryData | null;
  communications?: CommunicationData[];
  refunds?: RefundData[];
}

export interface DisputeData {
  id: string;
  rzpDisputeId?: string;
  paymentId?: string;
  reasonCode: string;
  network?: Network | string;
  amount?: number;
  currency?: string;
  phase?: string;
  status?: string;
  dataSource?: "live" | "seed";
  data_source?: "live" | "seed";
  order?: OrderData;
}

export interface ScoringContext {
  dispute: DisputeData;
  evidenceItems: EvidenceItemData[];
  customer?: CustomerData;
  delivery?: DeliveryData | null;
  communications?: CommunicationData[];
  refunds?: RefundData[];
}

export interface ScoringRule {
  id: string;
  label: string;
  weight: number;
  evaluate: (ctx: ScoringContext) => boolean;
}

export interface ReasonCodeDefinition {
  network: Network;
  label: string;
  plainExplanation: string;
  requiredEvidence: EvidenceType[];
  scoringRules: ScoringRule[];
}

export interface ScoreBreakdownItem {
  label: string;
  delta: number;
  met: boolean;
}

export interface WinnabilityResult {
  score: number;
  band: WinnabilityBand;
  reasons: ScoreBreakdownItem[];
  recommendation: Recommendation;
}
