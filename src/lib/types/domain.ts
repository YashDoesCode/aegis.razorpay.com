import { WinnabilityResult, EvidenceType, DisputeData } from "../scoring/types";
import { FraudSignalResult } from "../fraudSignal/types";

export interface CustomerDomain {
  id?: string;
  name: string;
  email?: string | null;
  address?: string | null;
  priorOrdersCount: number;
  priorDisputesCount: number;
}

export interface DeliveryDomain {
  id?: string;
  orderId?: string;
  courier?: string | null;
  trackingId?: string | null;
  deliveredAt?: string | Date | null;
  deliveredToAddress?: string | null;
  signatureCaptured?: boolean;
}

export interface CommunicationDomain {
  id?: string;
  orderId?: string;
  direction: string;
  channel: string;
  body: string;
  sentAt?: string | Date;
}

export interface RefundDomain {
  id?: string;
  orderId?: string;
  amount: number;
  status: string;
  rzpRefundId?: string | null;
}

export interface OrderDomain {
  id?: string;
  rzpPaymentId?: string;
  customerId?: string;
  item?: string;
  amount?: number;
  currency?: string;
  status?: string;
  customer?: CustomerDomain;
  delivery?: DeliveryDomain | null;
  communications?: CommunicationDomain[];
  refunds?: RefundDomain[];
}

export interface EvidenceItemDomain {
  id?: string;
  disputeId?: string;
  type: EvidenceType | string;
  present: boolean;
  documentRef?: string | null;
  note?: string | null;
}

export interface DisputeWithRelations extends DisputeData {
  id: string;
  rzpDisputeId: string;
  orderId: string;
  paymentId: string;
  reasonCode: string;
  network: string;
  amount: number;
  currency: string;
  phase: string;
  status: string;
  mode?: "test" | "live";
  dataSource?: "live" | "seed";
  data_source?: "live" | "seed";
  isDemo?: boolean;
  respondBy: string | Date;
  createdAt: string | Date;
  updatedAt?: string | Date;
  order?: OrderDomain;
  evidenceItems: EvidenceItemDomain[];
  winnability?: WinnabilityResult;
  fraudSignal?: FraudSignalResult;
}

export interface DisputeKpiStats {
  totalCount: number;
  totalPendingAmount: number;
  high: { count: number; amount: number };
  needsEvidence: { count: number; amount: number };
  low: { count: number; amount: number };
}
