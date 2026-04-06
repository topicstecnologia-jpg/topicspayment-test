import type { CookieOptions } from "express";

import { env } from "./env";

const secure = env.NODE_ENV === "production";

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure,
  path: "/",
  maxAge: env.AUTH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
};

export const clearAuthCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure,
  path: "/"
};
