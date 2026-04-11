import { existsSync } from "fs";
import { resolve } from "path";

import { config as loadDotenv } from "dotenv";

import { z } from "zod";

const envCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(__dirname, "../../.env"),
  resolve(__dirname, "../../../.env")
];

for (const envPath of envCandidates) {
  if (!existsSync(envPath)) {
    continue;
  }

  loadDotenv({ path: envPath });
  break;
}

const optionalEmail = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().email().optional()
);

const optionalPassword = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(8).optional()
);

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional()
);

const optionalEmailProvider = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum(["console", "resend"]).optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  AUTH_COOKIE_NAME: z.string().default("topics_members_session"),
  AUTH_COOKIE_MAX_AGE_DAYS: z.coerce.number().positive().default(7),
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
  RESET_TOKEN_TTL_MINUTES: z.coerce.number().positive().default(30),
  VERIFICATION_CODE_TTL_MINUTES: z.coerce.number().positive().default(15),
  EMAIL_PROVIDER: optionalEmailProvider,
  EMAIL_FROM_NAME: z.string().default("TOPICS Pay"),
  EMAIL_FROM_ADDRESS: optionalEmail,
  EMAIL_REPLY_TO: optionalEmail,
  RESEND_API_KEY: optionalString,
  MERCADO_PAGO_ACCESS_TOKEN: optionalString,
  MERCADO_PAGO_API_BASE_URL: z.string().url().default("https://api.mercadopago.com"),
  MERCADO_PAGO_WEBHOOK_URL: optionalUrl,
  ADMIN_NAME: z.string().default("TOPICS Admin"),
  ADMIN_EMAIL: optionalEmail,
  ADMIN_PASSWORD: optionalPassword
}).superRefine((data, context) => {
  const effectiveEmailProvider =
    data.EMAIL_PROVIDER ?? (data.RESEND_API_KEY && data.EMAIL_FROM_ADDRESS ? "resend" : "console");

  if (effectiveEmailProvider === "resend") {
    if (!data.RESEND_API_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY is required when EMAIL_PROVIDER=resend."
      });
    }

    if (!data.EMAIL_FROM_ADDRESS) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["EMAIL_FROM_ADDRESS"],
        message: "EMAIL_FROM_ADDRESS is required when EMAIL_PROVIDER=resend."
      });
    }
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Environment validation failed.");
}

export const env = {
  ...parsedEnv.data,
  EMAIL_PROVIDER:
    parsedEnv.data.EMAIL_PROVIDER ??
    (parsedEnv.data.RESEND_API_KEY && parsedEnv.data.EMAIL_FROM_ADDRESS ? "resend" : "console")
};

if (env.NODE_ENV === "production" && env.EMAIL_PROVIDER === "console") {
  console.warn(
    "EMAIL_PROVIDER is using console in production. Verification and password reset emails will not be delivered."
  );
}
