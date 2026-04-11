import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import type {
  MercadoPagoPaymentMethodRecord,
  MercadoPagoPaymentRequest,
  MercadoPagoPaymentResponsePayload
} from "./payment.types";

let paymentMethodsCachePromise: Promise<MercadoPagoPaymentMethodRecord[]> | null = null;

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

async function parseMercadoPagoResponse(response: Response) {
  const rawBody = await response.text();

  if (!rawBody.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new AppError(
      "O Mercado Pago retornou uma resposta inesperada. Verifique os logs do backend na Vercel.",
      502,
      {
        status: response.status,
        rawBody: rawBody.slice(0, 500)
      }
    );
  }
}

async function requestMercadoPago(path: string, init: RequestInit) {
  try {
    const response = await fetch(buildMercadoPagoUrl(path), init);
    const data = await parseMercadoPagoResponse(response);

    if (!response.ok) {
      throw new AppError(resolveMercadoPagoErrorMessage(data), response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Falha ao conectar com o Mercado Pago. Verifique as variaveis do deploy e tente novamente.",
      502,
      {
        error: error instanceof Error ? error.message : String(error)
      }
    );
  }
}

export async function createMercadoPagoPayment(
  body: MercadoPagoPaymentRequest,
  idempotencyKey: string
) {
  const data = await requestMercadoPago("/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
      "x-idempotency-key": idempotencyKey
    },
    body: JSON.stringify(body)
  });

  return data as unknown as MercadoPagoPaymentResponsePayload;
}

export async function listMercadoPagoPaymentMethods() {
  if (!paymentMethodsCachePromise) {
    paymentMethodsCachePromise = requestMercadoPago("/v1/payment_methods", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
        "Content-Type": "application/json"
      }
    })
      .then(async (response) => {
        return response as unknown as MercadoPagoPaymentMethodRecord[];
      })
      .catch((error) => {
        paymentMethodsCachePromise = null;
        throw error;
      });
  }

  return paymentMethodsCachePromise;
}
