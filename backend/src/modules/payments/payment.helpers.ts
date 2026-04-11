import { randomUUID } from "crypto";

import type {
  CheckoutBillingAddressInput,
  CheckoutBuyerInput,
  CheckoutDocumentType
} from "./payment.types";
import { AppError } from "../../utils/app-error";

export function onlyDigits(value: string) {
  return value.replace(/\D+/g, "");
}

export function resolveBrazilianDocumentType(document: string): CheckoutDocumentType {
  const digits = onlyDigits(document);

  if (digits.length === 11) {
    return "CPF";
  }

  if (digits.length === 14) {
    return "CNPJ";
  }

  throw new AppError("Informe um CPF ou CNPJ valido para processar o pagamento.", 400);
}

export function normalizePhone(phone: string) {
  const digits = onlyDigits(phone);

  if (digits.length < 10) {
    return undefined;
  }

  return {
    areaCode: digits.slice(0, 2),
    number: digits.slice(2)
  };
}

export function splitFullName(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ").trim();

  return {
    firstName,
    lastName: lastName || undefined
  };
}

export function buildExternalReference(productId: string, offerId: string) {
  return `topics-${productId}-${offerId}-${randomUUID()}`;
}

export function buildPaymentDescription(productName: string, offerTitle: string) {
  return `${productName} - ${offerTitle}`.slice(0, 255);
}

export function buildBoletoExpirationDate(days: number) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + Math.max(days, 1));
  expirationDate.setHours(23, 59, 59, 0);

  return expirationDate.toISOString();
}

export function sanitizeBillingAddress(address: CheckoutBillingAddressInput) {
  return {
    zip_code: onlyDigits(address.zipCode),
    street_name: address.streetName.trim(),
    street_number: address.streetNumber.trim() || "S/N",
    neighborhood: address.neighborhood.trim(),
    city: address.city.trim(),
    federal_unit: address.federalUnit.trim().toUpperCase()
  };
}

export function assertBrazilianCheckout(customer: CheckoutBuyerInput) {
  if (customer.audience !== "br") {
    throw new AppError(
      "No momento, a integracao automatica com o Mercado Pago deste checkout atende apenas compradores do Brasil.",
      400
    );
  }
}
