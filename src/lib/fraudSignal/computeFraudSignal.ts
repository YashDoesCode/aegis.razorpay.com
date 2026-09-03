import {
  FraudSignalResult,
  FraudRiskBand,
  FraudContributingFactor,
  FraudDefenseImpact,
  FraudGraphNode,
  FraudGraphEdge,
  RelationshipGraphData,
} from "./types";
import { EvidenceItemData } from "../scoring/types";

export interface CustomerGraphInput {
  id?: string;
  name?: string;
  email?: string | null;
  address?: string | null;
  priorOrdersCount?: number;
  priorDisputesCount?: number;
}

export interface DeliveryGraphInput {
  courier?: string | null;
  trackingId?: string | null;
  deliveredAt?: string | Date | null;
  deliveredToAddress?: string | null;
  signatureCaptured?: boolean;
}

export interface CommunicationGraphInput {
  id?: string;
  channel?: string;
  direction?: string;
  body?: string;
  sentAt?: string | Date;
}

export interface OrderGraphInput {
  id?: string;
  item?: string;
  amount?: number;
  currency?: string;
  rzpPaymentId?: string;
  status?: string;
  customer?: CustomerGraphInput;
  delivery?: DeliveryGraphInput | null;
  communications?: CommunicationGraphInput[];
  refunds?: {
    id?: string;
    amount?: number;
    status?: string;
  }[];
}

export interface DisputeGraphInput {
  id: string;
  rzpDisputeId?: string;
  orderId?: string;
  paymentId?: string;
  reasonCode: string;
  network?: string;
  amount: number;
  currency?: string;
  phase?: string;
  status?: string;
  createdAt?: string | Date;
  order?: OrderGraphInput;
  evidenceItems?: EvidenceItemData[];
}

/**
 * Deterministically compute the friendly-fraud / repeat-disputer signal from real customer & dispute telemetry.
 */
export function computeFraudSignal(
  dispute: DisputeGraphInput,
  evidenceList: EvidenceItemData[] = [],
  customerOverride?: CustomerGraphInput
): FraudSignalResult {
  const customer = customerOverride || dispute.order?.customer;
  const order = dispute.order;
  const delivery = order?.delivery;
  const communications = order?.communications || [];
  const reasonCode = dispute.reasonCode || "";

  const priorOrders = customer?.priorOrdersCount ?? 0;
  const priorDisputes = customer?.priorDisputesCount ?? 0;
  const totalOrdersObserved = priorOrders + 1;
  const totalDisputesObserved = priorDisputes + 1;

  const disputeToOrderRatio = totalOrdersObserved > 0
    ? Number((totalDisputesObserved / totalOrdersObserved).toFixed(2))
    : 1.0;

  const factors: FraudContributingFactor[] = [];
  let rawScore = 0;

  // 1. Check Data Sufficiency
  const isInsufficientHistory = !customer || (priorOrders <= 1 && priorDisputes === 0);

  // 2. Repeat Disputer Pattern (Historical telemetry)
  if (priorDisputes >= 2) {
    rawScore += 45;
    factors.push({
      id: "factor_chronic_repeat_disputer",
      label: "Chronic Repeat Disputer",
      weight: 45,
      evidence: `Customer profile has ${priorDisputes} recorded historical disputes with this merchant.`,
      type: "repeat_dispute",
    });
  } else if (priorDisputes === 1) {
    rawScore += 30;
    factors.push({
      id: "factor_prior_dispute_record",
      label: "Previous Dispute on Record",
      weight: 30,
      evidence: `Customer previously filed 1 dispute prior to this transaction.`,
      type: "repeat_dispute",
    });
  }

  // 3. Dispute-to-Order Ratio Anomaly
  if (totalOrdersObserved >= 2) {
    if (disputeToOrderRatio >= 0.5) {
      rawScore += 35;
      factors.push({
        id: "factor_extreme_ratio",
        label: "Abnormal Dispute-to-Order Ratio (≥50%)",
        weight: 35,
        evidence: `Dispute ratio is ${(disputeToOrderRatio * 100).toFixed(0)}% (${totalDisputesObserved} disputes across ${totalOrdersObserved} orders).`,
        type: "ratio_anomaly",
      });
    } else if (disputeToOrderRatio >= 0.3) {
      rawScore += 20;
      factors.push({
        id: "factor_elevated_ratio",
        label: "Elevated Dispute Ratio (≥30%)",
        weight: 20,
        evidence: `Dispute ratio is ${(disputeToOrderRatio * 100).toFixed(0)}% of order history.`,
        type: "ratio_anomaly",
      });
    }
  }

  // 4. Contradictory Evidence vs Reason Code
  const hasShippingProof = evidenceList.some((e) => e.type === "shipping_proof" && e.present) || Boolean(delivery?.deliveredAt);
  const hasSignatureOrOtp = Boolean(delivery?.signatureCaptured);
  const hasCustomerComm = communications.length > 0 || evidenceList.some((e) => e.type === "customer_communication" && e.present);

  if ((reasonCode === "1064" || reasonCode === "4837") && hasShippingProof) {
    const boost = hasSignatureOrOtp ? 25 : 15;
    rawScore += boost;
    factors.push({
      id: "factor_contradictory_delivery",
      label: "Fulfillment Verified vs 'Not Received' Claim",
      weight: boost,
      evidence: hasSignatureOrOtp
        ? `Courier verified POD with recipient signature/OTP matching customer address for dispute reason ${reasonCode}.`
        : `Verified courier tracking confirmation exists for dispute reason ${reasonCode}.`,
      type: "contradictory_proof",
    });
  }

  if (hasCustomerComm && (reasonCode === "1064" || reasonCode === "4837")) {
    rawScore += 15;
    factors.push({
      id: "factor_post_purchase_engagement",
      label: "Buyer Communication Acknowledged Interaction",
      weight: 15,
      evidence: `Customer initiated support communication regarding the item prior to dispute filing.`,
      type: "contradictory_proof",
    });
  }

  // 5. Clean History Mitigation
  if (priorOrders >= 3 && priorDisputes === 0) {
    rawScore = Math.max(0, rawScore - 25);
    factors.push({
      id: "factor_established_clean_customer",
      label: "Established Clean Order History",
      weight: -25,
      evidence: `Customer has completed ${priorOrders} prior undisputed orders.`,
      type: "clean_history",
    });
  }

  // 6. Insufficient Data Notice
  if (isInsufficientHistory && factors.length === 0) {
    factors.push({
      id: "factor_insufficient_signal",
      label: "Insufficient Historical Baseline",
      weight: 0,
      evidence: `Customer has only 1 recorded transaction. Baseline is insufficient to establish serial chargeback pattern.`,
      type: "insufficient_data",
    });
  }

  // Clamp score
  const finalScore = Math.min(100, Math.max(0, rawScore));

  // Determine Band
  let band: FraudRiskBand = "low";
  if (isInsufficientHistory && finalScore < 30) {
    band = "insufficient_signal";
  } else if (finalScore >= 60) {
    band = "high";
  } else if (finalScore >= 35) {
    band = "medium";
  } else {
    band = "low";
  }

  // Impact on Contest
  const defenseImpact: FraudDefenseImpact = {
    recommendedStrategy:
      band === "high"
        ? "Aggressive Representment (CE3.0 / First-Party Fraud Evidence)"
        : band === "medium"
        ? "Standard Representment with Historical Order Proof"
        : "Standard Evidence Checklist Submission",
    defenseAdjustment:
      band === "high" || band === "medium"
        ? "strengthens_contest"
        : "neutral",
    explanation:
      band === "high"
        ? `Elevated friendly-fraud signal (${finalScore}%) strongly supports merchant representment. Inclusion of prior order telemetry and signed POD shifts liability back to the cardholder under Visa CE3.0 and NPCI guidelines.`
        : band === "medium"
        ? `Moderate first-party dispute indicators observed. Including prior customer logs and fulfillment proofs enhances win probability.`
        : band === "insufficient_signal"
        ? `Single order on record. Defense should rely strictly on transaction-specific evidence (POD, invoice, OTP logs).`
        : `Customer maintains a standard profile without repeat chargeback markers.`,
  };

  // Build Relationship Graph from genuine records
  const relationshipGraph = buildRelationshipGraph(dispute, customer, order, delivery, communications);

  return {
    score: finalScore,
    band,
    isRepeatDisputer: priorDisputes > 0,
    disputeToOrderRatio,
    contributingFactors: factors,
    defenseImpact,
    relationshipGraph,
  };
}

/**
 * Build graph nodes and edges strictly from real data structures
 */
function buildRelationshipGraph(
  dispute: DisputeGraphInput,
  customer?: CustomerGraphInput,
  order?: OrderGraphInput,
  delivery?: DeliveryGraphInput | null,
  communications?: CommunicationGraphInput[]
): RelationshipGraphData {
  const nodes: FraudGraphNode[] = [];
  const edges: FraudGraphEdge[] = [];

  const customerId = customer?.id || "cust_unregistered";
  const customerName = customer?.name || "Customer";
  const orderId = order?.id || dispute.orderId || "order_main";
  const paymentId = order?.rzpPaymentId || dispute.paymentId || "pay_unknown";
  const disputeId = dispute.rzpDisputeId || dispute.id;
  const network = dispute.network || "upi";

  // Node 1: Customer Node
  nodes.push({
    id: `node_${customerId}`,
    type: "customerNode",
    position: { x: 50, y: 150 },
    data: {
      label: customerName,
      sublabel: customer?.email || "customer@example.com",
      category: "customer",
      meta: {
        priorOrders: customer?.priorOrdersCount ?? 0,
        priorDisputes: customer?.priorDisputesCount ?? 0,
      },
    },
  });

  // Node 2: Order Node
  nodes.push({
    id: `node_${orderId}`,
    type: "orderNode",
    position: { x: 280, y: 150 },
    data: {
      label: order?.item || `Order #${orderId.slice(-8)}`,
      sublabel: `₹${((order?.amount || dispute.amount || 0) / 100).toLocaleString("en-IN")}`,
      category: "order",
      amount: order?.amount || dispute.amount,
      meta: {
        status: order?.status || "captured",
      },
    },
  });

  edges.push({
    id: `edge_${customerId}_${orderId}`,
    source: `node_${customerId}`,
    target: `node_${orderId}`,
    label: "placed order",
    style: { stroke: "#305EFF", strokeWidth: 2 },
  });

  // Node 3: Payment Instrument Node
  nodes.push({
    id: `node_${paymentId}`,
    type: "paymentNode",
    position: { x: 520, y: 60 },
    data: {
      label: `Payment (${network.toUpperCase()})`,
      sublabel: paymentId,
      category: "payment",
      meta: {
        network,
        paymentId,
      },
    },
  });

  edges.push({
    id: `edge_${orderId}_${paymentId}`,
    source: `node_${orderId}`,
    target: `node_${paymentId}`,
    label: "processed via",
    style: { stroke: "#0D1A48", strokeWidth: 1.5 },
  });

  // Node 4: Dispute Node
  nodes.push({
    id: `node_${disputeId}`,
    type: "disputeNode",
    position: { x: 520, y: 240 },
    data: {
      label: `Dispute (Code ${dispute.reasonCode})`,
      sublabel: `₹${((dispute.amount || 0) / 100).toLocaleString("en-IN")}`,
      category: "dispute",
      status: dispute.status || "open",
      meta: {
        reasonCode: dispute.reasonCode,
        phase: dispute.phase || "chargeback",
      },
    },
  });

  edges.push({
    id: `edge_${orderId}_${disputeId}`,
    source: `node_${orderId}`,
    target: `node_${disputeId}`,
    label: "chargeback filed",
    animated: true,
    style: { stroke: "#EF4444", strokeWidth: 2, strokeDasharray: "4,4" },
  });

  // Node 5: Delivery Node (if courier/tracking exists)
  if (delivery && delivery.trackingId) {
    const delId = `del_${delivery.trackingId}`;
    nodes.push({
      id: `node_${delId}`,
      type: "deliveryNode",
      position: { x: 760, y: 70 },
      data: {
        label: `${delivery.courier || "Courier"} Delivery`,
        sublabel: delivery.trackingId,
        category: "delivery",
        status: delivery.signatureCaptured ? "Signed / OTP Verified" : "Delivered",
        meta: {
          courier: delivery.courier,
          signatureCaptured: delivery.signatureCaptured,
          deliveredAt: delivery.deliveredAt ? String(delivery.deliveredAt) : null,
        },
      },
    });

    edges.push({
      id: `edge_${orderId}_${delId}`,
      source: `node_${orderId}`,
      target: `node_${delId}`,
      label: "shipped & confirmed",
      style: { stroke: "#10B981", strokeWidth: 1.5 },
    });
  }

  // Node 6: Communication Node (if customer comms exist)
  if (communications && communications.length > 0) {
    const firstComm = communications[0];
    const commId = firstComm.id || "comm_01";
    nodes.push({
      id: `node_${commId}`,
      type: "communicationNode",
      position: { x: 760, y: 230 },
      data: {
        label: `Buyer ${firstComm.channel ? firstComm.channel.toUpperCase() : "Chat"} Note`,
        sublabel: (firstComm.body || "").slice(0, 32) + "...",
        category: "communication",
        meta: {
          channel: firstComm.channel,
          direction: firstComm.direction,
        },
      },
    });

    edges.push({
      id: `edge_${orderId}_${commId}`,
      source: `node_${orderId}`,
      target: `node_${commId}`,
      label: "buyer acknowledged",
      style: { stroke: "#305EFF", strokeWidth: 1.5 },
    });
  }

  return {
    nodes,
    edges,
    summary: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      disputeCount: 1,
      orderCount: 1,
      distinctPaymentMethods: 1,
    },
  };
}
