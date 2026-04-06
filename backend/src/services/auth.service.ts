import type { Role } from "@prisma/client";
import { createHash, randomBytes, randomInt } from "crypto";

import { env } from "../config/env";
import { sendTransactionalEmail } from "../lib/email";
import {
  createPasswordResetTokenRecord,
  createUserRecord,
  findPasswordResetTokenByHash,
  findUserByEmail,
  findUserById,
  findValidVerificationCode,
  markPasswordResetTokensUsed,
  markVerificationCodesUsed,
  replaceVerificationCodeForUser,
  toSafeUser,
  updateUserRecord
} from "../lib/app-repository";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationCodeInput,
  ResetPasswordInput,
  VerifyAccountCodeInput
} from "../schemas/auth.schema";
import type { SafeUser } from "../types/auth";
import { AppError } from "../utils/app-error";
import { buildPasswordResetEmail, buildVerificationEmail } from "../utils/email-templates";
import { signAuthToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";

function buildSession(user: SafeUser) {
  return {
    user,
    token: signAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    })
  };
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function generateVerificationCode() {
  return String(randomInt(100000, 999999));
}

async function issueVerificationCode(userId: string) {
  const code = generateVerificationCode();
  const codeHash = hashValue(code);
  const expiresAt = new Date(Date.now() + env.VERIFICATION_CODE_TTL_MINUTES * 60 * 1000);

  await replaceVerificationCodeForUser(userId, codeHash, expiresAt);

  return {
    verificationCode: code,
    expiresInMinutes: env.VERIFICATION_CODE_TTL_MINUTES
  };
}

export function createSessionForUser(user: SafeUser) {
  return buildSession(user);
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new AppError("Ja existe uma conta com este e-mail.", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await createUserRecord({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
    isEmailVerified: false
  });

  const safeUser = toSafeUser(user);
  const verification = await issueVerificationCode(safeUser.id);

  await sendTransactionalEmail({
    to: safeUser.email,
    ...buildVerificationEmail({
      name: safeUser.name,
      code: verification.verificationCode,
      expiresInMinutes: verification.expiresInMinutes
    })
  });

  return {
    user: safeUser,
    requiresVerification: true,
    ...verification
  };
}

export async function authenticateUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError("Credenciais invalidas.", 401);
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Credenciais invalidas.", 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError("Conta ainda nao confirmada. Informe o codigo de verificacao.", 403, {
      reason: "ACCOUNT_NOT_VERIFIED",
      email: user.email
    });
  }

  const safeUserRecord = await findUserById(user.id);

  if (!safeUserRecord) {
    throw new AppError("Usuario nao encontrado.", 404);
  }

  return buildSession(toSafeUser(safeUserRecord));
}

export async function verifyAccountCode(input: VerifyAccountCodeInput) {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError("Conta nao encontrada para este e-mail.", 404);
  }

  if (user.isEmailVerified) {
    const safeUserRecord = await findUserById(user.id);

    if (!safeUserRecord) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    return {
      session: buildSession(toSafeUser(safeUserRecord)),
      alreadyVerified: true
    };
  }

  const codeHash = hashValue(input.code);
  const verification = await findValidVerificationCode(user.id, codeHash, new Date());

  if (!verification) {
    throw new AppError("Codigo de verificacao invalido ou expirado.", 400);
  }

  const verifiedAt = new Date();

  const verifiedUser = await updateUserRecord(user.id, {
    isEmailVerified: true,
    emailVerifiedAt: verifiedAt
  });
  await markVerificationCodesUsed(user.id, verifiedAt);

  return {
    session: buildSession(toSafeUser(verifiedUser)),
    alreadyVerified: false
  };
}

export async function resendVerificationCode(input: ResendVerificationCodeInput) {
  const user = await findUserByEmail(input.email);

  if (!user) {
    return {};
  }

  if (user.isEmailVerified) {
    throw new AppError("Esta conta ja foi confirmada.", 400);
  }

  const verification = await issueVerificationCode(user.id);

  await sendTransactionalEmail({
    to: user.email,
    ...buildVerificationEmail({
      name: user.name,
      code: verification.verificationCode,
      expiresInMinutes: verification.expiresInMinutes
    })
  });

  return verification;
}

export async function createPasswordReset(input: ForgotPasswordInput) {
  const user = await findUserByEmail(input.email);

  if (!user) {
    return {};
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashValue(rawToken);
  const expiresAt = new Date(Date.now() + env.RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await createPasswordResetTokenRecord({
    tokenHash,
    expiresAt,
    userId: user.id
  });

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  const emailPayload = buildPasswordResetEmail({
    name: user.name,
    resetUrl,
    expiresInMinutes: env.RESET_TOKEN_TTL_MINUTES
  });

  await sendTransactionalEmail({
    to: user.email,
    ...emailPayload
  });

  return {
    resetUrl,
    resetToken: rawToken,
    expiresInMinutes: env.RESET_TOKEN_TTL_MINUTES
  };
}

export async function resetPasswordWithToken(input: ResetPasswordInput) {
  const tokenHash = hashValue(input.token);
  const resetToken = await findPasswordResetTokenByHash(tokenHash);

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
    throw new AppError("Token de recuperacao invalido ou expirado.", 400);
  }

  const passwordHash = await hashPassword(input.password);
  const usedAt = new Date();

  const user = await updateUserRecord(resetToken.userId, { passwordHash });
  await markPasswordResetTokensUsed(resetToken.userId, usedAt);

  return toSafeUser(user);
}

export async function getUserById(id: string) {
  const user = await findUserById(id);
  return user ? toSafeUser(user) : null;
}

export async function seedAdminRole(userId: string, role: Role) {
  const user = await updateUserRecord(userId, { role });
  return toSafeUser(user);
}
