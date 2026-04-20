import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

type ApiErrorDetails =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

function timestamp() {
  return new Date().toISOString();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function apiSuccess<T>(data: T, status = 200) {
  const base = {
    ok: true as const,
    status,
    data,
    timestamp: timestamp(),
  };

  const payload = isPlainObject(data) ? { ...base, ...data } : base;
  return NextResponse.json(payload, { status });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: ApiErrorDetails,
) {
  return NextResponse.json(
    {
      ok: false as const,
      status,
      code,
      message,
      error: message,
      ...(details !== undefined ? { details } : {}),
      timestamp: timestamp(),
    },
    { status },
  );
}

export function apiBadRequest(
  message: string,
  code = "BAD_REQUEST",
  details?: ApiErrorDetails,
) {
  return apiError(400, code, message, details);
}

export function apiUnauthorized(
  message = "Unauthorized",
  code = "UNAUTHORIZED",
) {
  return apiError(401, code, message);
}

export function apiForbidden(message = "Forbidden", code = "FORBIDDEN") {
  return apiError(403, code, message);
}

export function apiNotFound(message: string, code = "NOT_FOUND") {
  return apiError(404, code, message);
}

export function apiConflict(message: string, code = "CONFLICT") {
  return apiError(409, code, message);
}

export function apiTooManyRequests(
  message = "Too many requests. Please try again shortly.",
  code = "RATE_LIMITED",
) {
  return apiError(429, code, message);
}

export function apiServiceUnavailable(
  message: string,
  code = "SERVICE_UNAVAILABLE",
) {
  return apiError(503, code, message);
}

export function apiInternalError(
  scope: string,
  error: unknown,
  message: string,
  code = "INTERNAL_ERROR",
) {
  logError(scope, error);
  return apiError(500, code, message);
}
