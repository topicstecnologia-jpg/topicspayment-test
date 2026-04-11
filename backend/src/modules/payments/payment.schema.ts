import { z } from "zod";

export const checkoutBuyerSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8).max(32),
  document: z.string().trim().min(11).max(32),
  audience: z.enum(["br", "international"]).default("br")
});

export const checkoutBillingAddressSchema = z.object({
  zipCode: z.string().trim().min(8).max(16),
  streetName: z.string().trim().min(2).max(120),
  streetNumber: z.string().trim().min(1).max(16),
  neighborhood: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  federalUnit: z.string().trim().length(2)
});

const checkoutBaseSchema = z.object({
  productId: z.string().trim().min(1),
  offerId: z.string().trim().min(1),
  customer: checkoutBuyerSchema
});

export const createCheckoutPaymentSchema = z.discriminatedUnion("paymentMethod", [
  checkoutBaseSchema.extend({
    paymentMethod: z.literal("card"),
    card: z.object({
      token: z.string().trim().min(1),
      paymentMethodId: z.string().trim().min(1),
      issuerId: z.string().trim().min(1).optional(),
      installments: z.coerce.number().int().min(1).max(24)
    })
  }),
  checkoutBaseSchema.extend({
    paymentMethod: z.literal("pix")
  }),
  checkoutBaseSchema.extend({
    paymentMethod: z.literal("boleto"),
    billingAddress: checkoutBillingAddressSchema
  })
]);

export type CreateCheckoutPaymentInput = z.infer<typeof createCheckoutPaymentSchema>;
