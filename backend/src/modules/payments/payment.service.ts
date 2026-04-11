import { getPlatformCheckoutRecord } from "../../lib/platform-product-store";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import { createMercadoPagoPayment } from "./mercado-pago.client";
import {
  assertBrazilianCheckout,
  buildBoletoExpirationDate,
  buildExternalReference,
  buildPaymentDescription,
  normalizePhone,
  onlyDigits,
  resolveBrazilianDocumentType,
  sanitizeBillingAddress,
  splitFullName
} from "./payment.helpers";
import type {
  CheckoutPaymentMethod,
  CheckoutPaymentResponse,
  CreateCheckoutPaymentInput,
  MercadoPagoPaymentRequest,
  MercadoPagoPaymentResponsePayload
} from "./payment.types";

function ensurePaymentMethodEnabled(method: CheckoutPaymentMethod, offer: { cardEnabled: boolean; pixManualEnabled: boolean; boletoEnabled: boolean; }) {
  if (method === "card" && !offer.cardEnabled) {
    throw new AppError("Esta oferta nao aceita pagamento por cartao no momento.", 400);
  }

  if (method === "pix" && !offer.pixManualEnabled) {
    throw new AppError("Esta oferta nao aceita Pix no momento.", 400);
  }

  if (method === "boleto" && !offer.boletoEnabled) {
    throw new AppError("Esta oferta nao aceita boleto no momento.", 400);
  }
}

function buildMercadoPagoPaymentBody(input: CreateCheckoutPaymentInput, checkout: Awaited<ReturnType<typeof getPlatformCheckoutRecord>>) {
  assertBrazilianCheckout(input.customer);

  if (checkout.offer.price <= 0) {
    throw new AppError("Nao e possivel criar pagamentos para ofertas gratuitas.", 400);
  }

  ensurePaymentMethodEnabled(input.paymentMethod, checkout.offer);

  const { firstName, lastName } = splitFullName(input.customer.fullName);
  const normalizedPhone = normalizePhone(input.customer.phone);
  const documentNumber = onlyDigits(input.customer.document);
  const documentType = resolveBrazilianDocumentType(documentNumber);
  const externalReference = buildExternalReference(checkout.productId, checkout.offer.id);
  const description = buildPaymentDescription(checkout.productName, checkout.offer.title);

  const body: MercadoPagoPaymentRequest = {
    transaction_amount: checkout.offer.price,
    description,
    external_reference: externalReference,
    payment_method_id: input.paymentMethod === "pix" ? "pix" : input.paymentMethod === "boleto" ? "bolbradesco" : input.card.paymentMethodId,
    statement_descriptor: checkout.invoiceStatementDescriptor.slice(0, 13) || undefined,
    notification_url: env.MERCADO_PAGO_WEBHOOK_URL,
    metadata: {
      productId: checkout.productId,
      offerId: checkout.offer.id,
      productName: checkout.productName
    },
    payer: {
      email: input.customer.email.trim(),
      first_name: firstName,
      last_name: lastName,
      identification: {
        type: documentType,
        number: documentNumber
      },
      phone: normalizedPhone
        ? {
            area_code: normalizedPhone.areaCode,
            number: normalizedPhone.number
          }
        : undefined
    },
    additional_info: {
      items: [
        {
          id: checkout.offer.id,
          title: checkout.offer.title,
          description: checkout.productName,
          quantity: 1,
          unit_price: checkout.offer.price,
          picture_url: checkout.offer.imageUrl || checkout.productImageUrl,
          category_id: checkout.productId
        }
      ],
      payer: {
        first_name: firstName,
        last_name: lastName,
        phone: normalizedPhone
          ? {
              area_code: normalizedPhone.areaCode,
              number: normalizedPhone.number
            }
          : undefined
      }
    }
  };

  if (input.paymentMethod === "card") {
    if (input.card.installments > checkout.offer.cardInstallmentLimit) {
      throw new AppError("A oferta nao permite esse numero de parcelas.", 400);
    }

    if (!checkout.offer.cardSinglePaymentEnabled && input.card.installments === 1) {
      throw new AppError("Esta oferta exige parcelamento minimo de 2x no cartao.", 400);
    }

    body.token = input.card.token;
    body.installments = input.card.installments;
    body.issuer_id = input.card.issuerId;
    return { body, externalReference, description };
  }

  if (input.paymentMethod === "boleto") {
    const billingAddress = sanitizeBillingAddress(input.billingAddress);
    body.date_of_expiration = buildBoletoExpirationDate(checkout.offer.boletoDueDays);
    body.payer.address = billingAddress;
    body.additional_info = {
      ...body.additional_info,
      payer: {
        ...body.additional_info?.payer,
        address: {
          zip_code: billingAddress.zip_code,
          street_name: billingAddress.street_name,
          street_number: billingAddress.street_number
        }
      }
    };
  }

  return { body, externalReference, description };
}

function buildSuccessMessage(method: CheckoutPaymentMethod) {
  if (method === "card") {
    return "Pagamento com cartao enviado ao Mercado Pago com sucesso.";
  }

  if (method === "pix") {
    return "Pagamento Pix criado com sucesso.";
  }

  return "Boleto gerado com sucesso.";
}

function mapPaymentSummary(
  method: CheckoutPaymentMethod,
  payment: MercadoPagoPaymentResponsePayload,
  externalReference: string,
  description: string
) {
  const pixData = payment.point_of_interaction?.transaction_data;
  const ticketUrl =
    pixData?.ticket_url ??
    payment.transaction_details?.external_resource_url ??
    payment.ticket_url ??
    null;

  return {
    provider: "mercado_pago" as const,
    providerPaymentId: String(payment.id),
    externalReference: payment.external_reference || externalReference,
    method,
    status: payment.status || "pending",
    statusDetail: payment.status_detail || null,
    amount: payment.transaction_amount ?? 0,
    currency: payment.currency_id || "BRL",
    description,
    ticketUrl,
    paidAmount: payment.transaction_details?.total_paid_amount ?? null,
    expiresAt: payment.date_of_expiration || null,
    pix:
      method === "pix"
        ? {
            qrCode: pixData?.qr_code ?? null,
            qrCodeBase64: pixData?.qr_code_base64 ?? null
          }
        : null,
    boleto:
      method === "boleto"
        ? {
            barcode: payment.barcode?.content ?? null,
            digitableLine: payment.barcode?.content ?? null
          }
        : null,
    card:
      method === "card"
        ? {
            lastFourDigits: payment.card?.last_four_digits ?? null,
            firstSixDigits: payment.card?.first_six_digits ?? null,
            installments: payment.installments ?? null,
            installmentAmount: payment.transaction_details?.installment_amount ?? null
          }
        : null
  };
}

export async function createCheckoutPayment(
  input: CreateCheckoutPaymentInput
): Promise<CheckoutPaymentResponse> {
  const checkout = await getPlatformCheckoutRecord(input.productId, input.offerId);
  const { body, externalReference, description } = buildMercadoPagoPaymentBody(input, checkout);
  const payment = await createMercadoPagoPayment(body, externalReference);

  return {
    message: buildSuccessMessage(input.paymentMethod),
    payment: mapPaymentSummary(input.paymentMethod, payment, externalReference, description)
  };
}
