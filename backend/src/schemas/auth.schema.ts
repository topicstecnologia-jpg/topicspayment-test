import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.")
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Informe seu nome."),
    email: z.string().email("Informe um e-mail valido."),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme sua senha."),
    role: z.enum(["member", "guest"]).default("member")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"]
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Informe um e-mail valido.")
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token invalido."),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme sua senha.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"]
  });

export const verifyAccountCodeSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  code: z
    .string()
    .regex(/^\d{6}$/, "Informe o codigo de 6 digitos.")
});

export const resendVerificationCodeSchema = z.object({
  email: z.string().email("Informe um e-mail valido.")
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyAccountCodeInput = z.infer<typeof verifyAccountCodeSchema>;
export type ResendVerificationCodeInput = z.infer<typeof resendVerificationCodeSchema>;
