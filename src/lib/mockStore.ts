export interface MockDisputeRecord {
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
  dataSource?: "live" | "seed";
  data_source?: "live" | "seed";
  respondBy: Date;
  createdAt: Date;
  updatedAt: Date;
  order?: {
    id: string;
    rzpPaymentId: string;
    item: string;
    amount: number;
    currency: string;
    status: string;
    customer?: {
      id: string;
      name: string;
      email: string;
      address: string;
      priorOrdersCount: number;
      priorDisputesCount: number;
    };
    delivery?: {
      courier: string;
      trackingId: string;
      deliveredAt: Date | null;
      deliveredToAddress: string;
      signatureCaptured: boolean;
    } | null;
    communications?: {
      id: string;
      direction: string;
      channel: string;
      body: string;
      sentAt: Date;
    }[];
    refunds?: {
      id: string;
      amount: number;
      status: string;
      rzpRefundId?: string | null;
    }[];
  };
  evidenceItems: {
    id: string;
    type: string;
    present: boolean;
    documentRef?: string | null;
    note?: string | null;
  }[];
}

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
const daysAhead = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

export const fallbackDisputes: MockDisputeRecord[] = [
  // 1. UPI 1064: Score ~94 (High, Contest)
  {
    id: "disp_1064_goods_not_received",
    rzpDisputeId: "disp_rzp_1064_001",
    orderId: "order_upi_1064_001",
    paymentId: "pay_O1064UPI0001",
    reasonCode: "1064",
    network: "upi",
    amount: 2499900,
    currency: "INR",
    phase: "chargeback",
    status: "open",
    dataSource: "seed",
    data_source: "seed",
    respondBy: daysAhead(3),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    order: {
      id: "order_upi_1064_001",
      rzpPaymentId: "pay_O1064UPI0001",
      item: "Sony WH-1000XM5 Noise-Cancelling Headphones",
      amount: 2499900,
      currency: "INR",
      status: "captured",
      customer: {
        id: "cust_rohan_verma_01",
        name: "Rohan Verma",
        email: "rohan.verma@example.com",
        address: "Flat 402, Green Glen Layout, Bellandur, Bengaluru, KA 560103",
        priorOrdersCount: 5,
        priorDisputesCount: 0,
      },
      delivery: {
        courier: "BlueDart",
        trackingId: "BD-982144321IN",
        deliveredAt: daysAgo(3),
        deliveredToAddress: "Flat 402, Green Glen Layout, Bellandur, Bengaluru, KA 560103",
        signatureCaptured: true,
      },
      communications: [
        {
          id: "comm_01",
          direction: "inbound",
          channel: "email",
          body: "Hi, received the package yesterday. Where can I find the warranty registration link?",
          sentAt: daysAgo(2),
        },
      ],
      refunds: [],
    },
    evidenceItems: [
      {
        id: "ev_1",
        type: "shipping_proof",
        present: true,
        documentRef: "docs/proof_of_delivery_BD9821.pdf",
        note: "BlueDart Proof of Delivery signed by Rohan Verma with GPS tag matching customer address",
      },
      {
        id: "ev_2",
        type: "billing_proof",
        present: true,
        documentRef: "docs/tax_invoice_INV8821.pdf",
        note: "GST compliant Tax Invoice matching order amount ₹24,999.00",
      },
      {
        id: "ev_3",
        type: "customer_communication",
        present: true,
        documentRef: "docs/email_thread_acknowledgement.pdf",
        note: "Customer email acknowledging receipt of package",
      },
      {
        id: "ev_4",
        type: "term_and_conditions",
        present: true,
        documentRef: "docs/terms_and_conditions.pdf",
        note: "Merchant terms of service and delivery policy",
      },
    ],
  },

  // 2. UPI 108: Score ~82 (High, Contest)
  {
    id: "disp_108_beneficiary_not_credited",
    rzpDisputeId: "disp_rzp_108_002",
    orderId: "order_upi_108_002",
    paymentId: "pay_O108UPI0002",
    reasonCode: "108",
    network: "upi",
    amount: 850000,
    currency: "INR",
    phase: "chargeback",
    status: "open",
    dataSource: "seed",
    data_source: "seed",
    respondBy: daysAhead(4),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    order: {
      id: "order_upi_108_002",
      rzpPaymentId: "pay_O108UPI0002",
      item: "AWS Cloud Architecture Consultation (1 hr)",
      amount: 850000,
      currency: "INR",
      status: "captured",
      customer: {
        id: "cust_ananya_sharma_02",
        name: "Ananya Sharma",
        email: "ananya.sharma@example.com",
        address: "Tower 2, Apt 12B, Hiranandani Estate, Thane, MH 400607",
        priorOrdersCount: 2,
        priorDisputesCount: 0,
      },
      delivery: {
        courier: "Digital Service",
        trackingId: "DIGI-CAL-SESSION-8841",
        deliveredAt: daysAgo(2),
        deliveredToAddress: "ananya.sharma@example.com",
        signatureCaptured: false,
      },
      communications: [
        {
          id: "comm_02",
          direction: "inbound",
          channel: "chat",
          body: "Thanks for the consultation session today, the VPC peering roadmap was super clear!",
          sentAt: daysAgo(2),
        },
      ],
      refunds: [],
    },
    evidenceItems: [
      {
        id: "ev_5",
        type: "proof_of_service",
        present: true,
        documentRef: "docs/service_session_audit_log.pdf",
        note: "Zoom meeting metadata & completed calendar event confirmation",
      },
      {
        id: "ev_6",
        type: "billing_proof",
        present: true,
        documentRef: "docs/tax_invoice_INV8822.pdf",
        note: "Invoice generated upon successful payment capture and settlement",
      },
      {
        id: "ev_7",
        type: "customer_communication",
        present: true,
        documentRef: "docs/chat_log_session_completion.pdf",
        note: "Customer sent thank-you chat note confirming attendance",
      },
      {
        id: "ev_8",
        type: "explanation_letter",
        present: false,
        documentRef: null,
        note: "Formal rebuttal explanation letter pending generation",
      },
    ],
  },

  // 3. Card 4837: Score ~68 (Needs Evidence, Gather Evidence)
  {
    id: "disp_4837_no_cardholder_auth",
    rzpDisputeId: "disp_rzp_4837_003",
    orderId: "order_card_4837_003",
    paymentId: "pay_O4837CARD0003",
    reasonCode: "4837",
    network: "card",
    amount: 1450000,
    currency: "INR",
    phase: "chargeback",
    status: "open",
    dataSource: "seed",
    data_source: "seed",
    respondBy: daysAhead(5),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    order: {
      id: "order_card_4837_003",
      rzpPaymentId: "pay_O4837CARD0003",
      item: "Ergonomic High-Back Executive Mesh Chair",
      amount: 1450000,
      currency: "INR",
      status: "captured",
      customer: {
        id: "cust_vikram_malhotra_03",
        name: "Vikram Aditya Malhotra",
        email: "vikram.malhotra@example.com",
        address: "B-14, Vasant Vihar, New Delhi, DL 110057",
        priorOrdersCount: 1,
        priorDisputesCount: 0,
      },
      delivery: {
        courier: "Delhivery",
        trackingId: "DEL-847291039IN",
        deliveredAt: daysAgo(4),
        deliveredToAddress: "B-14, Vasant Vihar, New Delhi, DL 110057",
        signatureCaptured: true,
      },
      communications: [],
      refunds: [],
    },
    evidenceItems: [
      {
        id: "ev_9",
        type: "access_activity_log",
        present: true,
        documentRef: "docs/3ds_authentication_log.pdf",
        note: "3D-Secure 2.0 liability shift authenticated with bank OTP",
      },
      {
        id: "ev_10",
        type: "shipping_proof",
        present: true,
        documentRef: "docs/delhivery_pod_signature.pdf",
        note: "OTP verified physical delivery at cardholder billing address",
      },
      {
        id: "ev_11",
        type: "billing_proof",
        present: true,
        documentRef: "docs/invoice_INV8823.pdf",
        note: "Billing and shipping address match cardholder records",
      },
      {
        id: "ev_11b",
        type: "explanation_letter",
        present: false,
        documentRef: null,
        note: "Formal rebuttal explanation letter pending generation",
      },
    ],
  },

  // 4. UPI 1062: Score ~45 (Low, Accept)
  {
    id: "disp_1062_goods_not_as_described",
    rzpDisputeId: "disp_rzp_1062_006",
    orderId: "order_upi_1062_006",
    paymentId: "pay_O1062UPI0006",
    reasonCode: "1062",
    network: "upi",
    amount: 650000,
    currency: "INR",
    phase: "chargeback",
    status: "open",
    dataSource: "seed",
    data_source: "seed",
    respondBy: daysAhead(4),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    order: {
      id: "order_upi_1062_006",
      rzpPaymentId: "pay_O1062UPI0006",
      item: "Handcrafted Italian Leather Messenger Bag (Tan Brown)",
      amount: 650000,
      currency: "INR",
      status: "captured",
      customer: {
        id: "cust_sneha_kulkarni_06",
        name: "Sneha Kulkarni",
        email: "sneha.kulkarni@example.com",
        address: "Flat 501, Pride World City, Pune, MH 412105",
        priorOrdersCount: 2,
        priorDisputesCount: 0,
      },
      delivery: {
        courier: "BlueDart",
        trackingId: "BD-481920381IN",
        deliveredAt: daysAgo(4),
        deliveredToAddress: "Flat 501, Pride World City, Pune, MH 412105",
        signatureCaptured: true,
      },
      communications: [
        {
          id: "comm_06",
          direction: "inbound",
          channel: "chat",
          body: "The bag received is darker chocolate brown instead of Tan Brown.",
          sentAt: daysAgo(3),
        },
      ],
      refunds: [],
    },
    evidenceItems: [
      {
        id: "ev_16",
        type: "shipping_proof",
        present: true,
        documentRef: "docs/bluedart_delivery_pod.pdf",
        note: "Physical delivery confirmed and received by customer",
      },
      {
        id: "ev_17",
        type: "refund_cancellation_policy",
        present: true,
        documentRef: "docs/replacement_policy.pdf",
        note: "Merchant terms require inspection photos before dispute filing",
      },
      {
        id: "ev_18",
        type: "billing_proof",
        present: true,
        documentRef: "docs/tax_invoice_INV8826.pdf",
        note: "General tax invoice for leather item (without catalog specifications verification)",
      },
      {
        id: "ev_19",
        type: "customer_communication",
        present: false,
        documentRef: null,
        note: "Pre-dispute customer support resolution not completed before chargeback",
      },
    ],
  },

  // 5. UPI 1061: Score ~23 (Low, Accept)
  {
    id: "disp_1061_credit_not_processed",
    rzpDisputeId: "disp_rzp_1061_004",
    orderId: "order_upi_1061_004",
    paymentId: "pay_O1061UPI0004",
    reasonCode: "1061",
    network: "upi",
    amount: 420000,
    currency: "INR",
    phase: "chargeback",
    status: "open",
    dataSource: "seed",
    data_source: "seed",
    respondBy: daysAhead(2),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    order: {
      id: "order_upi_1061_004",
      rzpPaymentId: "pay_O1061UPI0004",
      item: "Custom Mechanical Keyboard (Returned Item)",
      amount: 420000,
      currency: "INR",
      status: "paid",
      customer: {
        id: "cust_priya_nambiar_04",
        name: "Priya Nambiar",
        email: "priya.nambiar@example.com",
        address: "A-304, Palm Meadows, Whitefield, Bengaluru, KA 560066",
        priorOrdersCount: 3,
        priorDisputesCount: 1,
      },
      delivery: {
        courier: "Shadowfax",
        trackingId: "SF-492019482IN",
        deliveredAt: daysAgo(10),
        deliveredToAddress: "A-304, Palm Meadows, Whitefield, Bengaluru, KA 560066",
        signatureCaptured: true,
      },
      communications: [
        {
          id: "comm_04",
          direction: "inbound",
          channel: "email",
          body: "I shipped the defective keyboard back 6 days ago. When will my ₹4,200 refund be credited?",
          sentAt: daysAgo(4),
        },
      ],
      refunds: [],
    },
    evidenceItems: [
      {
        id: "ev_12",
        type: "refund_confirmation",
        present: false,
        note: "No refund transaction ARN or bank UTR exists in gateway records",
      },
      {
        id: "ev_14",
        type: "refund_cancellation_policy",
        present: true,
        documentRef: "docs/return_policy.pdf",
        note: "Merchant 7-day return policy stating refund upon warehouse receipt",
      },
      {
        id: "ev_13",
        type: "customer_communication",
        present: false,
        documentRef: null,
        note: "Customer communication timeline not resolved",
      },
    ],
  },

  // 6. UPI 1084: Score ~12 (Low, Accept - Merchant Error)
  {
    id: "disp_1084_duplicate_processing",
    rzpDisputeId: "disp_rzp_1084_005",
    orderId: "order_upi_1084_005",
    paymentId: "pay_O1084UPI0005B",
    reasonCode: "1084",
    network: "upi",
    amount: 299900,
    currency: "INR",
    phase: "chargeback",
    status: "open",
    dataSource: "seed",
    data_source: "seed",
    respondBy: daysAhead(3),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    order: {
      id: "order_upi_1084_005",
      rzpPaymentId: "pay_O1084UPI0005B",
      item: "Annual Cloud Workspace Subscription (Duplicate Debit)",
      amount: 299900,
      currency: "INR",
      status: "paid",
      customer: {
        id: "cust_amitav_ghosh_05",
        name: "Amitav Ghosh",
        email: "amitav.ghosh@example.com",
        address: "Flat 7C, Salt Lake Sector V, Kolkata, WB 700091",
        priorOrdersCount: 8,
        priorDisputesCount: 0,
      },
      delivery: null,
      communications: [
        {
          id: "comm_05",
          direction: "inbound",
          channel: "email",
          body: "I was debited twice for ₹2,999 on UPI for the same renewal! Please refund the duplicate.",
          sentAt: daysAgo(3),
        },
      ],
      refunds: [],
    },
    evidenceItems: [
      {
        id: "ev_15",
        type: "billing_proof",
        present: false,
        note: "Double debit detected on gateway ledger without separate order or invoice.",
      },
      {
        id: "ev_15b",
        type: "explanation_letter",
        present: false,
        note: "Merchant error - duplicate charge confirmed on payment gateway telemetry.",
      },
    ],
  },
];

// In-memory dispute state for resilient demo operations
const inMemoryStore: MockDisputeRecord[] = JSON.parse(JSON.stringify(fallbackDisputes));

export function getInMemoryDisputes(): MockDisputeRecord[] {
  return inMemoryStore;
}

export function getInMemoryDisputeById(id: string): MockDisputeRecord | undefined {
  return inMemoryStore.find((d) => d.id === id || d.rzpDisputeId === id);
}

export function updateInMemoryDisputeStatus(id: string, status: string): MockDisputeRecord | undefined {
  const dispute = getInMemoryDisputeById(id);
  if (dispute) {
    dispute.status = status;
  }
  return dispute;
}

export function addInMemoryDispute(dispute: MockDisputeRecord): void {
  const existingIndex = inMemoryStore.findIndex((d) => d.id === dispute.id || d.rzpDisputeId === dispute.rzpDisputeId);
  if (existingIndex >= 0) {
    inMemoryStore[existingIndex] = dispute;
  } else {
    inMemoryStore.unshift(dispute);
  }
}

export function resetInMemoryDisputes(): void {
  inMemoryStore.length = 0;
  inMemoryStore.push(...JSON.parse(JSON.stringify(fallbackDisputes)));
}

export interface MockWebhookEventRecord {
  id: string;
  disputeId?: string | null;
  eventType: string;
  signatureVerified: boolean;
  payloadHash: string;
  receivedAt: Date;
  processedAt?: Date | null;
  rawHeaders?: string | null;
  status: string;
  payload?: string | null;
  createdAt: Date;
}

export interface MockAuditEventRecord {
  id: string;
  eventType: string;
  action: string;
  actorType: string;
  actorId?: string | null;
  source: string;
  disputeId?: string | null;
  merchantId?: string | null;
  correlationId: string;
  requestId?: string | null;
  beforeState?: string | null;
  afterState?: string | null;
  details?: string | null;
  metadata?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

const inMemoryWebhookEvents: MockWebhookEventRecord[] = [];
const inMemoryAuditEvents: MockAuditEventRecord[] = [];

export function getInMemoryWebhookEvents(): MockWebhookEventRecord[] {
  return inMemoryWebhookEvents;
}

export function getInMemoryWebhookEventByHash(payloadHash: string): MockWebhookEventRecord | undefined {
  return inMemoryWebhookEvents.find((e) => e.payloadHash === payloadHash);
}

export function addInMemoryWebhookEvent(event: MockWebhookEventRecord): void {
  const existingIdx = inMemoryWebhookEvents.findIndex((e) => e.payloadHash === event.payloadHash || e.id === event.id);
  if (existingIdx >= 0) {
    inMemoryWebhookEvents[existingIdx] = event;
  } else {
    inMemoryWebhookEvents.unshift(event);
  }
}

export function getInMemoryAuditEvents(disputeId?: string): MockAuditEventRecord[] {
  if (disputeId) {
    return inMemoryAuditEvents.filter((a) => a.disputeId === disputeId);
  }
  return inMemoryAuditEvents;
}

export function queryInMemoryAuditEvents(filters: {
  disputeId?: string;
  merchantId?: string;
  eventType?: string;
  actorType?: string;
  actorId?: string;
  correlationId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  limit?: number;
  offset?: number;
}): MockAuditEventRecord[] {
  let results = inMemoryAuditEvents;

  if (filters.disputeId) {
    results = results.filter((e) => e.disputeId === filters.disputeId);
  }
  if (filters.merchantId) {
    results = results.filter((e) => e.merchantId === filters.merchantId);
  }
  if (filters.eventType) {
    results = results.filter((e) => e.eventType === filters.eventType || e.action === filters.eventType);
  }
  if (filters.actorType) {
    results = results.filter((e) => e.actorType === filters.actorType);
  }
  if (filters.actorId) {
    results = results.filter((e) => e.actorId === filters.actorId);
  }
  if (filters.correlationId) {
    results = results.filter((e) => e.correlationId === filters.correlationId);
  }
  if (filters.startDate) {
    const start = new Date(filters.startDate).getTime();
    results = results.filter((e) => e.createdAt.getTime() >= start);
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate).getTime();
    results = results.filter((e) => e.createdAt.getTime() <= end);
  }

  const offset = filters.offset || 0;
  const limit = filters.limit || 100;
  return results.slice(offset, offset + limit);
}

export function addInMemoryAuditEvent(event: MockAuditEventRecord): void {
  inMemoryAuditEvents.unshift(event);
}

export function resetInMemoryWebhookStore(): void {
  inMemoryWebhookEvents.length = 0;
  inMemoryAuditEvents.length = 0;
}

export function resetInMemoryAuditStore(): void {
  inMemoryAuditEvents.length = 0;
}

