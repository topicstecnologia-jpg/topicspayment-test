import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import type {
  MercadoPagoPaymentRequest,
  MercadoPagoPaymentResponsePayload
} from "./payment.types";

function getMercadoPagoAccessToken() {
  if (!env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new AppError(
      "Configure MERCADO_PAGO_ACCESS_TOKEN no backend para ativar os pagamentos do checkout.",
      503
    );
  }

  return env.MERCADO_PAGO_ACCESS_TOKEN;
}

function buildMercadoPagoUrl(path: string) {
  return `${env.MERCADO_PAGO_API_BASE_URL.replace(/\/+$/, "")}${path}`;
}

function resolveMercadoPagoErrorMessage(data: Record<string, unknown>) {
  const cause = Array.isArray(data.cause) ? data.cause[0] : null;

  if (cause && typeof cause === "object" && cause) {
    const description = cause["description"];

    if (typeof description === "string" && description.trim()) {
      return description;
    }
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  return "Nao foi possivel processar o pagamento com o Mercado Pago.";
}

export async function createMercadoPagoPayment(
  body: MercadoPagoPaymentRequest,
  idempotencyKey: string
) {
  const response = await fetch(buildMercadoPagoUrl("/v1/payments"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
      "x-idempotency-key": idempotencyKey
    },
    body: JSON.stringify(body)
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new AppError(resolveMercadoPagoErrorMessage(data), response.status, data);
  }

  return data as unknown as MercadoPagoPaymentResponsePayload;
}
