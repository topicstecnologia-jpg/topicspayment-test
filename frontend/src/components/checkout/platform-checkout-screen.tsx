"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  CreditCard,
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
import { cn } from "@/lib/utils";
import type { PlatformCheckoutItem } from "@/types/platform";

type CheckoutPaymentMethod = "card" | "pix" | "boleto";
type CheckoutAudience = "br" | "international";

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
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardHolder: string;
  installments: number;
}

const defaultFormState: CheckoutFormState = {
  fullName: "",
  email: "",
  countryCode: "+55",
  phone: "",
  document: "",
  saveForNextPurchase: true,
  cardNumber: "",
  cardExpiry: "",
  cardCvv: "",
  cardHolder: "",
  installments: 1
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function onlyDigits(value: string) {
  return value.replace(/\D+/g, "");
}

function formatPhoneLabel(value: string) {
  const digits = onlyDigits(value);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  return value;
}

function formatCardNumber(value: string) {
  return onlyDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

function formatCardExpiry(value: string) {
  const digits = onlyDigits(value).slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
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

  const [audience, setAudience] = useState<CheckoutAudience>("br");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<PlatformCheckoutItem | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<CheckoutPaymentMethod | null>(null);
  const [formState, setFormState] = useState<CheckoutFormState>(defaultFormState);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          error instanceof ApiError ? error.message : "Não foi possível carregar este checkout."
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

  const availableMethods = useMemo<CheckoutPaymentMethod[]>(() => {
    if (!checkout) {
      return [];
    }

    const next: CheckoutPaymentMethod[] = [];

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

    setSelectedMethod((current) => (current && availableMethods.includes(current) ? current : availableMethods[0]));
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
            ? `${formatCurrency(checkout.offer.price)} à vista`
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
  const selectedInstallment =
    selectedMethod === "card" ? formState.installments : 1;
  const selectedInstallmentValue =
    checkout && selectedInstallment > 0 ? checkout.offer.price / selectedInstallment : 0;

  function updateField<K extends keyof CheckoutFormState>(key: K, value: CheckoutFormState[K]) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
    setSubmitMessage(null);
  }

  function validateForm() {
    if (!selectedMethod) {
      return "Esta oferta não possui um método de pagamento ativo no momento.";
    }

    if (!formState.fullName.trim()) {
      return "Preencha o nome completo para continuar.";
    }

    if (!formState.email.trim() || !/\S+@\S+\.\S+/.test(formState.email)) {
      return "Informe um e-mail válido para receber a compra.";
    }

    if (!formState.phone.trim()) {
      return "Informe o celular do comprador.";
    }

    if (!formState.document.trim()) {
      return audience === "br" ? "Informe o CPF ou CNPJ." : "Informe o documento do comprador.";
    }

    if (selectedMethod === "card") {
      if (onlyDigits(formState.cardNumber).length < 13) {
        return "Informe um número de cartão válido.";
      }

      if (formState.cardExpiry.trim().length < 5) {
        return "Informe a validade do cartão.";
      }

      if (onlyDigits(formState.cardCvv).length < 3) {
        return "Informe o CVV do cartão.";
      }

      if (!formState.cardHolder.trim()) {
        return "Informe o nome do titular do cartão.";
      }
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setSubmitMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 450);
    });

    setIsSubmitting(false);
    setSubmitMessage(
      "Checkout validado com sucesso. A etapa de cobrança será conectada ao Mercado Pago na próxima integração."
    );
  }

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
            Checkout indisponível
          </h1>
          <p className="mt-3 max-w-2xl text-[1rem] leading-7 text-[#5f6c80]">
            {errorMessage ?? "Esta oferta não está disponível para pagamento no momento."}
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
            onSubmit={handleSubmit}
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
                Preencha seus dados para avançar no checkout da oferta.
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
                <span className="text-[0.96rem] font-medium text-[#223149]">E-mail que receberá a compra</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="voce@exemplo.com"
                  className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                />
              </label>

              <div className="grid gap-5 md:grid-cols-[230px_minmax(0,1fr)]">
                <label className="space-y-2">
                  <span className="text-[0.96rem] font-medium text-[#223149]">País</span>
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
                  value={formState.document}
                  onChange={(event) => updateField("document", event.target.value)}
                  placeholder={audience === "br" ? "000.000.000-00" : "Passport / Tax ID"}
                  className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                />
              </label>

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
                <span className="text-[1rem] font-medium text-[#263449]">Salvar dados para a próxima compra?</span>
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
                    ? { label: "Cartão de Crédito", icon: CreditCard }
                    : method === "pix"
                      ? { label: "Pix", icon: QrCode }
                      : { label: "Boleto", icon: Receipt };
                const Icon = config.icon;

                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
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

            {selectedMethod === "card" ? (
              <div className="mt-6 grid gap-5">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_170px]">
                  <label className="space-y-2">
                    <span className="text-[0.96rem] font-medium text-[#223149]">Número do cartão</span>
                    <input
                      value={formState.cardNumber}
                      onChange={(event) => updateField("cardNumber", formatCardNumber(event.target.value))}
                      placeholder="0000 0000 0000 0000"
                      className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-[0.96rem] font-medium text-[#223149]">Parcelamento</span>
                    <div className="relative">
                      <select
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

                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_160px_150px]">
                  <label className="space-y-2">
                    <span className="text-[0.96rem] font-medium text-[#223149]">Nome do titular do cartão</span>
                    <input
                      value={formState.cardHolder}
                      onChange={(event) => updateField("cardHolder", event.target.value)}
                      placeholder="Nome como está no cartão"
                      className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-[0.96rem] font-medium text-[#223149]">Validade</span>
                    <input
                      value={formState.cardExpiry}
                      onChange={(event) => updateField("cardExpiry", formatCardExpiry(event.target.value))}
                      placeholder="MM/AA"
                      className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-[0.96rem] font-medium text-[#223149]">CVV</span>
                    <input
                      value={formState.cardCvv}
                      onChange={(event) => updateField("cardCvv", onlyDigits(event.target.value).slice(0, 4))}
                      placeholder="123"
                      className="h-16 w-full rounded-[18px] border border-[#d2dbe7] bg-white px-6 text-[1.02rem] text-[#132035] outline-none transition placeholder:text-[#a2adbd] focus:border-[#7c4dff] focus:ring-4 focus:ring-[#7c4dff]/10"
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {selectedMethod === "pix" ? (
              <div className="mt-6 rounded-[24px] border border-[#d7e7dc] bg-[#f6fffb] px-5 py-5 text-[#215543]">
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5" />
                  <p className="text-[1rem] font-semibold">Pix disponível</p>
                </div>
                <p className="mt-3 text-[0.96rem] leading-7 text-[#4a6a5d]">
                  Nesta etapa estamos preparando a experiência do checkout. O QR Code e a cobrança Pix serão conectados ao Mercado Pago na próxima integração.
                </p>
              </div>
            ) : null}

            {selectedMethod === "boleto" ? (
              <div className="mt-6 rounded-[24px] border border-[#e2e6ee] bg-[#f8faff] px-5 py-5 text-[#23334c]">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5" />
                  <p className="text-[1rem] font-semibold">Boleto bancário</p>
                </div>
                <p className="mt-3 text-[0.96rem] leading-7 text-[#5d6980]">
                  O boleto será gerado automaticamente quando a integração de pagamento for ativada. O vencimento configurado para esta oferta é de {checkout.offer.boletoDueDays} {checkout.offer.boletoDueDays === 1 ? "dia útil" : "dias úteis"}.
                </p>
              </div>
            ) : null}

            <div className="mt-8 rounded-[24px] border border-[#dbe3ef] bg-[#f8faff] px-5 py-5 text-[0.96rem] leading-7 text-[#5a6880]">
              Ao seguir com a compra, você confirma que leu e concorda com os termos desta experiência de checkout. A etapa de cobrança será conectada ao Mercado Pago na próxima entrega.
            </div>

            {submitMessage ? (
              <div className="mt-5 rounded-[20px] border border-[#d7e7dc] bg-[#f6fffb] px-5 py-4 text-[0.96rem] font-medium text-[#1e5d44]">
                {submitMessage}
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
                    <p className="mt-2 text-[0.96rem] leading-6 text-[#617087]">
                      {checkoutTitle}
                    </p>
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
                      ou {formatCurrency(checkout.offer.price)} à vista
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 text-[0.82rem] font-semibold text-[#8090a8]">
                  {availableMethods.includes("card") ? (
                    <span className="rounded-full border border-[#e0e6ef] bg-[#f8faff] px-3 py-1.5">Cartão</span>
                  ) : null}
                  {availableMethods.includes("pix") ? (
                    <span className="rounded-full border border-[#e0e6ef] bg-[#f8faff] px-3 py-1.5">Pix</span>
                  ) : null}
                  {availableMethods.includes("boleto") ? (
                    <span className="rounded-full border border-[#e0e6ef] bg-[#f8faff] px-3 py-1.5">Boleto</span>
                  ) : null}
                </div>

                <button
                  type="submit"
                  form={checkoutFormId}
                  className="checkout-cta-shine mt-8 inline-flex h-[68px] w-full items-center justify-center rounded-[20px] border border-[#0f7a51] px-6 text-[1.02rem] font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_24px_60px_rgba(7,113,72,0.24)] transition hover:brightness-[1.03]"
                >
                  {isSubmitting ? "VALIDANDO DADOS..." : "COMPRAR AGORA"}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#dbe3ef] bg-white/82 px-5 py-5 text-[0.92rem] leading-7 text-[#5f6d82] shadow-[0_16px_40px_rgba(24,38,58,0.06)]">
              A oferta permanece disponível enquanto estiver ativa. Quando a integração com o Mercado Pago for conectada, este mesmo link continuará sendo o endereço oficial de pagamento do cliente.
            </div>
          </aside>
        </div>
      </div>
    </CheckoutFrame>
  );
}
