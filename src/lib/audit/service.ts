import crypto from "crypto";
import { prisma } from "../prisma";
import { logger } from "../logger";
import {
  RecordAuditParams,
  AuditRecord,
  AuditQueryFilters,
} from "./types";
import { generateCorrelationId, generateRequestId } from "./correlation";
import {
  addInMemoryAuditEvent,
  queryInMemoryAuditEvents,
  MockAuditEventRecord,
} from "../mockStore";

function maskSensitiveData(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => maskSensitiveData(item));
  }

  if (typeof input === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("secret") ||
        lowerKey.includes("key") ||
        lowerKey.includes("password") ||
        lowerKey.includes("authorization") ||
        lowerKey.includes("token") ||
        lowerKey.includes("bearer") ||
        lowerKey.includes("signature")
      ) {
        if (typeof value === "string" && value.length > 8) {
          output[key] = `${value.slice(0, 4)}...${value.slice(-4)}`;
        } else {
          output[key] = "[REDACTED]";
        }
      } else if (typeof value === "object" && value !== null) {
        output[key] = maskSensitiveData(value);
      } else {
        output[key] = value;
      }
    }
    return output;
  }

  return input;
}

function safeStringify(data: unknown): string | null {
  if (data === null || data === undefined) {
    return null;
  }
  if (typeof data === "string") {
    return data;
  }
  try {
    const masked = maskSensitiveData(data);
    return JSON.stringify(masked);
  } catch {
    return null;
  }
}

export class AuditService {
  public static async record(params: RecordAuditParams): Promise<AuditRecord> {
    const eventId = `aud_${crypto.randomUUID().replace(/-/g, "")}`;
    const correlationId =
      params.correlationId && params.correlationId.trim() !== ""
        ? params.correlationId.trim()
        : generateCorrelationId();
    const requestId =
      params.requestId && params.requestId.trim() !== ""
        ? params.requestId.trim()
        : generateRequestId();
    const now = new Date();

    const eventType = params.eventType;
    const action = params.action || eventType;
    const actorType = params.actorType || "system";
    const actorId = params.actorId || null;
    const source = params.source || "system";
    const disputeId = params.disputeId || null;
    const merchantId = params.merchantId || null;

    const beforeState = safeStringify(params.beforeState);
    const afterState = safeStringify(params.afterState);
    const metadata = safeStringify(params.metadata);
    const ipAddress = params.ipAddress || null;
    const userAgent = params.userAgent || null;

    const memoryRecord: MockAuditEventRecord = {
      id: eventId,
      eventType,
      action,
      actorType,
      actorId,
      source,
      disputeId,
      merchantId,
      correlationId,
      requestId,
      beforeState,
      afterState,
      details: metadata,
      metadata,
      ipAddress,
      userAgent,
      createdAt: now,
    };

    addInMemoryAuditEvent(memoryRecord);

    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
    if (!isTest) {
      try {
        await prisma.auditEvent.create({
          data: {
            id: eventId,
            eventType,
            action,
            actorType,
            actorId,
            source,
            disputeId,
            merchantId,
            correlationId,
            requestId,
            beforeState,
            afterState,
            details: metadata,
            metadata,
            ipAddress,
            userAgent,
            createdAt: now,
          },
        });
      } catch (err) {
        logger.warn("Non-fatal: failed to persist audit event to database", {
          module: "AuditService",
          correlationId,
          requestId,
          eventType,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    logger.info(`Audit: ${eventType} recorded`, {
      module: "AuditService",
      correlationId,
      requestId,
      disputeId: disputeId || undefined,
      merchantId: merchantId || undefined,
      auditEventId: eventId,
      eventType,
      actorType,
    });

    return {
      id: eventId,
      eventType,
      action,
      actorType,
      actorId,
      source,
      disputeId,
      merchantId,
      correlationId,
      requestId,
      beforeState,
      afterState,
      metadata,
      ipAddress,
      userAgent,
      createdAt: now,
    };
  }

  public static async query(filters: AuditQueryFilters = {}): Promise<AuditRecord[]> {
    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";

    if (isTest) {
      const memResults = queryInMemoryAuditEvents({
        disputeId: filters.disputeId,
        merchantId: filters.merchantId,
        eventType: filters.eventType,
        actorType: filters.actorType,
        actorId: filters.actorId,
        correlationId: filters.correlationId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: filters.limit,
        offset: filters.offset,
      });

      return memResults.map((r) => ({
        id: r.id,
        eventType: r.eventType,
        action: r.action,
        actorType: r.actorType,
        actorId: r.actorId || null,
        source: r.source,
        disputeId: r.disputeId || null,
        merchantId: r.merchantId || null,
        correlationId: r.correlationId,
        requestId: r.requestId || null,
        beforeState: r.beforeState || null,
        afterState: r.afterState || null,
        metadata: r.metadata || r.details || null,
        ipAddress: r.ipAddress || null,
        userAgent: r.userAgent || null,
        createdAt: r.createdAt,
      }));
    }

    try {
      const where: Record<string, unknown> = {};

      if (filters.disputeId) {
        where.disputeId = filters.disputeId;
      }
      if (filters.merchantId) {
        where.merchantId = filters.merchantId;
      }
      if (filters.eventType) {
        where.eventType = filters.eventType;
      }
      if (filters.actorType) {
        where.actorType = filters.actorType;
      }
      if (filters.actorId) {
        where.actorId = filters.actorId;
      }
      if (filters.correlationId) {
        where.correlationId = filters.correlationId;
      }
      if (filters.startDate || filters.endDate) {
        const dateFilter: Record<string, Date> = {};
        if (filters.startDate) {
          dateFilter.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          dateFilter.lte = new Date(filters.endDate);
        }
        where.createdAt = dateFilter;
      }

      const rows = await prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      });

      return rows.map((r) => ({
        id: r.id,
        eventType: r.eventType,
        action: r.action || r.eventType,
        actorType: r.actorType,
        actorId: r.actorId,
        source: r.source,
        disputeId: r.disputeId,
        merchantId: r.merchantId,
        correlationId: r.correlationId,
        requestId: r.requestId,
        beforeState: r.beforeState,
        afterState: r.afterState,
        metadata: r.metadata || r.details,
        ipAddress: r.ipAddress,
        userAgent: r.userAgent,
        createdAt: r.createdAt,
      }));
    } catch (err) {
      logger.warn("Querying audit events from database failed, falling back to memory store", {
        module: "AuditService",
        error: err instanceof Error ? err.message : String(err),
      });

      const memResults = queryInMemoryAuditEvents({
        disputeId: filters.disputeId,
        merchantId: filters.merchantId,
        eventType: filters.eventType,
        actorType: filters.actorType,
        actorId: filters.actorId,
        correlationId: filters.correlationId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: filters.limit,
        offset: filters.offset,
      });

      return memResults.map((r) => ({
        id: r.id,
        eventType: r.eventType,
        action: r.action,
        actorType: r.actorType,
        actorId: r.actorId || null,
        source: r.source,
        disputeId: r.disputeId || null,
        merchantId: r.merchantId || null,
        correlationId: r.correlationId,
        requestId: r.requestId || null,
        beforeState: r.beforeState || null,
        afterState: r.afterState || null,
        metadata: r.metadata || r.details || null,
        ipAddress: r.ipAddress || null,
        userAgent: r.userAgent || null,
        createdAt: r.createdAt,
      }));
    }
  }

  public static async getByDispute(disputeId: string, limit: number = 50): Promise<AuditRecord[]> {
    return this.query({ disputeId, limit });
  }

  public static async getByMerchant(merchantId: string, limit: number = 50): Promise<AuditRecord[]> {
    return this.query({ merchantId, limit });
  }

  public static async getByCorrelationId(correlationId: string): Promise<AuditRecord[]> {
    return this.query({ correlationId, limit: 100 });
  }
}

export default AuditService;
