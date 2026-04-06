import type { Prisma } from "@prisma/client";

export const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  avatarUrl: true,
  role: true,
  isEmailVerified: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;
