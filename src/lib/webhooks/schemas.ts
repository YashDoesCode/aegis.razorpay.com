import { z } from "zod";

export const SUPPORTED_DISPUTE_EVENTS = [
  "dispute.created",
  "dispute.under_review",
  "dispute.won",
  "dispute.lost",
] as const;

export type SupportedDisputeEvent = (typeof SUPPORTED_DISPUTE_EVENTS)[number];

export function isSupportedDisputeEvent(
  event: string
): event is SupportedDisputeEvent {
  return SUPPORTED_DISPUTE_EVENTS.includes(event as SupportedDisputeEvent);
}

export const RazorpayDisputeEntitySchema = z.object({
  id: z.string().min(1),
  entity: z.string().optional(),
  payment_id: z.string().min(1),
  amount: z.number().int().nonnegative(),
  currency: z.string().default("INR"),
  reason_code: z.string().default("1064"),
  status: z.string(),
  phase: z.string().optional().default("chargeback"),
  respond_by: z.number().int().positive().optional().nullable(),
  created_at: z.number().int().positive().optional().nullable(),
  comments: z.string().optional().nullable(),
});

export type RazorpayDisputeEntity = z.infer<typeof RazorpayDisputeEntitySchema>;

export const RazorpayWebhookPayloadSchema = z.object({
  entity: z.string().optional(),
  account_id: z.string().optional(),
  event: z.string().min(1),
  contains: z.array(z.string()).optional(),
  payload: z.object({
    dispute: z.object({
      entity: RazorpayDisputeEntitySchema,
    }),
  }),
  created_at: z.number().int().positive().optional(),
});

export type RazorpayWebhookPayload = z.infer<typeof RazorpayWebhookPayloadSchema>;
