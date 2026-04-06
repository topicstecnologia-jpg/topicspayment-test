import type { Role } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { env } from "../config/env";
import { prisma } from "./prisma";
import { hashPassword } from "../utils/password";

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

type StoredUserRecord = Omit<AppUserRecord, "emailVerifiedAt" | "createdAt" | "updatedAt"> & {
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type StoredPasswordResetTokenRecord = Omit<
  AppPasswordResetTokenRecord,
  "expiresAt" | "usedAt" | "createdAt"
> & {
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

type StoredEmailVerificationCodeRecord = Omit<
  AppEmailVerificationCodeRecord,
  "expiresAt" | "usedAt" | "createdAt"
> & {
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

interface DevStoreData {
  users: StoredUserRecord[];
  passwordResetTokens: StoredPasswordResetTokenRecord[];
  emailVerificationCodes: StoredEmailVerificationCodeRecord[];
}

const devStoreFilePath = path.join(process.cwd(), ".data", "dev-store.json");

let fallbackWarningShown = false;

function toDate(value: string | null) {
  return value ? new Date(value) : null;
}

function serializeUser(user: AppUserRecord): StoredUserRecord {
  return {
    ...user,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

function deserializeUser(user: StoredUserRecord): AppUserRecord {
  return {
    ...user,
    emailVerifiedAt: toDate(user.emailVerifiedAt),
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt)
  };
}

function serializeResetToken(token: AppPasswordResetTokenRecord): StoredPasswordResetTokenRecord {
  return {
    ...token,
    expiresAt: token.expiresAt.toISOString(),
    usedAt: token.usedAt?.toISOString() ?? null,
    createdAt: token.createdAt.toISOString()
  };
}

function deserializeResetToken(token: StoredPasswordResetTokenRecord): AppPasswordResetTokenRecord {
  return {
    ...token,
    expiresAt: new Date(token.expiresAt),
    usedAt: toDate(token.usedAt),
    createdAt: new Date(token.createdAt)
  };
}

function serializeVerificationCode(
  code: AppEmailVerificationCodeRecord
): StoredEmailVerificationCodeRecord {
  return {
    ...code,
    expiresAt: code.expiresAt.toISOString(),
    usedAt: code.usedAt?.toISOString() ?? null,
    createdAt: code.createdAt.toISOString()
  };
}

function deserializeVerificationCode(
  code: StoredEmailVerificationCodeRecord
): AppEmailVerificationCodeRecord {
  return {
    ...code,
    expiresAt: new Date(code.expiresAt),
    usedAt: toDate(code.usedAt),
    createdAt: new Date(code.createdAt)
  };
}

async function readDevStore(): Promise<DevStoreData> {
  try {
    const raw = await readFile(devStoreFilePath, "utf8");
    const parsed = JSON.parse(raw) as DevStoreData;

    return {
      users: parsed.users ?? [],
      passwordResetTokens: parsed.passwordResetTokens ?? [],
      emailVerificationCodes: parsed.emailVerificationCodes ?? []
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        users: [],
        passwordResetTokens: [],
        emailVerificationCodes: []
      };
    }

    throw error;
  }
}

async function writeDevStore(data: DevStoreData) {
  await mkdir(path.dirname(devStoreFilePath), { recursive: true });
  await writeFile(devStoreFilePath, JSON.stringify(data, null, 2), "utf8");
}

async function ensureDevAdmin(data: DevStoreData) {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    return data;
  }

  const normalizedEmail = env.ADMIN_EMAIL.trim().toLowerCase();
  const existingAdmin = data.users.find((user) => user.email === normalizedEmail);

  if (existingAdmin) {
    return data;
  }

  const now = new Date();
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  data.users.push(
    serializeUser({
      id: `dev-admin-${randomUUID()}`,
      name: env.ADMIN_NAME,
      email: normalizedEmail,
      phone: null,
      address: null,
      avatarUrl: null,
      passwordHash,
      role: "admin",
      isEmailVerified: true,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now
    })
  );

  return data;
}

async function getDevStore() {
  const data = await readDevStore();
  const withAdmin = await ensureDevAdmin(data);
  await writeDevStore(withAdmin);
  return withAdmin;
}

async function mutateDevStore<T>(mutator: (data: DevStoreData) => Promise<T> | T) {
  const data = await getDevStore();
  const result = await mutator(data);
  await writeDevStore(data);
  return result;
}

function isDatabaseConnectionError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true;
  }

  const message = String((error as { message?: string })?.message ?? error);

  return [
    "Can't reach database server",
    "ConnectionReset",
    "ECONNREFUSED",
    "ECONNRESET",
    "timed out",
    "P1001"
  ].some((snippet) => message.includes(snippet));
}

async function withFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>) {
  try {
    return await primary();
  } catch (error) {
    if (env.NODE_ENV === "development" && isDatabaseConnectionError(error)) {
      if (!fallbackWarningShown) {
        console.warn(
          "TOPICS Pay backend is using local development storage because the remote database is unavailable."
        );
        fallbackWarningShown = true;
      }

      return fallback();
    }

    throw error;
  }
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
  const normalizedEmail = email.trim().toLowerCase();

  return withFallback(
    async () => {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      return user;
    },
    async () => {
      const data = await getDevStore();
      const user = data.users.find((item) => item.email === normalizedEmail);
      return user ? deserializeUser(user) : null;
    }
  );
}

export async function findUserById(id: string) {
  return withFallback(
    async () => {
      const user = await prisma.user.findUnique({
        where: { id }
      });

      return user;
    },
    async () => {
      const data = await getDevStore();
      const user = data.users.find((item) => item.id === id);
      return user ? deserializeUser(user) : null;
    }
  );
}

export async function createUserRecord(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isEmailVerified: boolean;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();

  return withFallback(
    async () =>
      prisma.user.create({
        data: {
          name: input.name,
          email: normalizedEmail,
          passwordHash: input.passwordHash,
          role: input.role,
          isEmailVerified: input.isEmailVerified
        }
      }),
    async () =>
      mutateDevStore(async (data) => {
        const now = new Date();
        const user: AppUserRecord = {
          id: `dev-user-${randomUUID()}`,
          name: input.name,
          email: normalizedEmail,
          phone: null,
          address: null,
          avatarUrl: null,
          passwordHash: input.passwordHash,
          role: input.role,
          isEmailVerified: input.isEmailVerified,
          emailVerifiedAt: input.isEmailVerified ? now : null,
          createdAt: now,
          updatedAt: now
        };

        data.users.push(serializeUser(user));
        return user;
      })
  );
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
  }>
) {
  return withFallback(
    async () =>
      prisma.user.update({
        where: { id: userId },
        data: input
      }),
    async () =>
      mutateDevStore(async (data) => {
        const index = data.users.findIndex((item) => item.id === userId);

        if (index === -1) {
          throw new Error("User not found in fallback storage.");
        }

        const current = deserializeUser(data.users[index]);
        const next: AppUserRecord = {
          ...current,
          ...input,
          email: input.email?.trim().toLowerCase() ?? current.email,
          updatedAt: new Date()
        };

        data.users[index] = serializeUser(next);
        return next;
      })
  );
}

export async function deleteUserRecord(userId: string) {
  return withFallback(
    async () => {
      await prisma.user.delete({
        where: { id: userId }
      });
    },
    async () =>
      mutateDevStore(async (data) => {
        data.users = data.users.filter((item) => item.id !== userId);
        data.passwordResetTokens = data.passwordResetTokens.filter((item) => item.userId !== userId);
        data.emailVerificationCodes = data.emailVerificationCodes.filter((item) => item.userId !== userId);
      })
  );
}

export async function countUsers(role?: Role) {
  return withFallback(
    async () => prisma.user.count({ where: role ? { role } : undefined }),
    async () => {
      const data = await getDevStore();
      return role ? data.users.filter((item) => item.role === role).length : data.users.length;
    }
  );
}

export async function replaceVerificationCodeForUser(
  userId: string,
  codeHash: string,
  expiresAt: Date
) {
  return withFallback(
    async () => {
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
    },
    async () =>
      mutateDevStore(async (data) => {
        data.emailVerificationCodes = data.emailVerificationCodes.filter(
          (item) => !(item.userId === userId && item.usedAt === null)
        );

        data.emailVerificationCodes.push(
          serializeVerificationCode({
            id: `dev-verification-${randomUUID()}`,
            codeHash,
            expiresAt,
            usedAt: null,
            createdAt: new Date(),
            userId
          })
        );
      })
  );
}

export async function findValidVerificationCode(
  userId: string,
  codeHash: string,
  now: Date
) {
  return withFallback(
    async () =>
      prisma.emailVerificationCode.findFirst({
        where: {
          userId,
          codeHash,
          usedAt: null,
          expiresAt: {
            gt: now
          }
        }
      }),
    async () => {
      const data = await getDevStore();
      const code = data.emailVerificationCodes.find(
        (item) =>
          item.userId === userId &&
          item.codeHash === codeHash &&
          item.usedAt === null &&
          new Date(item.expiresAt).getTime() > now.getTime()
      );

      return code ? deserializeVerificationCode(code) : null;
    }
  );
}

export async function markVerificationCodesUsed(userId: string, usedAt: Date) {
  return withFallback(
    async () => {
      await prisma.emailVerificationCode.updateMany({
        where: {
          userId,
          usedAt: null
        },
        data: {
          usedAt
        }
      });
    },
    async () =>
      mutateDevStore(async (data) => {
        data.emailVerificationCodes = data.emailVerificationCodes.map((item) =>
          item.userId === userId && item.usedAt === null
            ? { ...item, usedAt: usedAt.toISOString() }
            : item
        );
      })
  );
}

export async function createPasswordResetTokenRecord(input: {
  tokenHash: string;
  expiresAt: Date;
  userId: string;
}) {
  return withFallback(
    async () =>
      prisma.passwordResetToken.create({
        data: input
      }),
    async () =>
      mutateDevStore(async (data) => {
        const token: AppPasswordResetTokenRecord = {
          id: `dev-reset-${randomUUID()}`,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          usedAt: null,
          createdAt: new Date(),
          userId: input.userId
        };

        data.passwordResetTokens.push(serializeResetToken(token));
        return token;
      })
  );
}

export async function findPasswordResetTokenByHash(tokenHash: string) {
  return withFallback(
    async () =>
      prisma.passwordResetToken.findUnique({
        where: { tokenHash }
      }),
    async () => {
      const data = await getDevStore();
      const token = data.passwordResetTokens.find((item) => item.tokenHash === tokenHash);
      return token ? deserializeResetToken(token) : null;
    }
  );
}

export async function markPasswordResetTokensUsed(userId: string, usedAt: Date) {
  return withFallback(
    async () => {
      await prisma.passwordResetToken.updateMany({
        where: {
          userId,
          usedAt: null
        },
        data: {
          usedAt
        }
      });
    },
    async () =>
      mutateDevStore(async (data) => {
        data.passwordResetTokens = data.passwordResetTokens.map((item) =>
          item.userId === userId && item.usedAt === null
            ? { ...item, usedAt: usedAt.toISOString() }
            : item
        );
      })
  );
}
