import type { RequestHandler } from "express";

import { env } from "../config/env";

export const applySecurityHeaders: RequestHandler = (_request, response, next) => {
  response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Resource-Policy", "same-site");
  response.setHeader("Origin-Agent-Cluster", "?1");
  response.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=(), usb=()");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-DNS-Prefetch-Control", "off");
  response.setHeader("X-Frame-Options", "DENY");

  if (env.NODE_ENV === "production") {
    response.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }

  next();
};

export const disableSensitiveCaching: RequestHandler = (_request, response, next) => {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, private");
  response.setHeader("Expires", "0");
  response.setHeader("Pragma", "no-cache");
  next();
};
