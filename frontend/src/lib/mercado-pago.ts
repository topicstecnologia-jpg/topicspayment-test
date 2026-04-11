export interface MercadoPagoCardFormData {
  token?: string;
  paymentMethodId?: string;
  issuerId?: string;
  installments?: string | number;
}

export interface MercadoPagoCardFormInstance {
  getCardFormData(): MercadoPagoCardFormData;
  unmount?(): void;
}

export interface MercadoPagoCardFormConfig {
  amount: string;
  iframe: boolean;
  form: {
    id: string;
    cardNumber: { id: string; placeholder?: string };
    expirationDate: { id: string; placeholder?: string };
    securityCode: { id: string; placeholder?: string };
    cardholderName: { id: string; placeholder?: string };
    cardholderEmail: { id: string; placeholder?: string };
    issuer: { id: string; placeholder?: string };
    installments: { id: string; placeholder?: string };
    identificationType: { id: string; placeholder?: string };
    identificationNumber: { id: string; placeholder?: string };
  };
  callbacks?: {
    onFormMounted?: (error?: { message?: string }) => void;
    onSubmit?: (event: Event) => void;
    onFetching?: (resource: string) => (() => void) | void;
    onError?: (error: { message?: string }) => void;
  };
}

export interface MercadoPagoInstance {
  cardForm(config: MercadoPagoCardFormConfig): MercadoPagoCardFormInstance;
}

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: {
        locale?: string;
      }
    ) => MercadoPagoInstance;
  }
}

let mercadoPagoSdkPromise: Promise<void> | null = null;

export async function loadMercadoPagoSdk() {
  if (typeof window === "undefined") {
    throw new Error("MercadoPago.js pode ser carregado apenas no navegador.");
  }

  if (window.MercadoPago) {
    return;
  }

  if (!mercadoPagoSdkPromise) {
    mercadoPagoSdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.id = "mercado-pago-sdk";
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Nao foi possivel carregar o SDK do Mercado Pago."));
      document.head.appendChild(script);
    });
  }

  await mercadoPagoSdkPromise;
}
