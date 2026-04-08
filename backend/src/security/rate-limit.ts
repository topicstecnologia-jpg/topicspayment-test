import type { Request, RequestHandler } from "express";

import { logSecurityEvent } from "./audit";
import { buildRequestIdentity, getClientIp, getNormalizedEmail } from "./config";

interface RateLimitBucket {
  blockedUntil: number | null;
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  blockDurationMs?: number;
  keyGenerator?: (request: Request) => string;
  max: number;
  message: string;
  routeId: string;
  windowMs: number;
}

const bucketStore = new Map<string, RateLimitBucket>();
let lastSweepAt = 0;

function sweepExpiredBuckets(now: number) {
  if (now - lastSweepAt < 60_000) {
    return;
  }

  lastSweepAt = now;

  for (const [key, bucket] of bucketStore.entries()) {
    const shouldKeepBlocking = bucket.blockedUntil !== null && bucket.blockedUntil > now;
    const isWindowActive = bucket.resetAt > now;

    if (!shouldKeepBlocking && !isWindowActive) {
      bucketStore.delete(key);
    }
  }
}

function getRetryAfterSeconds(bucket: RateLimitBucket, now: number) {
  const resetTime = bucket.blockedUntil && bucket.blockedUntil > now ? bucket.blockedUntil : bucket.resetAt;
  return Math.max(1, Math.ceil((resetTime - now) / 1000));
}

function defaultKeyGenerator(request: Request) {
  return buildRequestIdentity(getClientIp(request));
}

function emailAwareKeyGenerator(request: Request) {
  return buildRequestIdentity(getClientIp(request), getNormalizedEmail(request.body?.email));
}

function setRateLimitHeaders(
  response: Parameters<RequestHandler>[1],
  options: RateLimitOptions,
  bucket: RateLimitBucket,
  now: number
) {
  const remaining = Math.max(0, options.max - bucket.count);
  const resetInSeconds = getRetryAfterSeconds(bucket, now);

  response.setHeader("X-RateLimit-Limit", String(options.max));
  response.setHeader("X-RateLimit-Remaining", String(remaining));
  response.setHeader("X-RateLimit-Reset", String(resetInSeconds));
}

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  const keyGenerator = options.keyGenerator ?? defaultKeyGenerator;

  return (request, response, next) => {
    const now = Date.now();
    sweepExpiredBuckets(now);

    const storageKey = `${options.routeId}:${keyGenerator(request)}`;
    const bucket = bucketStore.get(storageKey);

    if (bucket && bucket.blockedUntil && bucket.blockedUntil > now) {
      const retryAfterSeconds = getRetryAfterSeconds(bucket, now);
      setRateLimitHeaders(response, options, bucket, now);
      response.setHeader("Retry-After", String(retryAfterSeconds));

      logSecurityEvent({
        category: "rate_limit",
        action: "request_blocked",
        metadata: {
          ip: getClientIp(request),
          method: request.method,
          path: request.originalUrl,
          routeId: options.routeId
        }
      });

      response.status(429).json({
        message: options.message,
        details: {
          retryAfterSeconds
        }
      });
      return;
    }

    const activeBucket =
      !bucket || bucket.resetAt <= now
        ? {
            blockedUntil: null,
            count: 0,
            resetAt: now + options.windowMs
          }
        : bucket;

    activeBucket.count += 1;

    if (activeBucket.count > options.max) {
      activeBucket.blockedUntil = now + (options.blockDurationMs ?? options.windowMs);
      bucketStore.set(storageKey, activeBucket);

      const retryAfterSeconds = getRetryAfterSeconds(activeBucket, now);
      setRateLimitHeaders(response, options, activeBucket, now);
      response.setHeader("Retry-After", String(retryAfterSeconds));

      logSecurityEvent({
        category: "rate_limit",
        action: "limit_exceeded",
        metadata: {
          ip: getClientIp(request),
          method: request.method,
          path: request.originalUrl,
          routeId: options.routeId
        }
      });

      response.status(429).json({
        message: options.message,
        details: {
          retryAfterSeconds
        }
      });
      return;
    }

    bucketStore.set(storageKey, activeBucket);
    setRateLimitHeaders(response, options, activeBucket, now);
    next();
  };
}

export const authRateLimiters = {
  forgotPassword: createRateLimit({
    routeId: "auth:forgot_password",
    windowMs: 10 * 60 * 1000,
    max: 5,
    blockDurationMs: 10 * 60 * 1000,
    keyGenerator: emailAwareKeyGenerator,
    message: "Muitas solicitacoes de recuperacao. Aguarde alguns minutos antes de tentar novamente."
  }),
  login: createRateLimit({
    routeId: "auth:login",
    windowMs: 10 * 60 * 1000,
    max: 5,
    blockDurationMs: 15 * 60 * 1000,
    keyGenerator: emailAwareKeyGenerator,
    message: "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente."
  }),
  register: createRateLimit({
    routeId: "auth:register",
    windowMs: 30 * 60 * 1000,
    max: 10,
    blockDurationMs: 30 * 60 * 1000,
    message: "Muitos cadastros em pouco tempo. Aguarde um pouco antes de tentar novamente."
  }),
  resendVerificationCode: createRateLimit({
    routeId: "auth:resend_verification_code",
    windowMs: 10 * 60 * 1000,
    max: 5,
    blockDurationMs: 10 * 60 * 1000,
    keyGenerator: emailAwareKeyGenerator,
    message: "Muitos pedidos de codigo. Aguarde alguns minutos antes de solicitar novamente."
  }),
  resetPassword: createRateLimit({
    routeId: "auth:reset_password",
    windowMs: 10 * 60 * 1000,
    max: 5,
    blockDurationMs: 10 * 60 * 1000,
    message: "Muitas tentativas de redefinicao. Aguarde alguns minutos antes de tentar novamente."
  }),
  verifyAccountCode: createRateLimit({
    routeId: "auth:verify_account_code",
    windowMs: 10 * 60 * 1000,
    max: 8,
    blockDurationMs: 10 * 60 * 1000,
    keyGenerator: emailAwareKeyGenerator,
    message: "Muitas tentativas de verificacao. Aguarde alguns minutos antes de tentar novamente."
  })
};
