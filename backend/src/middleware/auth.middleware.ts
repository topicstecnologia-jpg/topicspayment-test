import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import { findUserById, toSafeUser } from "../lib/app-repository";
import { AppError } from "../utils/app-error";
import { verifyAuthToken } from "../utils/jwt";

function getTokenFromRequest(request: Request) {
  const cookieToken = request.cookies?.[env.AUTH_COOKIE_NAME];
  const header = request.headers.authorization;

  if (cookieToken) {
    return cookieToken;
  }

  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return null;
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return next(new AppError("Sessao nao encontrada.", 401));
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await findUserById(payload.sub);

    if (!user) {
      return next(new AppError("Usuario nao encontrado.", 401));
    }

    request.user = toSafeUser(user);
    return next();
  } catch (error) {
    return next(error);
  }
}

export function authorizeRoles(...roles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      return next(new AppError("Sessao nao encontrada.", 401));
    }

    if (!roles.includes(request.user.role)) {
      return next(new AppError("Voce nao tem permissao para acessar este recurso.", 403));
    }

    return next();
  };
}
