import { z } from "zod";

export const EvidenceTypeSchema = z.enum([
  "shipping_proof",
  "billing_proof",
  "customer_communication",
  "proof_of_service",
  "explanation_letter",
  "refund_confirmation",
  "access_activity_log",
  "refund_cancellation_policy",
  "term_and_conditions",
  "others",
]);

export const EvidenceItemSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  present: z.boolean(),
  documentRef: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const CustomerSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  priorOrdersCount: z.number().int().min(0).default(0),
  priorDisputesCount: z.number().int().min(0).default(0),
});

export const DeliverySchema = z.object({
  courier: z.string().nullable().optional(),
  trackingId: z.string().nullable().optional(),
  deliveredAt: z.union([z.date(), z.string(), z.null()]).optional(),
  deliveredToAddress: z.string().nullable().optional(),
  signatureCaptured: z.boolean().default(false),
});

export const CommunicationSchema = z.object({
  direction: z.string(),
  channel: z.string(),
  body: z.string(),
  sentAt: z.union([z.date(), z.string()]).optional(),
});

export const RefundSchema = z.object({
  amount: z.number().int().min(0),
  status: z.string(),
  rzpRefundId: z.string().nullable().optional(),
});

export const OrderSchema = z.object({
  id: z.string().optional(),
  rzpPaymentId: z.string().optional(),
  item: z.string().optional(),
  amount: z.number().int().min(0).optional(),
  currency: z.string().default("INR"),
  status: z.string().optional(),
  customer: CustomerSchema.optional(),
  delivery: DeliverySchema.nullable().optional(),
  communications: z.array(CommunicationSchema).optional(),
  refunds: z.array(RefundSchema).optional(),
});

export const DisputeSchema = z.object({
  id: z.string(),
  reasonCode: z.string(),
  network: z.string().optional(),
  amount: z.number().int().min(0).optional(),
  currency: z.string().default("INR"),
  phase: z.string().optional(),
  status: z.string().optional(),
  order: OrderSchema.optional(),
});

export const ComputeWinnabilityInputSchema = z.object({
  dispute: DisputeSchema,
  evidenceItems: z.array(EvidenceItemSchema).optional().default([]),
  customer: CustomerSchema.optional(),
});
