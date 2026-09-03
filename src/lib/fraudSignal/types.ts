export type FraudRiskBand = "low" | "medium" | "high" | "insufficient_signal";

export interface FraudContributingFactor {
  id: string;
  label: string;
  weight: number; // Points contributing to risk (positive or negative)
  evidence: string;
  type: "repeat_dispute" | "ratio_anomaly" | "contradictory_proof" | "instrument_switching" | "clean_history" | "insufficient_data";
}

export interface FraudDefenseImpact {
  recommendedStrategy: string;
  defenseAdjustment: "strengthens_contest" | "neutral" | "caution";
  explanation: string;
}

export interface FraudGraphNode {
  id: string;
  type: "customerNode" | "orderNode" | "disputeNode" | "paymentNode" | "deliveryNode" | "communicationNode";
  position: { x: number; y: number };
  data: {
    label: string;
    sublabel?: string;
    category: "customer" | "order" | "dispute" | "payment" | "delivery" | "communication";
    status?: string;
    amount?: number;
    meta?: Record<string, string | number | boolean | null | undefined>;
  };
}

export interface FraudGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
}

export interface RelationshipGraphData {
  nodes: FraudGraphNode[];
  edges: FraudGraphEdge[];
  summary: {
    totalNodes: number;
    totalEdges: number;
    disputeCount: number;
    orderCount: number;
    distinctPaymentMethods: number;
  };
}

export interface FraudSignalResult {
  score: number; // 0 to 100
  band: FraudRiskBand;
  isRepeatDisputer: boolean;
  disputeToOrderRatio: number;
  contributingFactors: FraudContributingFactor[];
  defenseImpact: FraudDefenseImpact;
  relationshipGraph: RelationshipGraphData;
}
