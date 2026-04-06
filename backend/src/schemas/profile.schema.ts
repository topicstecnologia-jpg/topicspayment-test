import { z } from "zod";

const optionalString = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().optional()
);

const optionalAvatar = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z
    .string()
    .refine((value) => value.startsWith("data:image/") || z.string().url().safeParse(value).success, {
      message: "Informe uma URL valida ou selecione uma imagem valida."
    })
    .optional()
);

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("Informe um e-mail valido."),
  phone: optionalString.pipe(z.string().max(32, "Informe um telefone com ate 32 caracteres.").optional()),
  address: optionalString.pipe(z.string().max(180, "Informe um endereco com ate 180 caracteres.").optional()),
  avatarUrl: optionalAvatar
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Informe sua senha atual."),
    newPassword: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme sua nova senha.")
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"]
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(8, "Informe sua senha para confirmar.")
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
