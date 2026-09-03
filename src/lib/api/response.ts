import { NextResponse } from "next/server";

export interface ApiSuccessPayload<T> {
  ok: true;
  data?: T;
  count?: number;
  stats?: unknown;
  message?: string;
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  ok: false;
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

export function apiSuccess<T>(
  data: T,
  status: number = 200,
  additionalFields: Record<string, unknown> = {}
): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      data,
      ...additionalFields,
    },
    { status }
  );
}

export function apiError(
  message: string,
  status: number = 400,
  code?: string,
  details?: unknown
): NextResponse {
  const payload: ApiErrorPayload = {
    ok: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  if (code) {
    payload.code = code;
  }

  if (details && process.env.NODE_ENV !== "production") {
    payload.details = details;
  }

  return NextResponse.json(payload, { status });
}
