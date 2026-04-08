import { createHash } from "crypto";

import type { Request } from "express";

interface SessionFingerprintContext {
  acceptLanguage: string;
  secChUaPlatform: string;
  userAgent: string;
}

function normalizeHeaderValue(value?: string | null) {
  return value?.trim().toLowerCase() || "unknown";
}

export function getSessionFingerprintContext(request: Request): SessionFingerprintContext {
  return {
    userAgent: normalizeHeaderValue(request.get("user-agent")),
    acceptLanguage: normalizeHeaderValue(request.get("accept-language")),
    secChUaPlatform: normalizeHeaderValue(request.get("sec-ch-ua-platform"))
  };
}

export function buildSessionFingerprint(context: SessionFingerprintContext) {
  return createHash("sha256")
    .update(`${context.userAgent}|${context.acceptLanguage}|${context.secChUaPlatform}`)
    .digest("hex");
}
