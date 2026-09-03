import crypto from "crypto";
import { NextRequest } from "next/server";

export interface TraceContext {
  correlationId: string;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
}

export function generateCorrelationId(): string {
  return `corr_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function generateRequestId(): string {
  return `req_${crypto.randomUUID().slice(0, 12)}`;
}

export function extractTraceContext(
  req?: NextRequest | Request | Headers | Record<string, unknown> | null
): TraceContext {
  if (!req) {
    return {
      correlationId: generateCorrelationId(),
      requestId: generateRequestId(),
    };
  }

  let correlationId: string | null = null;
  let requestId: string | null = null;
  let ipAddress: string | undefined;
  let userAgent: string | undefined;

  if ("headers" in req && req.headers) {
    const headers = req.headers as Headers;
    correlationId = headers.get("x-correlation-id");
    requestId = headers.get("x-request-id");
    ipAddress =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      undefined;
    userAgent = headers.get("user-agent") || undefined;
  } else if (req instanceof Headers) {
    correlationId = req.get("x-correlation-id");
    requestId = req.get("x-request-id");
    ipAddress =
      req.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.get("x-real-ip") ||
      undefined;
    userAgent = req.get("user-agent") || undefined;
  } else if (typeof req === "object") {
    const record = req as Record<string, unknown>;
    correlationId = (record["x-correlation-id"] || record["correlationId"]) as string | null;
    requestId = (record["x-request-id"] || record["requestId"]) as string | null;
    ipAddress = (record["x-forwarded-for"] || record["ipAddress"]) as string | undefined;
    userAgent = (record["user-agent"] || record["userAgent"]) as string | undefined;
  }

  return {
    correlationId: correlationId && correlationId.trim() !== "" ? correlationId.trim() : generateCorrelationId(),
    requestId: requestId && requestId.trim() !== "" ? requestId.trim() : generateRequestId(),
    ipAddress,
    userAgent,
  };
}
