import type { RequestHandler } from "express";

import { env } from "../config/env";

import { logSecurityEvent } from "./audit";
import { isSafeHttpMethod, isTrustedOrigin, normalizeOrigin } from "./config";

function rejectSuspiciousRequest(
  response: Parameters<RequestHandler>[1],
  reason: string,
  metadata: Record<string, unknown>
) {
  logSecurityEvent({
    category: "csrf",
    action: "request_blocked",
    metadata: {
      reason,
      ...metadata
    }
  });

  response.status(403).json({
    message: "A solicitacao foi bloqueada pela politica de seguranca."
  });
}

export const protectCookieSessionMutations: RequestHandler = (request, response, next) => {
  if (isSafeHttpMethod(request.method)) {
    return next();
  }

  const hasSessionCookie = Boolean(request.cookies?.[env.AUTH_COOKIE_NAME]);

  if (!hasSessionCookie) {
    return next();
  }

  const origin = request.get("origin");
  const referer = request.get("referer");
  const fetchSite = request.get("sec-fetch-site");

  if (fetchSite === "cross-site") {
    return rejectSuspiciousRequest(response, "cross_site_fetch_metadata", {
      method: request.method,
      path: request.originalUrl,
      fetchSite
    });
  }

  if (origin && !isTrustedOrigin(origin)) {
    return rejectSuspiciousRequest(response, "untrusted_origin", {
      method: request.method,
      path: request.originalUrl,
      origin: normalizeOrigin(origin)
    });
  }

  if (!origin && referer && !isTrustedOrigin(referer)) {
    return rejectSuspiciousRequest(response, "untrusted_referer", {
      method: request.method,
      path: request.originalUrl,
      referer: normalizeOrigin(referer)
    });
  }

  return next();
};
