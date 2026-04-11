export type CheckoutPaymentMethod = "card" | "pix" | "boleto";
export type CheckoutAudience = "br" | "international";
export type CheckoutDocumentType = "CPF" | "CNPJ";

export interface CheckoutBuyerInput {
  fullName: string;
  email: string;
  phone: string;
  document: string;
  audience: CheckoutAudience;
}

export interface CheckoutBillingAddressInput {
  zipCode: string;
  streetName: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  federalUnit: string;
}

export interface CheckoutCardPaymentInput {
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number;
}

export interface CreateCheckoutCardPaymentInput {
  productId: string;
  offerId: string;
  paymentMethod: "card";
  customer: CheckoutBuyerInput;
  card: CheckoutCardPaymentInput;
}

export interface CreateCheckoutPixPaymentInput {
  productId: string;
  offerId: string;
  paymentMethod: "pix";
  customer: CheckoutBuyerInput;
}

export interface CreateCheckoutBoletoPaymentInput {
  productId: string;
  offerId: string;
  paymentMethod: "boleto";
  customer: CheckoutBuyerInput;
  billingAddress: CheckoutBillingAddressInput;
}

export type CreateCheckoutPaymentInput =
  | CreateCheckoutCardPaymentInput
  | CreateCheckoutPixPaymentInput
  | CreateCheckoutBoletoPaymentInput;

export interface CheckoutPaymentSummary {
  provider: "mercado_pago";
  providerPaymentId: string;
  externalReference: string;
  method: CheckoutPaymentMethod;
  status: string;
  statusDetail: string | null;
  amount: number;
  currency: string;
  description: string;
  ticketUrl: string | null;
  paidAmount: number | null;
  expiresAt: string | null;
  pix: {
    qrCode: string | null;
    qrCodeBase64: string | null;
  } | null;
  boleto: {
    barcode: string | null;
    digitableLine: string | null;
  } | null;
  card: {
    lastFourDigits: string | null;
    firstSixDigits: string | null;
    installments: number | null;
    installmentAmount: number | null;
  } | null;
}

export interface CheckoutPaymentResponse {
  message: string;
  payment: CheckoutPaymentSummary;
}

export interface MercadoPagoPaymentRequest {
  additional_info?: {
    items?: Array<{
      id: string;
      title: string;
      description?: string;
      quantity: number;
      unit_price: number;
      picture_url?: string | null;
      category_id?: string;
    }>;
      payer?: {
        first_name?: string;
        last_name?: string;
        phone?: {
          area_code?: string;
          number?: string;
        };
        address?: {
          zip_code?: string;
          street_name?: string;
          street_number?: string;
        };
      };
  };
  binary_mode?: boolean;
  date_of_expiration?: string;
  description: string;
  external_reference: string;
  installments?: number;
  issuer_id?: string;
  metadata?: Record<string, string>;
  notification_url?: string;
  payment_method_id: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification: {
      type: CheckoutDocumentType;
      number: string;
    };
    phone?: {
      area_code?: string;
      number?: string;
    };
    address?: {
      zip_code: string;
      street_name: string;
      street_number: string;
      neighborhood: string;
      city: string;
      federal_unit: string;
    };
  };
  statement_descriptor?: string;
  token?: string;
  transaction_amount: number;
}

export interface MercadoPagoPaymentResponsePayload {
  barcode?: {
    content?: string | null;
  };
  currency_id?: string | null;
  date_of_expiration?: string | null;
  external_reference?: string | null;
  id: number | string;
  installments?: number | null;
  payment_method_id?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string | null;
      qr_code_base64?: string | null;
      ticket_url?: string | null;
    };
  };
  status?: string | null;
  status_detail?: string | null;
  ticket_url?: string | null;
  transaction_amount?: number | null;
  transaction_details?: {
    external_resource_url?: string | null;
    installment_amount?: number | null;
    total_paid_amount?: number | null;
  };
  card?: {
    first_six_digits?: string | null;
    last_four_digits?: string | null;
  };
}
