import type { Request } from "express";

import { env } from "../config/env";

const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const trustedOrigins = new Set([env.FRONTEND_URL]);

if (env.NODE_ENV !== "production") {
  trustedOrigins.add("http://localhost:3000");
  trustedOrigins.add("http://127.0.0.1:3000");
  trustedOrigins.add("http://[::1]:3000");
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-z0-9._:-]/gi, "_").toLowerCase();
}

export function isSafeHttpMethod(method: string) {
  return SAFE_HTTP_METHODS.has(method.toUpperCase());
}

export function getTrustedOrigins() {
  return new Set(trustedOrigins);
}

export function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isTrustedOrigin(value?: string | null) {
  const normalized = normalizeOrigin(value);
  return normalized ? trustedOrigins.has(normalized) : false;
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
    return forwardedFor.split(",")[0]!.trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0].trim();
  }

  return request.ip || request.socket.remoteAddress || "unknown";
}

export function getNormalizedEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

export function buildRequestIdentity(...parts: Array<string | null | undefined>) {
  return parts
    .map((part) => sanitizeSegment(part?.trim() || "anonymous"))
    .join(":");
}
