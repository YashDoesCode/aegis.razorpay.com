export type AuditEventType =
  | "DISPUTE_IMPORTED"
  | "DISPUTE_SYNCED"
  | "SCORE_COMPUTED"
  | "SCORE_RECOMPUTED"
  | "FRAUD_ANALYZED"
  | "EVIDENCE_VERIFIED"
  | "EVIDENCE_UPDATED"
  | "REBUTTAL_GENERATED"
  | "SAFE_MODE_USED"
  | "DRAFT_STAGED"
  | "DISPUTE_ACCEPTED"
  | "WEBHOOK_RECEIVED"
  | "WEBHOOK_IGNORED"
  | "DISPUTE_CREATED"
  | "DISPUTE_UNDER_REVIEW"
  | "DISPUTE_WON"
  | "DISPUTE_LOST"
  | "MERCHANT_CONNECTED"
  | "MERCHANT_DISCONNECTED"
  | "LIVE_MODE_ENABLED"
  | "TEST_MODE_ENABLED"
  | "SETTINGS_UPDATED";

export type AuditActorType = "merchant" | "system" | "admin" | "webhook" | "api";

export type AuditSource = "api" | "webhook" | "ui" | "system" | "cron";

export interface RecordAuditParams {
  eventType: AuditEventType | string;
  action?: string;
  actorType?: AuditActorType;
  actorId?: string;
  source?: AuditSource;
  disputeId?: string;
  merchantId?: string;
  correlationId?: string;
  requestId?: string;
  beforeState?: Record<string, unknown> | string | null;
  afterState?: Record<string, unknown> | string | null;
  metadata?: Record<string, unknown> | string | null;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditRecord {
  id: string;
  eventType: string;
  action: string;
  actorType: string;
  actorId: string | null;
  source: string;
  disputeId: string | null;
  merchantId: string | null;
  correlationId: string;
  requestId: string | null;
  beforeState: string | null;
  afterState: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface AuditQueryFilters {
  disputeId?: string;
  merchantId?: string;
  eventType?: AuditEventType | string;
  actorType?: AuditActorType;
  actorId?: string;
  correlationId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  limit?: number;
  offset?: number;
}
