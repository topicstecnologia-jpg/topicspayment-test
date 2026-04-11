"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Printer,
  QrCode,
  ShieldCheck
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  PlatformCheckoutItem,
  PlatformCheckoutPaymentSummary
} from "@/types/platform";

interface PlatformPixPaymentScreenProps {
  checkout: PlatformCheckoutItem;
  payment: PlatformCheckoutPaymentSummary;
  feedback?: {
    tone: "error" | "success";
    message: string;
  } | null;
  generatedAt?: string | null;
  onBack: () => void;
  onCopy: (value: string | null | undefined) => Promise<void>;
}

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

function buildCountdown(expiresAt: string | null | undefined, now: number) {
  if (!expiresAt) {
    return {
      primary: "--",
      secondary: "--",
      primaryLabel: "hora",
      secondaryLabel: "min",
      expired: false
    };
  }

  const target = new Date(expiresAt).getTime();

  if (Number.isNaN(target)) {
    return {
      primary: "--",
      secondary: "--",
      primaryLabel: "hora",
      secondaryLabel: "min",
      expired: false
    };
  }

  const diff = Math.max(0, target - now);

  if (diff === 0) {
    return {
      primary: "00",
      secondary: "00",
      primaryLabel: "min",
      secondaryLabel: "seg",
      expired: true
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return {
      primary: String(hours).padStart(2, "0"),
      secondary: String(minutes).padStart(2, "0"),
      primaryLabel: "hora",
      secondaryLabel: "min",
      expired: false
    };
  }

  return {
    primary: String(minutes).padStart(2, "0"),
    secondary: String(seconds).padStart(2, "0"),
    primaryLabel: "min",
    secondaryLabel: "seg",
    expired: false
  };
}

function getReadablePixStatus(payment: PlatformCheckoutPaymentSummary) {
  const status = payment.statusDetail || payment.status;

  switch (status) {
    case "pending_waiting_transfer":
      return "Aguardando pagamento";
    case "approved":
      return "Pagamento aprovado";
    case "pending":
      return "Pagamento pendente";
    case "cancelled":
      return "Pagamento cancelado";
    case "rejected":
      return "Pagamento recusado";
    default:
      return status;
  }
}

export function PlatformPixPaymentScreen({
  checkout,
  payment,
  feedback,
  generatedAt,
  onBack,
  onCopy
}: PlatformPixPaymentScreenProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!payment.expiresAt) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [payment.expiresAt]);

  const countdown = useMemo(() => buildCountdown(payment.expiresAt, now), [now, payment.expiresAt]);
  const generatedAtLabel = formatDateTime(generatedAt ?? new Date().toISOString());
  const expiresAtLabel = formatDateTime(payment.expiresAt);
  const statusLabel = getReadablePixStatus(payment);
  const helpPhoneHref = checkout.supportPhone ? `tel:${onlyDigits(checkout.supportPhone)}` : null;

  return (
    <div className="platform-compact relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#36cabc_0%,#27b5af_100%)] px-4 py-6 text-[#13313c] sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(10,74,92,0.14),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-[1] mx-auto max-w-[920px] overflow-hidden rounded-[34px] border border-white/45 bg-white shadow-[0_34px_120px_rgba(11,39,49,0.24)]">
        <div className="grid gap-5 bg-[linear-gradient(180deg,#eff5f6_0%,#f6fafb_100%)] px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
          <div className="flex gap-4">
            <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e4faf3] text-[#06a56c] shadow-[inset_0_0_0_1px_rgba(6,165,108,0.14)]">
              <ShieldCheck className="h-9 w-9" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[1.9rem] font-semibold tracking-[-0.06em] text-[#142738]">
                  Pix gerado com sucesso
                </h1>
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex rounded-full border border-[#d5e4e8] bg-white px-4 py-2 text-[0.88rem] font-semibold text-[#4e6470] transition hover:border-[#b7cdd4] hover:text-[#18303b]"
                >
                  Voltar ao checkout
                </button>
              </div>

              <p className="mt-2 max-w-2xl text-[1rem] leading-7 text-[#506670]">
                Pague com o QR Code ou usando o codigo copia e cola. Assim que o Pix for compensado, o acesso da compra podera seguir normalmente.
              </p>
            </div>
          </div>

          <div className="rounded-[26px] bg-white px-5 py-5 text-center shadow-[0_20px_45px_rgba(17,40,50,0.08)]">
            <p className="text-[0.96rem] font-semibold text-[#3e5662]">Este codigo expira em:</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="min-w-[86px] rounded-[18px] bg-[#ff5f7a] px-4 py-3 text-white shadow-[0_16px_30px_rgba(255,95,122,0.2)]">
                <p className="text-[2rem] font-extrabold leading-none tracking-[-0.06em]">
                  {countdown.primary}
                </p>
                <p className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/85">
                  {countdown.primaryLabel}
                </p>
              </div>
              <span className="text-[2rem] font-black text-[#233946]">:</span>
              <div className="min-w-[86px] rounded-[18px] bg-[#ff5f7a] px-4 py-3 text-white shadow-[0_16px_30px_rgba(255,95,122,0.2)]">
                <p className="text-[2rem] font-extrabold leading-none tracking-[-0.06em]">
                  {countdown.secondary}
                </p>
                <p className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/85">
                  {countdown.secondaryLabel}
                </p>
              </div>
            </div>
            <p className="mt-4 text-[0.84rem] font-medium text-[#6d808a]">
              {countdown.expired
                ? "Este codigo expirou. Gere um novo Pix para continuar."
                : expiresAtLabel
                  ? `Valido ate ${expiresAtLabel}`
                  : "O horario de expiracao sera definido pelo provedor."}
            </p>
          </div>
        </div>

        {feedback ? (
          <div
            className={cn(
              "border-y px-5 py-4 text-[0.94rem] font-medium sm:px-8",
              feedback.tone === "success"
                ? "border-[#d9efe4] bg-[#f4fdf8] text-[#1b6a49]"
                : "border-[#f1d4d8] bg-[#fff6f6] text-[#91353b]"
            )}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="px-5 py-5 sm:px-8 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="rounded-[24px] border border-[#dce8eb] bg-white p-4 shadow-[0_18px_34px_rgba(18,38,46,0.05)]">
              <div className="rounded-[20px] border border-[#e5edef] bg-[#fbfdfd] p-4">
                {payment.pix?.qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${payment.pix.qrCodeBase64}`}
                    alt="QR Code Pix"
                    className="w-full rounded-[16px]"
                  />
                ) : (
                  <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-[16px] bg-[#f3f7f8] text-center text-[#5e727c]">
                    <QrCode className="h-12 w-12 text-[#19ad8c]" />
                    <p className="max-w-[180px] text-[0.95rem] font-medium leading-6">
                      O QR Code nao foi retornado. Use o codigo copia e cola ao lado.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-[20px] bg-[#f1f7f8] px-4 py-4">
                <p className="text-[0.9rem] font-semibold text-[#32515f]">Status da cobranca</p>
                <div className="mt-3 flex items-center gap-3 text-[1rem] font-semibold text-[#203843]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#19ad8c]" />
                  {statusLabel}
                </div>
                <p className="mt-2 text-[0.88rem] leading-6 text-[#60757f]">
                  O pagamento pode levar alguns instantes para compensar depois da transferencia.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-[24px] border border-[#dce8eb] bg-white shadow-[0_18px_34px_rgba(18,38,46,0.05)]">
                <div className="border-b border-[#e4edef] px-5 py-4">
                  <p className="text-[1rem] font-semibold text-[#1f3b49]">
                    Escaneie o QR Code ou aperte em Copiar Codigo Pix
                  </p>
                  <p className="mt-1 text-[0.94rem] leading-7 text-[#637982]">
                    Abra o app do seu banco e escolha a opcao Pix copia e cola para concluir o pagamento.
                  </p>
                </div>

                <div className="border-b border-[#e4edef] px-5 py-4">
                  <p className="text-[0.92rem] font-semibold text-[#1f3b49]">Codigo Pix</p>
                  <p className="mt-2 break-all rounded-[18px] bg-[#f6fafb] px-4 py-4 text-[0.92rem] leading-7 text-[#526872]">
                    {payment.pix?.qrCode || "Codigo indisponivel no momento."}
                  </p>
                </div>

                <div className="px-5 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void onCopy(payment.pix?.qrCode)}
                      className="inline-flex min-h-[58px] flex-1 items-center justify-center gap-3 rounded-[18px] bg-[#06a56c] px-5 py-4 text-[1rem] font-semibold text-white shadow-[0_20px_40px_rgba(6,165,108,0.22)] transition hover:brightness-105"
                    >
                      <Copy className="h-5 w-5" />
                      Clique aqui para copiar o codigo Pix
                    </button>

                    {payment.ticketUrl ? (
                      <a
                        href={payment.ticketUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[58px] items-center justify-center gap-3 rounded-[18px] border border-[#d6e4e8] bg-white px-5 py-4 text-[0.95rem] font-semibold text-[#26414d] transition hover:bg-[#f7fbfb]"
                      >
                        <ExternalLink className="h-5 w-5" />
                        Abrir comprovante
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] bg-[#eef4f7] px-5 py-5 text-[#24414b] shadow-[inset_0_0_0_1px_rgba(202,218,224,0.9)] sm:px-6 sm:py-6">
                <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#d4e0e4] pb-4">
                  <div>
                    <p className="text-[1rem] font-semibold">Resumo do pedido</p>
                    <p className="mt-1 text-[0.9rem] text-[#5f747d]">Confira os dados desta cobranca Pix.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d1dee2] bg-white px-4 py-2 text-[0.88rem] font-semibold text-[#425962] transition hover:bg-[#f9fbfb]"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </button>
                </div>

                <div className="grid gap-4 pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-[#718690]">
                      Numero do pedido
                    </p>
                    <p className="mt-2 text-[1rem] font-semibold text-[#1f3540]">{payment.externalReference}</p>
                  </div>

                  <div>
                    <p className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-[#718690]">
                      Codigo da transacao
                    </p>
                    <p className="mt-2 break-all rounded-[14px] bg-white px-3 py-2 text-[0.95rem] font-semibold text-[#1f3540]">
                      {payment.providerPaymentId}
                    </p>
                  </div>

                  <div>
                    <p className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-[#718690]">
                      Data do pedido
                    </p>
                    <p className="mt-2 text-[1rem] font-medium text-[#314854]">
                      {generatedAtLabel || "Agora"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-[#718690]">
                      Forma de pagamento
                    </p>
                    <p className="mt-2 text-[1rem] font-medium text-[#314854]">Pix</p>
                  </div>
                </div>

                <div className="mt-5 border-t border-dashed border-[#d4e0e4] pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[1rem] font-semibold text-[#1f3540]">
                        {checkout.offer.title || checkout.productName}
                      </p>
                      <p className="mt-2 max-w-xl text-[0.92rem] leading-7 text-[#5c727c]">
                        {checkout.offer.checkoutDescription || checkout.productDescription}
                      </p>
                    </div>

                    <p className="shrink-0 text-[1.02rem] font-semibold text-[#1f3540]">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-dashed border-[#d4e0e4] pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[1rem] font-medium text-[#57707a]">Total</span>
                    <span className="text-[2rem] font-extrabold tracking-[-0.06em] text-[#163541]">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#dfebee] bg-[#eef4f7] px-5 py-5 sm:px-8 sm:py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-[1.1rem] font-semibold text-[#18333f]">Precisa de ajuda?</p>
              <p className="mt-2 text-[0.94rem] leading-7 text-[#607681]">
                Entre em contato com o produtor caso precise de suporte sobre o pedido ou a entrega do acesso.
              </p>
            </div>

            <div className="grid gap-3 text-[0.96rem] text-[#26414d]">
              <div>
                <p className="font-semibold">Nome</p>
                <p className="mt-1">{checkout.sellerName}</p>
              </div>

              <a
                href={`mailto:${checkout.supportEmail}`}
                className="inline-flex items-center gap-3 font-medium underline-offset-4 hover:underline"
              >
                <Mail className="h-4 w-4" />
                {checkout.supportEmail}
              </a>

              {checkout.supportPhone && helpPhoneHref ? (
                <a
                  href={helpPhoneHref}
                  className="inline-flex items-center gap-3 font-medium underline-offset-4 hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {checkout.supportPhone}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
