import type { Role } from "@prisma/client";

import { prisma } from "./prisma";

export interface AppUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  passwordHash: string;
  role: Role;
  isEmailVerified: boolean;
  emailVerifiedAt: Date | null;
  sessionVersion: number;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppPasswordResetTokenRecord {
  id: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  userId: string;
}

export interface AppEmailVerificationCodeRecord {
  id: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  userId: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function toSafeUser(user: AppUserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email: normalizeEmail(email)
    }
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id }
  });
}

export async function createUserRecord(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isEmailVerified: boolean;
}) {
  return prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      role: input.role,
      isEmailVerified: input.isEmailVerified,
      emailVerifiedAt: input.isEmailVerified ? new Date() : null
    }
  });
}

export async function updateUserRecord(
  userId: string,
  input: Partial<{
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    avatarUrl: string | null;
    passwordHash: string;
    role: Role;
    isEmailVerified: boolean;
    emailVerifiedAt: Date | null;
    sessionVersion: number;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    lastLoginAt: Date | null;
    lastLoginIp: string | null;
  }>
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...input,
      email: input.email ? normalizeEmail(input.email) : undefined,
      name: input.name?.trim()
    }
  });
}

export async function deleteUserRecord(userId: string) {
  await prisma.user.delete({
    where: { id: userId }
  });
}

export async function registerFailedLoginAttempt(userId: string, failedLoginAttempts: number, lockedUntil: Date | null) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts,
      lockedUntil
    }
  });
}

export async function registerSuccessfulLogin(userId: string, ipAddress: string | null) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress
    }
  });
}

export async function incrementUserSessionVersion(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      sessionVersion: {
        increment: 1
      }
    }
  });
}

export async function countUsers(role?: Role) {
  return prisma.user.count({
    where: role ? { role } : undefined
  });
}

export async function replaceVerificationCodeForUser(
  userId: string,
  codeHash: string,
  expiresAt: Date
) {
  await prisma.$transaction([
    prisma.emailVerificationCode.deleteMany({
      where: {
        userId,
        usedAt: null
      }
    }),
    prisma.emailVerificationCode.create({
      data: {
        codeHash,
        expiresAt,
        userId
      }
    })
  ]);
}

export async function findValidVerificationCode(
  userId: string,
  codeHash: string,
  now: Date
) {
  return prisma.emailVerificationCode.findFirst({
    where: {
      userId,
      codeHash,
      usedAt: null,
      expiresAt: {
        gt: now
      }
    }
  });
}

export async function markVerificationCodesUsed(userId: string, usedAt: Date) {
  await prisma.emailVerificationCode.updateMany({
    where: {
      userId,
      usedAt: null
    },
    data: {
      usedAt
    }
  });
}

export async function createPasswordResetTokenRecord(input: {
  tokenHash: string;
  expiresAt: Date;
  userId: string;
}) {
  return prisma.passwordResetToken.create({
    data: input
  });
}

export async function findPasswordResetTokenByHash(tokenHash: string) {
  return prisma.passwordResetToken.findUnique({
    where: { tokenHash }
  });
}

export async function markPasswordResetTokensUsed(userId: string, usedAt: Date) {
  await prisma.passwordResetToken.updateMany({
    where: {
      userId,
      usedAt: null
    },
    data: {
      usedAt
    }
  });
}
