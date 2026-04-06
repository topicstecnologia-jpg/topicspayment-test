import { env } from "../config/env";
import { authCookieOptions, clearAuthCookieOptions } from "../config/cookies";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationCodeInput,
  ResetPasswordInput,
  VerifyAccountCodeInput
} from "../schemas/auth.schema";
import {
  authenticateUser,
  createPasswordReset,
  createSessionForUser,
  registerUser,
  resendVerificationCode,
  resetPasswordWithToken,
  verifyAccountCode
} from "../services/auth.service";
import { asyncHandler } from "../utils/async-handler";

export const register = asyncHandler(async (request, response) => {
  const payload = request.body as RegisterInput;
  const result = await registerUser(payload);

  response.status(201).json({
    message: "Conta criada. Confirme seu e-mail com o codigo enviado.",
    email: result.user.email,
    requiresVerification: result.requiresVerification,
    ...(env.NODE_ENV !== "production"
      ? {
          verificationCode: result.verificationCode,
          expiresInMinutes: result.expiresInMinutes
        }
      : {})
  });
});

export const verifyAccount = asyncHandler(async (request, response) => {
  const payload = request.body as VerifyAccountCodeInput;
  const result = await verifyAccountCode(payload);

  response.cookie(env.AUTH_COOKIE_NAME, result.session.token, authCookieOptions);
  response.json({
    message: result.alreadyVerified
      ? "Conta ja confirmada."
      : "Conta confirmada com sucesso.",
    user: result.session.user
  });
});

export const resendAccountCode = asyncHandler(async (request, response) => {
  const payload = request.body as ResendVerificationCodeInput;
  const result = await resendVerificationCode(payload);

  response.json({
    message: "Se a conta existir e ainda nao estiver confirmada, enviaremos um novo codigo.",
    ...(env.NODE_ENV !== "production" ? result : {})
  });
});

export const login = asyncHandler(async (request, response) => {
  const payload = request.body as LoginInput;
  const session = await authenticateUser(payload);

  response.cookie(env.AUTH_COOKIE_NAME, session.token, authCookieOptions);
  response.json({
    message: "Login realizado com sucesso.",
    user: session.user
  });
});

export const logout = asyncHandler(async (_request, response) => {
  response.clearCookie(env.AUTH_COOKIE_NAME, clearAuthCookieOptions);
  response.status(204).send();
});

export const me = asyncHandler(async (request, response) => {
  response.json({
    user: request.user
  });
});

export const forgotPassword = asyncHandler(async (request, response) => {
  const payload = request.body as ForgotPasswordInput;
  const result = await createPasswordReset(payload);

  response.json({
    message: "Se o e-mail existir, enviaremos um link de recuperacao.",
    ...(env.NODE_ENV !== "production" ? result : {})
  });
});

export const resetPassword = asyncHandler(async (request, response) => {
  const payload = request.body as ResetPasswordInput;
  const user = await resetPasswordWithToken(payload);
  const session = createSessionForUser(user);

  response.cookie(env.AUTH_COOKIE_NAME, session.token, authCookieOptions);
  response.json({
    message: "Senha redefinida com sucesso.",
    user: session.user
  });
});
