"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  QrCode,
  Receipt,
  ShieldCheck
} from "lucide-react";

import { PlatformBottomBlur } from "@/components/platform/platform-bottom-blur";
import { PlatformEnergyLines } from "@/components/platform/platform-energy-lines";
import { ApiError, authApi } from "@/lib/api";
import {
  loadMercadoPagoSdk,
  type MercadoPagoCardFormData,
  type MercadoPagoCardFormInstance
} from "@/lib/mercado-pago";
import { cn } from "@/lib/utils";
import type {
  PlatformCheckoutAudience,
  PlatformCheckoutItem,
  PlatformCheckoutPaymentMethod,
  PlatformCheckoutPaymentPayload,
  PlatformCheckoutPaymentResponse
} from "@/types/platform";

interface PlatformCheckoutScreenProps {
  productId?: string;
  offerCode?: string;
}

interface CheckoutFormState {
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  document: string;
  saveForNextPurchase: boolean;
  cardHolder: string;
  installments: number;
  billingZipCode: string;
  billingStreetName: string;
  billingStreetNumber: string;
  billingNeighborhood: string;
  billingCity: string;
  billingFederalUnit: string;
}

interface CheckoutFeedback {
  tone: "error" | "success";
  message: string;
}

const mercadoPagoPublicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim() ?? "";

const defaultFormState: CheckoutFormState = {
  fullName: "",
  email: "",
  countryCode: "+55",
  phone: "",
  document: "",
  saveForNextPurchase: true,
  cardHolder: "",
  installments: 1,
  billingZipCode: "",
  billingStreetName: "",
  billingStreetNumber: "",
  billingNeighborhood: "",
  billingCity: "",
  billingFederalUnit: ""
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function onlyDigits(value: string) {
  return value.replace(/\D+/g, "");
}

function formatPhoneLabel(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatZipCode(value: string) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatDocument(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "TP";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function getDocumentType(document: string) {
  return onlyDigits(document).length > 11 ? "CNPJ" : "CPF";
}

function CheckoutFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="platform-compact relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#edf2fb_0%,#e7edf7_54%,#dee6f3_100%)] px-4 py-6 text-[#162032] sm:px-6 lg:px-8 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(140,82,255,0.1),transparent_24%),radial-gradient(circle_at_82%_8%,rgba(196,166,255,0.12),transparent_18%),radial-gradient(circle_at_50%_100%,rgba(140,82,255,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.08)_32%,rgba(255,255,255,0.02)_100%)]" />
      <div className="auth-noise pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(124,77,255,0.045)_16%,transparent_30%,transparent_70%,rgba(124,77,255,0.04)_84%,transparent_100%)] opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-soft-light [mask-image:linear-gradient(180deg,rgba(0,0,0,0.45),rgba(0,0,0,0.22)_48%,rgba(0,0,0,0.9)_100%)]">
        <PlatformEnergyLines />
      </div>
      <div className="pointer-events-none absolute inset-x-[14%] bottom-[-72px] h-44 rounded-full bg-[radial-gradient(circle,rgba(140,82,255,0.18),rgba(196,166,255,0.08)_42%,transparent_72%)] blur-[52px]" />

      <div className="relative z-[1]">{children}</div>
      <PlatformBottomBlur />
    </div>
  );
}

export function PlatformCheckoutScreen({ productId, offerCode }: PlatformCheckoutScreenProps) {
  const checkoutFormId = "platform-checkout-form";
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offer") ?? undefined;
  const formRef = useRef<HTMLFormElement | null>(null);
  const cardFormRef = useRef<MercadoPagoCardFormInstance | null>(null);
  const audienceRef = useRef<PlatformCheckoutAudience>("br");
  const checkoutRef = useRef<PlatformCheckoutItem | null>(null);
  const formStateRef = useRef<CheckoutFormState>(defaultFormState);
  const isCardFormReadyRef = useRef(false);
  const selectedMethodRef = useRef<PlatformCheckoutPaymentMethod | null>(null);

  const [audience, setAudience] = useState<PlatformCheckoutAudience>("br");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<PlatformCheckoutItem | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PlatformCheckoutPaymentMethod | null>(null);
  const [formState, setFormState] = useState<CheckoutFormState>(defaultFormState);
  const [feedback, setFeedback] = useState<CheckoutFeedback | null>(null);
  const [paymentResult, setPaymentResult] = useState<PlatformCheckoutPaymentResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCardFormReady, setIsCardFormReady] = useState(false);
  const [cardFormError, setCardFormError] = useState<string | null>(null);

  useEffect(() => {
    checkoutRef.current = checkout;
  }, [checkout]);

  useEffect(() => {
    formStateRef.current = formState;
  }, [formState]);

  useEffect(() => {
    audienceRef.current = audience;
  }, [audience]);

  useEffect(() => {
    isCardFormReadyRef.current = isCardFormReady;
  }, [isCardFormReady]);

  useEffect(() => {
    selectedMethodRef.current = selectedMethod;
  }, [selectedMethod]);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setErrorMessage(null);

    const request = offerCode
      ? authApi.getPlatformCheckoutByCode(offerCode)
      : productId
        ? authApi.getPlatformCheckout(productId, offerId)
        : Promise.reject(new Error("Checkout sem identificador."));

    request
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setCheckout(response.item);
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof ApiError ? error.message : "Nao foi possivel carregar este checkout."
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [offerCode, offerId, productId]);

  const availableMethods = useMemo<PlatformCheckoutPaymentMethod[]>(() => {
    if (!checkout) {
      return [];
    }

    const next: PlatformCheckoutPaymentMethod[] = [];

    if (checkout.offer.cardEnabled) {
      next.push("card");
    }

    if (checkout.offer.pixManualEnabled) {
      next.push("pix");
    }

    if (checkout.offer.boletoEnabled) {
      next.push("boleto");
    }

    return next;
  }, [checkout]);

  useEffect(() => {
    if (availableMethods.length === 0) {
      setSelectedMethod(null);
      return;
    }

    setSelectedMethod((current) =>
      current && availableMethods.includes(current) ? current : availableMethods[0]
    );
  }, [availableMethods]);

  const installmentOptions = useMemo(() => {
    if (!checkout?.offer.cardEnabled) {
      return [];
    }

    const minimum = checkout.offer.cardSinglePaymentEnabled ? 1 : 2;
    const maximum = Math.max(minimum, checkout.offer.cardInstallmentLimit);

    return Array.from({ length: maximum - minimum + 1 }, (_, index) => {
      const value = minimum + index;
      const installmentValue = checkout.offer.price / value;

      return {
        value,
        label:
          value === 1
            ? `${formatCurrency(checkout.offer.price)} a vista`
            : `${value}x de ${formatCurrency(installmentValue)}`
      };
    });
  }, [checkout]);

  useEffect(() => {
    if (installmentOptions.length === 0) {
      return;
    }

    setFormState((current) => {
      const alreadySelected = installmentOptions.some((option) => option.value === current.installments);

      if (alreadySelected) {
        return current;
      }

      return {
        ...current,
        installments: installmentOptions[0]?.value ?? 1
      };
    });
  }, [installmentOptions]);

  const productVisual = checkout?.offer.imageUrl || checkout?.productImageUrl || null;
  const checkoutTitle = checkout?.offer.checkoutDescription || checkout?.offer.title || checkout?.productName;
  const selectedInstallment = selectedMethod === "card" ? formState.installments : 1;
  const selectedInstallmentValue =
    checkout && selectedInstallment > 0 ? checkout.offer.price / selectedInstallment : 0;
  const documentType = getDocumentType(formState.document);
  const boletoExpirationLabel = checkout
    ? `${checkout.offer.boletoDueDays} ${checkout.offer.boletoDueDays === 1 ? "dia util" : "dias uteis"}`
    : null;

  function resetCheckoutFeedback() {
    setFeedback(null);
    setPaymentResult(null);
  }

  function updateField<K extends keyof CheckoutFormState>(key: K, value: CheckoutFormState[K]) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
    resetCheckoutFeedback();
  }

  function validateForm(method: PlatformCheckoutPaymentMethod | null) {
    const currentFormState = formStateRef.current;
    const currentAudience = audienceRef.current;

    if (!method) {
      return "Esta oferta nao possui um metodo de pagamento ativo no momento.";
    }

    if (currentAudience !== "br") {
      return "No momento, os pagamentos automatizados deste checkout atendem apenas compradores do Brasil.";
    }

    if (!currentFormState.fullName.trim()) {
      return "Preencha o nome completo para continuar.";
    }

    if (!currentFormState.email.trim() || !/\S+@\S+\.\S+/.test(currentFormState.email)) {
      return "Informe um e-mail valido para receber a compra.";
    }

    if (!currentFormState.phone.trim()) {
      return "Informe o celular do comprador.";
    }

    const documentDigits = onlyDigits(currentFormState.document);

    if (documentDigits.length !== 11 && documentDigits.length !== 14) {
      return "Informe um CPF ou CNPJ valido.";
    }

    if (method === "card") {
      if (!mercadoPagoPublicKey) {
        return "Configure NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY para ativar o cartao no checkout.";
      }

      if (!isCardFormReadyRef.current) {
        return "Os campos seguros do cartao ainda estao carregando. Tente novamente em instantes.";
      }

      if (!currentFormState.cardHolder.trim()) {
        return "Informe o nome do titular do cartao.";
      }
    }

    if (method === "boleto") {
      if (!currentFormState.billingZipCode.trim()) {
        return "Informe o CEP para gerar o boleto.";
      }

      if (!currentFormState.billingStreetName.trim()) {
        return "Informe a rua do endereco de cobranca.";
      }

      if (!currentFormState.billingStreetNumber.trim()) {
        return "Informe o numero do endereco de cobranca.";
      }

      if (!currentFormState.billingNeighborhood.trim()) {
        return "Informe o bairro do endereco de cobranca.";
      }

      if (!currentFormState.billingCity.trim()) {
        return "Informe a cidade do endereco de cobranca.";
      }

      if (currentFormState.billingFederalUnit.trim().length !== 2) {
        return "Informe a UF do endereco de cobranca com duas letras.";
      }
    }

    return null;
  }

  function buildBuyerPayload() {
    return {
      fullName: formStateRef.current.fullName.trim(),
      email: formStateRef.current.email.trim(),
      phone: formStateRef.current.phone.trim(),
      document: formStateRef.current.document.trim(),
      audience: audienceRef.current
    } satisfies PlatformCheckoutPaymentPayload["customer"];
  }

  async function submitCheckoutPayment(payload: PlatformCheckoutPaymentPayload) {
    setIsSubmitting(true);
    setFeedback(null);
    setPaymentResult(null);

    try {
      const response = await authApi.createPlatformCheckoutPayment(payload);

      setPaymentResult(response);
      setFeedback({
        tone: "success",
        message: response.message
      });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Nao foi possivel processar o pagamento.";

      setFeedback({
        tone: "error",
        message
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCardPaymentSubmission() {
    const method = selectedMethodRef.current;
    const validationMessage = validateForm(method);

    if (validationMessage) {
      setFeedback({
        tone: "error",
        message: validationMessage
      });
      return;
    }

    const checkoutSnapshot = checkoutRef.current;
    const cardFormData = cardFormRef.current?.getCardFormData() as MercadoPagoCardFormData | undefined;

    if (!checkoutSnapshot) {
      setFeedback({
        tone: "error",
        message: "Checkout indisponivel no momento."
      });
      return;
    }

    if (!cardFormData?.token || !cardFormData.paymentMethodId) {
      setFeedback({
        tone: "error",
        message: "Nao foi possivel tokenizar o cartao. Confira os dados e tente novamente."
      });
      return;
    }

    await submitCheckoutPayment({
      productId: checkoutSnapshot.productId,
      offerId: checkoutSnapshot.offerId,
      paymentMethod: "card",
      customer: buildBuyerPayload(),
      card: {
        token: cardFormData.token,
        paymentMethodId: cardFormData.paymentMethodId,
        issuerId: cardFormData.issuerId || undefined,
        installments:
          typeof cardFormData.installments === "number"
            ? cardFormData.installments
            : Number(cardFormData.installments) || formStateRef.current.installments
      }
    });
  }

  useEffect(() => {
    const checkoutSnapshot = checkout;

    if (!checkoutSnapshot?.offer.cardEnabled) {
      cardFormRef.current?.unmount?.();
      cardFormRef.current = null;
      setCardFormError(null);
      setIsCardFormReady(false);
      return;
    }

    if (!mercadoPagoPublicKey) {
      setCardFormError("Chave publica do Mercado Pago nao configurada no frontend.");
      setIsCardFormReady(false);
      return;
    }

    const checkoutAmount = checkoutSnapshot.offer.price.toFixed(2);
    let isMounted = true;

    async function setupCardForm() {
      try {
        setCardFormError(null);
        setIsCardFormReady(false);
        await loadMercadoPagoSdk();

        if (!isMounted || !window.MercadoPago) {
          return;
        }

        cardFormRef.current?.unmount?.();

        const mercadoPago = new window.MercadoPago(mercadoPagoPublicKey, {
          locale: "pt-BR"
        });

        cardFormRef.current = mercadoPago.cardForm({
          amount: checkoutAmount,
          iframe: true,
          form: {
            id: checkoutFormId,
            cardNumber: {
              id: "form-checkout__cardNumber",
              placeholder: "Numero do cartao"
            },
            expirationDate: {
              id: "form-checkout__expirationDate",
              placeholder: "MM/AA"
            },
            securityCode: {
              id: "form-checkout__securityCode",
              placeholder: "CVV"
            },
            cardholderName: {
              id: "form-checkout__cardholderName",
              placeholder: "Nome como esta no cartao"
            },
            cardholderEmail: {
              id: "form-checkout__cardholderEmail",
              placeholder: "voce@exemplo.com"
            },
            issuer: {
              id: "form-checkout__issuer",
              placeholder: "Banco emissor"
            },
            installments: {
              id: "form-checkout__installments",
              placeholder: "Parcelamento"
            },
            identificationType: {
              id: "form-checkout__identificationType"
            },
            identificationNumber: {
              id: "form-checkout__identificationNumber",
              placeholder: "CPF ou CNPJ"
            }
          },
          callbacks: {
            onFormMounted(error) {
              if (!isMounted) {
                return;
              }

              if (error?.message) {
                setCardFormError(error.message);
                setIsCardFormReady(false);
                return;
              }

              setCardFormError(null);
              setIsCardFormReady(true);
            },
            onSubmit(event) {
              event.preventDefault();
              void handleCardPaymentSubmission();
            },
            onError(error) {
              if (!isMounted) {
                return;
              }

              setCardFormError(error.message || "Nao foi possivel carregar os campos do cartao.");
            }
          }
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCardFormError(
          error instanceof Error ? error.message : "Nao foi possivel iniciar o cartao do Mercado Pago."
        );
        setIsCardFormReady(false);
      }
    }

    void setupCardForm();

    return () => {
      isMounted = false;
      cardFormRef.current?.unmount?.();
      cardFormRef.current = null;
      setIsCardFormReady(false);
    };
  }, [checkout, checkoutFormId]);

  async function handleNonCardPayment(method: Exclude<PlatformCheckoutPaymentMethod, "card">) {
    const validationMessage = validateForm(method);

    if (validationMessage) {
      setFeedback({
        tone: "error",
        message: validationMessage
      });
      return;
    }

    if (!checkout) {
      setFeedback({
        tone: "error",
        message: "Checkout indisponivel no momento."
      });
      return;
    }

    if (method === "pix") {
      await submitCheckoutPayment({
        productId: checkout.productId,
        offerId: checkout.offerId,
        paymentMethod: "pix",
        customer: buildBuyerPayload()
      });
      return;
    }

    await submitCheckoutPayment({
      productId: checkout.productId,
      offerId: checkout.offerId,
      paymentMethod: "boleto",
      customer: buildBuyerPayload(),
      billingAddress: {
        zipCode: formState.billingZipCode.trim(),
        streetName: formState.billingStreetName.trim(),
        streetNumber: formState.billingStreetNumber.trim(),
        neighborhood: formState.billingNeighborhood.trim(),
        city: formState.billingCity.trim(),
        federalUnit: formState.billingFederalUnit.trim().toUpperCase()
      }
    });
  }

  function handlePrimaryAction() {
    if (!selectedMethod) {
      setFeedback({
        tone: "error",
        message: "Selecione uma forma de pagamento para continuar."
      });
      return;
    }

    const validationMessage = validateForm(selectedMethod);

    if (validationMessage) {
      setFeedback({
        tone: "error",
        message: validationMessage
      });
      return;
    }

    if (selectedMethod === "card") {
      formRef.current?.requestSubmit();
      return;
    }

    void handleNonCardPayment(selectedMethod);
  }

  async function handleCopy(value: string | null | undefined) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setFeedback({
        tone: "success",
        message: "Codigo copiado com sucesso."
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Nao foi possivel copiar o codigo automaticamente."
      });
    }
  }

  const submitLabel = useMemo(() => {
    if (selectedMethod === "pix") {
      return isSubmitting ? "GERANDO PIX..." : "GERAR PIX";
    }

    if (selectedMethod === "boleto") {
      return isSubmitting ? "GERANDO BOLETO..." : "GERAR BOLETO";
    }

    return isSubmitting ? "PROCESSANDO..." : "COMPRAR AGORA";
  }, [isSubmitting, selectedMethod]);

  if (isLoading) {
    return (
      <CheckoutFrame>
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center rounded-[36px] border border-[#dbe3ef] bg-white/80 shadow-[0_24px_80px_rgba(24,38,58,0.08)]">
          <div className="flex items-center gap-3 text-[1rem] font-semibold text-[#445269]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando checkout...
          </div>
        </div>
      </CheckoutFrame>
    );
  }

  if (errorMessage || !checkout) {
    return (
      <CheckoutFrame>
        <div className="mx-auto max-w-4xl rounded-[36px] border border-[#dbe3ef] bg-white p-8 shadow-[0_24px_80px_rgba(24,38,58,0.08)] sm:p-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#eef3ff] text-[#3e63ff]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-[2rem] font-semibold tracking-[-0.06em] text-[#132035]">
            Checkout indisponivel
          </h1>
          <p className="mt-3 max-w-2xl text-[1rem] leading-7 text-[#5f6c80]">
            {errorMessage ?? "Esta oferta nao esta disponivel para pagamento no momento."}
          </p>
        </div>
      </CheckoutFrame>
    );
  }

  return (
    <CheckoutFrame>
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_360px] lg:items-start">
          <form
            id={checkoutFormId}
            ref={formRef}
            className="rounded-[34px] border border-[#dbe3ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,255,0.96))] p-6 shadow-[0_28px_90px_rgba(24,38,58,0.08)] sm:p-8"
          >
            <div className="inline-flex rounded-[16px] border border-[#d8e0eb] bg-[#f7f9fc] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
              {[
                { id: "br" as const, label: "BR Brasil" },
                { id: "international" as const, label: "Internacional" }
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAudience(option.id)}
                  className={cn(
                    "rounded-[12px] px-5 py-2.5 text-[0.95rem] font-semibold transition",
                    audience === option.id
                      ? "bg-white text-[#132035] shadow-[0_10px_24px_rgba(20,28,42,0.08)]"
                      : "text-[#6f7a8f] hover:text-[#253247]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h1 className="text-[2rem] font-semibold tracking-[-0.06em] text-[#132035]">Dados pessoais</h1>
              <p className="mt-2 text-[1rem] leading-7 text-[#667489]">
                Preencha seus dados para avancar no checkout da oferta.
              </p>
            </div>

            <div className="mt-8 grid gap-5">
              <label className="space-y-2">
                <span className="text-[0.96rem] font-medium text-[#223149]">Seu nome</span>
                <input
                  value={formState.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Seu nome completo"
                  className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                />
              </label>

              <label className="space-y-2">
                <span className="text-[0.96rem] font-medium text-[#223149]">E-mail que recebera a compra</span>
                <input
                  id="form-checkout__cardholderEmail"
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="voce@exemplo.com"
                  className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                />
              </label>

              <div className="grid gap-5 md:grid-cols-[230px_minmax(0,1fr)]">
                <label className="space-y-2">
                  <span className="text-[0.96rem] font-medium text-[#223149]">Pais</span>
                  <div className="flex h-16 items-center justify-between rounded-[18px] border border-[#d2dbe7] bg-white px-5 text-[1.02rem] text-[#132035]">
                    <span>{formState.countryCode}</span>
                    <ChevronDown className="h-5 w-5 text-[#7f8ba0]" />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-[0.96rem] font-medium text-[#223149]">Seu celular</span>
                  <input
                    value={formState.phone}
                    onChange={(event) => updateField("phone", formatPhoneLabel(event.target.value))}
                    placeholder="(11) 99999-9999"
                    className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-[0.96rem] font-medium text-[#223149]">
                  {audience === "br" ? "Seu CPF/CNPJ" : "Documento do comprador"}
                </span>
                <input
                  id="form-checkout__identificationNumber"
                  value={formState.document}
                  onChange={(event) => updateField("document", formatDocument(event.target.value))}
                  placeholder={audience === "br" ? "000.000.000-00" : "Passport / Tax ID"}
                  className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                />
              </label>

              <select
                id="form-checkout__identificationType"
                value={documentType}
                onChange={() => undefined}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>

              <div className="flex items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => updateField("saveForNextPurchase", !formState.saveForNextPurchase)}
                  className="inline-flex items-center gap-3"
                  aria-pressed={formState.saveForNextPurchase}
                >
                  <span
                    className={cn(
                      "relative inline-flex h-8 w-14 rounded-full border transition",
                      formState.saveForNextPurchase
                        ? "border-transparent bg-[linear-gradient(90deg,#253142_0%,#111827_100%)]"
                        : "border-[#cfd8e5] bg-white"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-6 w-6 rounded-full bg-white shadow-[0_8px_18px_rgba(17,24,39,0.18)] transition",
                        formState.saveForNextPurchase ? "left-[30px]" : "left-1"
                      )}
                    />
                  </span>
                </button>
                <span className="text-[1rem] font-medium text-[#263449]">Salvar dados para a proxima compra?</span>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-[1.85rem] font-semibold tracking-[-0.06em] text-[#132035]">Pagamento</h2>
              <p className="mt-2 text-[1rem] leading-7 text-[#667489]">
                Selecione a forma de pagamento desejada para concluir a compra.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {availableMethods.map((method) => {
                const isSelected = selectedMethod === method;
                const config =
                  method === "card"
                    ? { label: "Cartao de Credito", icon: CreditCard }
                    : method === "pix"
                      ? { label: "Pix", icon: QrCode }
                      : { label: "Boleto", icon: Receipt };
                const Icon = config.icon;

                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(method);
                      resetCheckoutFeedback();
                    }}
                    className={cn(
                      "inline-flex items-center gap-3 rounded-[18px] border px-5 py-4 text-[0.98rem] font-semibold transition",
                      isSelected
                        ? "border-[#0ea76a] bg-[#f2fffa] text-[#083b2a] shadow-[0_12px_28px_rgba(14,167,106,0.12)]"
                        : "border-[#d7dfea] bg-[#f6f8fc] text-[#4c5b71] hover:bg-white"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {config.label}
                  </button>
                );
              })}
            </div>

            <div className={cn("mt-6 grid gap-5", selectedMethod === "card" ? "" : "hidden")}>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_170px]">
                <label className="space-y-2">
                  <span className="text-[0.96rem] font-medium text-[#223149]">Numero do cartao</span>
                  <div
                    id="form-checkout__cardNumber"
                    className="flex h-16 w-full items-center rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] transition focus-within:border-[#7c4dff] focus-within:ring-4 focus-within:ring-[#7c4dff]/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[0.96rem] font-medium text-[#223149]">Parcelamento</span>
                  <div className="relative">
                    <select
                      id="form-checkout__installments"
                      value={formState.installments}
                      onChange={(event) => updateField("installments", Number(event.target.value))}
                      className="h-16 w-full appearance-none rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    >
                      {installmentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7f8ba0]" />
                  </div>
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px]">
                <label className="space-y-2">
                  <span className="text-[0.96rem] font-medium text-[#223149]">Nome do titular do cartao</span>
                  <input
                    id="form-checkout__cardholderName"
                    value={formState.cardHolder}
                    onChange={(event) => updateField("cardHolder", event.target.value)}
                    placeholder="Nome como esta no cartao"
                    className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[0.96rem] font-medium text-[#223149]">Validade</span>
                  <div
                    id="form-checkout__expirationDate"
                    className="flex h-16 w-full items-center rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] transition focus-within:border-[#7c4dff] focus-within:ring-4 focus-within:ring-[#7c4dff]/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[0.96rem] font-medium text-[#223149]">CVV</span>
                  <div
                    id="form-checkout__securityCode"
                    className="flex h-16 w-full items-center rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] transition focus-within:border-[#7c4dff] focus-within:ring-4 focus-within:ring-[#7c4dff]/10"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-[0.96rem] font-medium text-[#223149]">Banco emissor</span>
                <div className="relative">
                  <select
                    id="form-checkout__issuer"
                    className="h-16 w-full appearance-none rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    defaultValue=""
                  >
                    <option value="">Selecione o banco emissor</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7f8ba0]" />
                </div>
              </label>

              <div className="rounded-[24px] border border-[#dbe3ef] bg-[#f8faff] px-5 py-5 text-[0.95rem] leading-7 text-[#5a6880]">
                Os dados sensiveis do cartao sao tokenizados pelo Mercado Pago no navegador antes do envio ao backend.
              </div>

              {cardFormError ? (
                <div className="rounded-[20px] border border-[#f2d6d6] bg-[#fff6f6] px-5 py-4 text-[0.95rem] font-medium text-[#8c2b2b]">
                  {cardFormError}
                </div>
              ) : null}
            </div>

            {selectedMethod === "pix" ? (
              <div className="mt-6 rounded-[24px] border border-[#d7e7dc] bg-[#f6fffb] px-5 py-5 text-[#215543]">
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5" />
                  <p className="text-[1rem] font-semibold">Pix instantaneo</p>
                </div>
                <p className="mt-3 text-[0.96rem] leading-7 text-[#4a6a5d]">
                  Ao confirmar, vamos gerar o QR Code do Mercado Pago e o codigo copia e cola para o cliente finalizar o pagamento.
                </p>
              </div>
            ) : null}

            {selectedMethod === "boleto" ? (
              <div className="mt-6 grid gap-5">
                <div className="rounded-[24px] border border-[#e2e6ee] bg-[#f8faff] px-5 py-5 text-[#23334c]">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5" />
                    <p className="text-[1rem] font-semibold">Boleto bancario</p>
                  </div>
                  <p className="mt-3 text-[0.96rem] leading-7 text-[#5d6980]">
                    O boleto sera gerado pelo Mercado Pago com vencimento configurado para {boletoExpirationLabel}.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)_160px]">
                  <label className="space-y-2">
                    <span className="text-[0.96rem] font-medium text-[#223149]">CEP</span>
                    <input
                      value={formState.billingZipCode}
                      onChange={(event) => updateField("billingZipCode", formatZipCode(event.target.value))}
                      placeholder="00000-000"
                      className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-[0.96rem] font-medium text-[#223149]">Rua</span>
                    <input
                      value={formState.billingStreetName}
                      onChange={(event) => updateField("billingStreetName", event.target.value)}
                      placeholder="Rua, avenida ou travessa"
                      className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-[0.96rem] font-medium text-[#223149]">Numero</span>
                    <input
                      value={formState.billingStreetNumber}
                      onChange={(event) => updateField("billingStreetNumber", event.target.value)}
                      placeholder="123"
                      className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px]">
                  <label className="space-y-2">
                    <span className="text-[0.96rem] font-medium text-[#223149]">Bairro</span>
                    <input
                      value={formState.billingNeighborhood}
                      onChange={(event) => updateField("billingNeighborhood", event.target.value)}
                      placeholder="Seu bairro"
                      className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-[0.96rem] font-medium text-[#223149]">Cidade</span>
                    <input
                      value={formState.billingCity}
                      onChange={(event) => updateField("billingCity", event.target.value)}
                      placeholder="Sua cidade"
                      className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-[0.96rem] font-medium text-[#223149]">UF</span>
                    <input
                      value={formState.billingFederalUnit}
                      onChange={(event) =>
                        updateField("billingFederalUnit", event.target.value.toUpperCase().slice(0, 2))
                      }
                      placeholder="SP"
                      className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] uppercase text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    />
                  </label>
                </div>
              </div>
            ) : null}

            <div className="mt-8 rounded-[24px] border border-[#dbe3ef] bg-[#f8faff] px-5 py-5 text-[0.96rem] leading-7 text-[#5a6880]">
              Ao seguir com a compra, voce confirma que leu e concorda com os termos desta experiencia de checkout. Esta pagina agora cria a cobranca no Mercado Pago a partir da oferta selecionada.
            </div>

            {feedback ? (
              <div
                className={cn(
                  "mt-5 rounded-[20px] px-5 py-4 text-[0.96rem] font-medium",
                  feedback.tone === "success"
                    ? "border border-[#d7e7dc] bg-[#f6fffb] text-[#1e5d44]"
                    : "border border-[#f2d6d6] bg-[#fff6f6] text-[#8c2b2b]"
                )}
              >
                {feedback.message}
              </div>
            ) : null}

            {paymentResult ? (
              <div className="mt-5 rounded-[26px] border border-[#dbe3ef] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(24,38,58,0.04)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[1.05rem] font-semibold text-[#132035]">
                      Pagamento{" "}
                      {paymentResult.payment.method === "pix"
                        ? "Pix"
                        : paymentResult.payment.method === "boleto"
                          ? "por boleto"
                          : "com cartao"}
                    </p>
                    <p className="mt-1 text-[0.92rem] text-[#617087]">
                      Status atual: {paymentResult.payment.statusDetail || paymentResult.payment.status}
                    </p>
                  </div>

                  <div className="rounded-full border border-[#dbe3ef] bg-[#f8faff] px-4 py-2 text-[0.9rem] font-semibold text-[#31425b]">
                    ID {paymentResult.payment.providerPaymentId}
                  </div>
                </div>

                {paymentResult.payment.pix?.qrCodeBase64 ? (
                  <div className="mt-5 grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
                    <div className="overflow-hidden rounded-[24px] border border-[#dbe3ef] bg-white p-4">
                      <img
                        src={`data:image/png;base64,${paymentResult.payment.pix.qrCodeBase64}`}
                        alt="QR Code Pix"
                        className="h-full w-full rounded-[18px]"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[20px] border border-[#dbe3ef] bg-[#f8faff] px-4 py-4">
                        <p className="text-[0.9rem] font-semibold text-[#223149]">Pix copia e cola</p>
                        <p className="mt-2 break-all text-[0.92rem] leading-7 text-[#516077]">
                          {paymentResult.payment.pix.qrCode}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleCopy(paymentResult.payment.pix?.qrCode)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#dbe3ef] bg-white px-5 py-3 text-[0.92rem] font-semibold text-[#23334c] transition hover:bg-[#f8faff]"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar codigo Pix
                      </button>
                    </div>
                  </div>
                ) : null}

                {paymentResult.payment.boleto ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-[20px] border border-[#dbe3ef] bg-[#f8faff] px-4 py-4">
                      <p className="text-[0.9rem] font-semibold text-[#223149]">Linha digitavel / codigo de barras</p>
                      <p className="mt-2 break-all text-[0.92rem] leading-7 text-[#516077]">
                        {paymentResult.payment.boleto.digitableLine ||
                          "Codigo indisponivel neste retorno do Mercado Pago."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleCopy(paymentResult.payment.boleto?.digitableLine)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#dbe3ef] bg-white px-5 py-3 text-[0.92rem] font-semibold text-[#23334c] transition hover:bg-[#f8faff]"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar codigo do boleto
                    </button>
                  </div>
                ) : null}

                {paymentResult.payment.card ? (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[20px] border border-[#dbe3ef] bg-[#f8faff] px-4 py-4">
                      <p className="text-[0.9rem] font-semibold text-[#223149]">Cartao processado</p>
                      <p className="mt-2 text-[0.92rem] leading-7 text-[#516077]">
                        Final {paymentResult.payment.card.lastFourDigits || "----"}
                      </p>
                    </div>

                    <div className="rounded-[20px] border border-[#dbe3ef] bg-[#f8faff] px-4 py-4">
                      <p className="text-[0.9rem] font-semibold text-[#223149]">Parcelamento</p>
                      <p className="mt-2 text-[0.92rem] leading-7 text-[#516077]">
                        {paymentResult.payment.card.installments || 1}x{" "}
                        {paymentResult.payment.card.installmentAmount
                          ? `de ${formatCurrency(paymentResult.payment.card.installmentAmount)}`
                          : ""}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3 text-[0.92rem] text-[#5f6d82]">
                  <span className="rounded-full border border-[#dbe3ef] bg-[#f8faff] px-4 py-2">
                    Valor: {formatCurrency(paymentResult.payment.amount)}
                  </span>
                  {paymentResult.payment.expiresAt ? (
                    <span className="rounded-full border border-[#dbe3ef] bg-[#f8faff] px-4 py-2">
                      Expira em: {formatDateTime(paymentResult.payment.expiresAt)}
                    </span>
                  ) : null}
                </div>

                {paymentResult.payment.ticketUrl ? (
                  <a
                    href={paymentResult.payment.ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#132035] px-5 py-3 text-[0.92rem] font-semibold text-white transition hover:brightness-110"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir comprovante no Mercado Pago
                  </a>
                ) : null}
              </div>
            ) : null}
          </form>

          <aside className="lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-[30px] border border-[#dbe3ef] bg-white shadow-[0_24px_80px_rgba(24,38,58,0.08)]">
              <div className="flex items-center gap-3 bg-[#07a068] px-6 py-5 text-white">
                <ShieldCheck className="h-6 w-6" />
                <span className="text-[1.35rem] font-extrabold tracking-[-0.05em]">Compra 100% segura</span>
              </div>

              <div className="border-b border-dashed border-[#dbe3ef] px-6 py-6">
                <div className="flex items-start gap-4">
                  {productVisual ? (
                    <img
                      src={productVisual}
                      alt={checkout.productName}
                      className="h-24 w-24 rounded-[22px] border border-[#d9e1ec] object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[22px] border border-[#d9e1ec] bg-[linear-gradient(135deg,#bcff5c_0%,#7cffd9_100%)] text-[1.8rem] font-extrabold text-[#101820]">
                      {getInitials(checkout.productName)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[1.6rem] font-semibold tracking-[-0.06em] text-[#132035]">
                      {checkout.productName}
                    </p>
                    <p className="mt-2 text-[0.96rem] leading-6 text-[#617087]">{checkoutTitle}</p>
                    <div className="mt-4 flex flex-col gap-2 text-[0.92rem] text-[#4c5d76]">
                      <a
                        href={`mailto:${checkout.supportEmail}`}
                        className="inline-flex items-center gap-2 font-medium text-[#24344f] underline-offset-4 hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        {checkout.supportEmail}
                      </a>
                      {checkout.supportPhone ? (
                        <a
                          href={`tel:${onlyDigits(checkout.supportPhone)}`}
                          className="inline-flex items-center gap-2 font-medium text-[#24344f] underline-offset-4 hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {checkout.supportPhone}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[2rem] font-semibold tracking-[-0.06em] text-[#132035]">Total</p>
                    <p className="mt-2 text-[0.92rem] text-[#728097]">
                      {checkout.offer.itemCount} {checkout.offer.itemCount === 1 ? "item" : "itens"} na oferta
                    </p>
                  </div>

                  <div className="text-right">
                    {typeof checkout.offer.anchorPrice === "number" &&
                    checkout.offer.anchorPrice > checkout.offer.price ? (
                      <p className="text-[1rem] text-[#69778d] line-through">
                        {formatCurrency(checkout.offer.anchorPrice)}
                      </p>
                    ) : null}

                    <p className="text-[1.65rem] font-extrabold tracking-[-0.06em] text-[#0aa56c]">
                      {selectedInstallment > 1
                        ? `${selectedInstallment}x de ${formatCurrency(selectedInstallmentValue)}`
                        : formatCurrency(checkout.offer.price)}
                    </p>

                    <p className="mt-1 text-[0.96rem] text-[#3f4a5b]">
                      ou {formatCurrency(checkout.offer.price)} a vista
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 text-[0.82rem] font-semibold text-[#8090a8]">
                  {availableMethods.includes("card") ? (
                    <span className="rounded-full border border-[#e0e6ef] bg-[#f8faff] px-3 py-1.5">Cartao</span>
                  ) : null}
                  {availableMethods.includes("pix") ? (
                    <span className="rounded-full border border-[#e0e6ef] bg-[#f8faff] px-3 py-1.5">Pix</span>
                  ) : null}
                  {availableMethods.includes("boleto") ? (
                    <span className="rounded-full border border-[#e0e6ef] bg-[#f8faff] px-3 py-1.5">Boleto</span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={
                    isSubmitting ||
                    !selectedMethod ||
                    (selectedMethod === "card" && (!mercadoPagoPublicKey || !isCardFormReady))
                  }
                  className="checkout-cta-shine mt-8 inline-flex h-[78px] w-full items-center justify-center rounded-full px-6 text-[1.08rem] font-semibold tracking-[0.02em] text-white transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitLabel}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#dbe3ef] bg-white/82 px-5 py-5 text-[0.92rem] leading-7 text-[#5f6d82] shadow-[0_16px_40px_rgba(24,38,58,0.06)]">
              A oferta permanece disponivel enquanto estiver ativa. Quando o pagamento e criado com sucesso, este mesmo link continua sendo o endereco oficial do checkout.
            </div>
          </aside>
        </div>
      </div>
    </CheckoutFrame>
  );
}
