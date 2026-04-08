import type { AppUserRecord } from "../lib/app-repository";

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000;

export function isAccountTemporarilyLocked(user: Pick<AppUserRecord, "lockedUntil">, now = new Date()) {
  return Boolean(user.lockedUntil && user.lockedUntil.getTime() > now.getTime());
}

export function getRemainingLockoutSeconds(user: Pick<AppUserRecord, "lockedUntil">, now = new Date()) {
  if (!user.lockedUntil) {
    return 0;
  }

  return Math.max(0, Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000));
}

export function getNextFailedLoginState(
  user: Pick<AppUserRecord, "failedLoginAttempts">,
  now = new Date()
) {
  const nextFailedAttempts = user.failedLoginAttempts + 1;
  const shouldLock = nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;

  return {
    failedLoginAttempts: shouldLock ? 0 : nextFailedAttempts,
    lockedUntil: shouldLock ? new Date(now.getTime() + LOGIN_LOCK_WINDOW_MS) : null,
    shouldLock
  };
}
