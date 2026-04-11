import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";

import { AppError } from "../utils/app-error";

export function notFoundHandler(request: Request, _response: Response, next: NextFunction) {
  next(new AppError(`Rota não encontrada: ${request.method} ${request.originalUrl}`, 404));
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error("[app-error]", {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details
      });
    }

    return response.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Dados inválidos.",
      details: error.flatten()
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return response.status(409).json({
      message: "Já existe um registro com esse valor único."
    });
  }

  if (error instanceof TokenExpiredError) {
    return response.status(401).json({
      message: "Sessão expirada. Faça login novamente."
    });
  }

  if (error instanceof JsonWebTokenError) {
    return response.status(401).json({
      message: "Token inválido."
    });
  }

  console.error(error);

  return response.status(500).json({
    message: "Erro interno do servidor."
  });
}
