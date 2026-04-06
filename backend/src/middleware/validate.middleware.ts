import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

import { AppError } from "../utils/app-error";

export function validateBody(schema: ZodTypeAny) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      return next(
        new AppError("Dados inválidos.", 400, {
          fieldErrors: result.error.flatten().fieldErrors
        })
      );
    }

    request.body = result.data;
    return next();
  };
}
