import { z } from "zod";

function normalizeTrimmedValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
}

function emptyStringToUndefined(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function emptyNumberToUndefined(value: unknown) {
  if (value === "" || value == null) {
    return undefined;
  }

  if (typeof value === "number" && Number.isNaN(value)) {
    return undefined;
  }

  return value;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidImageSource(value: string) {
  return value.startsWith("data:image/") || isHttpUrl(value);
}

const optionalImageUrl = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .refine(isValidImageSource, "Informe uma URL valida ou envie uma imagem compativel.")
    .optional()
);

const nullableImageUrl = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .refine(isValidImageSource, "Informe uma URL valida ou envie uma imagem compativel.")
    .nullish()
    .transform((value) => value ?? null)
);

const optionalNonNegativeNumber = z.preprocess(
  emptyNumberToUndefined,
  z.coerce.number().min(0, "Informe um valor valido.").optional()
);

const billingCycleSchema = z.enum(["one_time", "monthly", "annual"]);
const couponDiscountTypeSchema = z.enum(["percent", "fixed"]);

const productOfferSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(2, "Informe o nome da oferta."),
  checkoutDescription: z.string().max(180, "A descricao do checkout precisa ter ate 180 caracteres.").default(""),
  description: z.string().max(600, "A descricao da oferta precisa ter ate 600 caracteres.").default(""),
  imageUrl: nullableImageUrl,
  price: z.coerce.number().min(0, "Informe um preco valido para a oferta."),
  anchorPrice: optionalNonNegativeNumber,
  itemCount: z.coerce.number().int().min(0, "Informe uma quantidade de itens valida.").default(1),
  billingCycle: billingCycleSchema.default("one_time"),
  isFree: z.boolean().default(false),
  passFixedFeeToBuyer: z.boolean().default(false),
  cardEnabled: z.boolean().default(true),
  cardInterestPayer: z.enum(["buyer", "seller"]).default("buyer"),
  cardSmartInstallments: z.boolean().default(false),
  cardSinglePaymentEnabled: z.boolean().default(true),
  boletoEnabled: z.boolean().default(true),
  boletoDueDays: z.coerce.number().int().min(1, "Informe o vencimento do boleto em dias uteis.").default(1),
  boletoInfinite: z.boolean().default(true),
  boletoAfterDueDays: z.coerce.number().int().min(1, "Informe a quantidade de dias apos o vencimento.").default(30),
  pixManualEnabled: z.boolean().default(true),
  paymentMethodDiscountsEnabled: z.boolean().default(false),
  active: z.boolean().default(true),
  isPrimary: z.boolean().default(false)
});

const productCouponSchema = z.object({
  id: z.string().min(1).optional(),
  code: z
    .string()
    .min(3, "Informe um codigo de cupom.")
    .max(32, "O codigo precisa ter ate 32 caracteres.")
    .transform((value) => value.trim().toUpperCase()),
  discountType: couponDiscountTypeSchema.default("percent"),
  discountValue: z.coerce.number().min(0, "Informe um desconto valido."),
  active: z.boolean().default(true),
  note: z.string().max(180, "A observacao precisa ter ate 180 caracteres.").default("")
});

export const createPlatformProductSchema = z
  .object({
    name: z.string().min(2, "Informe o nome do produto."),
    category: z.string().min(2, "Informe a categoria do produto."),
    description: z.string().max(1000, "A descricao precisa ter ate 1000 caracteres.").default(""),
    salesPageUrl: z.preprocess(
      normalizeTrimmedValue,
      z
        .string()
        .refine((value) => value === "" || isHttpUrl(value), "Informe uma URL valida para a pagina de vendas.")
        .default("")
    ),
    hasSalesPage: z.boolean().default(false),
    productType: z
      .enum(["course", "community", "mentorship", "template", "service", "event", "subscription", "other"])
      .default("other"),
    invoiceStatementDescriptor: z.preprocess(
      normalizeTrimmedValue,
      z.string().max(22, "A identificacao na fatura precisa ter ate 22 caracteres.").default("")
    ),
    refundWindow: z.enum(["7_days", "14_days", "21_days", "30_days"]).default("7_days"),
    supportEmail: z.preprocess(
      normalizeTrimmedValue,
      z
        .string()
        .max(120, "O e-mail precisa ter ate 120 caracteres.")
        .refine(
          (value) => value === "" || z.string().email().safeParse(value).success,
          "Informe um e-mail valido para o suporte."
        )
        .default("")
    ),
    supportPhone: z.preprocess(
      normalizeTrimmedValue,
      z.string().max(32, "O contato do suporte precisa ter ate 32 caracteres.").default("")
    ),
    isActive: z.boolean().default(false),
    price: z.coerce.number().min(0, "Informe um preco valido."),
    stock: z.coerce.number().int().min(0, "Informe um estoque valido.").default(0),
    imageUrl: optionalImageUrl,
    offers: z.array(productOfferSchema).default([]),
    coupons: z.array(productCouponSchema).default([])
  })
  .superRefine((values, context) => {
    if (values.hasSalesPage && values.salesPageUrl === "") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a URL da pagina de vendas.",
        path: ["salesPageUrl"]
      });
    }
  });

export const updatePlatformProductSchema = createPlatformProductSchema;

export const setPlatformProductActiveSchema = z.object({
  isActive: z.boolean()
});

export type CreatePlatformProductInput = z.infer<typeof createPlatformProductSchema>;
export type UpdatePlatformProductInput = z.infer<typeof updatePlatformProductSchema>;
export type SetPlatformProductActiveInput = z.infer<typeof setPlatformProductActiveSchema>;
