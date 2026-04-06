import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { env } from "../src/config/env";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.log("Admin seed skipped. Define ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env.");
    return;
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: {
      name: env.ADMIN_NAME,
      passwordHash,
      role: "admin",
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    },
    create: {
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      passwordHash,
      role: "admin",
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  console.log("Admin ready:", admin.email, `(${admin.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
