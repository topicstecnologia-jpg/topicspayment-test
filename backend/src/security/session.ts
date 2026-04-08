import type { AppUserRecord } from "../lib/app-repository";

export function getUserSessionVersion(user: Pick<AppUserRecord, "sessionVersion">) {
  return user.sessionVersion ?? 0;
}

export function hasSessionVersionMismatch(
  user: Pick<AppUserRecord, "sessionVersion">,
  tokenSessionVersion?: number
) {
  return getUserSessionVersion(user) !== (tokenSessionVersion ?? 0);
}
