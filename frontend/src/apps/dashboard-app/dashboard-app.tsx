"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  CircleDollarSign,
  DollarSign,
  Filter,
  ShieldCheck,
  WalletCards,
  X
} from "lucide-react";

import { SalesPerformancePanel } from "@/components/platform/sales-performance-panel";
import { usePlatformShell } from "@/components/platform/platform-shell-context";
import { platformDataCache } from "@/lib/platform-data-cache";
import { cn } from "@/lib/utils";
import type { PlatformDashboardResponse } from "@/types/platform";

const DASHBOARD_PRIVACY_KEY = "topics-pay-dashboard-hide-sensitive-data";
const MASKED_VALUE = "********";
type PixKeyType = "cpf" | "email" | "telefone" | "aleatoria";

const pixKeyTypeOptions: Array<{ value: PixKeyType; label: string }> = [
  { value: "cpf", label: "CPF" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "aleatoria", label: "Chave aleatoria" }
];

function formatValue(value: number, suffix: "BRL" | "COUNT") {
  if (suffix === "BRL") {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return value.toLocaleString("pt-BR");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function maskPixKey(value: string) {
  if (value.length <= 4) {
    return value;
  }

  return `${value.slice(0, 2)}${"*".repeat(Math.max(4, value.length - 4))}${value.slice(-2)}`;
}

function formatOrderLabel(orderId: string) {
  const normalized = orderId.replace(/[^a-z0-9]/gi, "").toUpperCase();
  let hash = 0;

  for (const char of normalized) {
    hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  }

  const prefix = normalized.slice(0, 4).padEnd(4, "X");
  const suffix = hash.toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").padStart(4, "0").slice(0, 4);

  return `Pedido: ${prefix}${suffix}`;
}

export function DashboardApp() {
  const { notify } = usePlatformShell();
  const [data, setData] = useState<PlatformDashboardResponse | null>(() => platformDataCache.dashboard.get());
  const [loading, setLoading] = useState(() => !platformDataCache.dashboard.hasData());
  const [hideSensitiveData, setHideSensitiveData] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isPixTypeMenuOpen, setIsPixTypeMenuOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>("cpf");
  const [pixKey, setPixKey] = useState("");
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [savedPixKey, setSavedPixKey] = useState<{ type: PixKeyType; key: string } | null>(null);
  const pixTypeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(DASHBOARD_PRIVACY_KEY);

    if (storedValue === "1") {
      setHideSensitiveData(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    void platformDataCache.dashboard
      .load()
      .then((response) => {
        if (mounted) {
          setData(response);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  function handleToggleSensitiveData() {
    setHideSensitiveData((current) => {
      const nextValue = !current;
      window.localStorage.setItem(DASHBOARD_PRIVACY_KEY, nextValue ? "1" : "0");
      return nextValue;
    });
  }

  function displayValue(value: string, masked = MASKED_VALUE) {
    return hideSensitiveData ? masked : value;
  }

  const walletStorageKey = useMemo(
    () => (data ? `topics-pay-wallet:${data.spotlight.customer.toLowerCase().replace(/\s+/g, "-")}` : null),
    [data]
  );

  useEffect(() => {
    if (!walletStorageKey) {
      return;
    }

    const stored = window.localStorage.getItem(walletStorageKey);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        amount?: string;
        pixKey?: string;
        pixKeyType?: PixKeyType;
      };

      if (parsed.pixKey && parsed.pixKeyType) {
        setSavedPixKey({ type: parsed.pixKeyType, key: parsed.pixKey });
        setPixKey(parsed.pixKey);
        setPixKeyType(parsed.pixKeyType);
      }

      if (parsed.amount) {
        setWithdrawAmount(parsed.amount);
      }
    } catch {
      window.localStorage.removeItem(walletStorageKey);
    }
  }, [walletStorageKey]);

  useEffect(() => {
    if (!isPixTypeMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!pixTypeMenuRef.current?.contains(event.target as Node)) {
        setIsPixTypeMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isPixTypeMenuOpen]);

  if (loading || !data) {
    return (
      <div className="platform-surface rounded-[28px] px-4 py-6 text-sm text-white/56">
        Carregando dados do dashboard...
      </div>
    );
  }

  const totalBalance = data.overview.find((item) => item.id === "volume-total")?.value ?? 0;
  const availableBalance = data.overview.find((item) => item.id === "recebido")?.value ?? 0;
  const processingBalance = data.overview.find((item) => item.id === "em-processamento")?.value ?? 0;

  function handleOpenWithdraw() {
    setWalletMessage(null);
    setIsPixTypeMenuOpen(false);
    setIsWithdrawOpen((current) => !current);

    if (!withdrawAmount) {
      setWithdrawAmount(totalBalance.toFixed(2).replace(".", ","));
    }
  }

  function handleCloseWithdrawModal() {
    setIsPixTypeMenuOpen(false);
    setIsWithdrawOpen(false);
  }

  function handleSubmitWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPixKey = pixKey.trim();
    const trimmedAmount = withdrawAmount.trim();

    if (!trimmedPixKey || !trimmedAmount || !walletStorageKey) {
      const message = "Preencha o valor do saque e a chave PIX para continuar.";
      setWalletMessage(message);
      notify({
        tone: "error",
        title: "Falha ao preparar saque",
        description: message
      });
      return;
    }

    window.localStorage.setItem(
      walletStorageKey,
      JSON.stringify({
        amount: trimmedAmount,
        pixKey: trimmedPixKey,
        pixKeyType
      })
    );

    setSavedPixKey({ type: pixKeyType, key: trimmedPixKey });
    setWalletMessage("Chave PIX salva. Sua solicitacao de saque ficou pronta.");
    notify({
      tone: "success",
      title: "Saque preparado",
      description: `Solicitacao configurada com a chave PIX ${pixKeyTypeOptions.find((option) => option.value === pixKeyType)?.label ?? "selecionada"}.`
    });
    setIsWithdrawOpen(false);
    setIsPixTypeMenuOpen(false);
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <SalesPerformancePanel
        performance={data.salesPerformance}
        hideSensitiveData={hideSensitiveData}
        onToggleSensitiveData={handleToggleSensitiveData}
      />

      <section className="grid gap-3 xl:grid-cols-[minmax(0,0.84fr)_minmax(420px,0.96fr)] xl:items-start 2xl:grid-cols-[minmax(0,0.8fr)_minmax(470px,1fr)]">
        <div className="platform-surface rounded-[28px] p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <h3 className="text-[1.08rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.18rem]">
              Ultimas vendas
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5 text-[0.92rem] font-medium tracking-[-0.04em] text-white/58">
                <Filter className="h-4 w-4" />
                Filtros ativos
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5 text-[0.92rem] font-medium tracking-[-0.04em] text-white/58">
                <CircleDollarSign className="h-4 w-4" />
                Operacao conectada
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {data.feed.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-8 text-center text-white/48">
                Nenhuma venda real registrada ainda. As novas transacoes vao aparecer aqui assim que forem persistidas.
              </div>
            ) : null}
            {data.feed.map((item, index) => (
              <article
                key={item.id}
                className={cn(
                  "rounded-[24px] p-[1px] shadow-[0_16px_36px_rgba(0,0,0,0.18)]",
                  index === 1
                    ? "bg-[linear-gradient(135deg,rgba(140,82,255,0.36),rgba(196,166,255,0.16),rgba(255,255,255,0.06))]"
                    : "bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04),rgba(140,82,255,0.06))]"
                )}
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-[23px] px-4 py-4",
                    index === 1
                      ? "bg-[linear-gradient(180deg,rgba(27,31,43,0.98),rgba(19,22,32,0.99))]"
                      : "bg-[linear-gradient(180deg,rgba(21,24,33,0.96),rgba(15,18,26,0.98))]"
                  )}
                >
                  <div className="auth-noise absolute inset-0 opacity-[0.03]" />
                  <div className="relative grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-[18px] text-[15px] font-semibold",
                          index === 1 ? "topics-gradient text-[#09090b]" : "bg-white/[0.06] text-white"
                        )}
                      >
                        {getInitials(item.customer)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[1rem] font-semibold tracking-[-0.04em] text-white">{item.customer}</p>
                          <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[0.8rem] font-medium tracking-[-0.04em] text-white/46">
                            {formatOrderLabel(item.id)}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] text-white/60">{item.product}</p>
                        <p className="mt-1 text-[11px] text-white/34">{item.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-medium",
                          item.status === "Processando"
                            ? "topics-gradient text-[#09090b]"
                            : item.status === "Pago"
                              ? "bg-white/[0.08] text-white/76"
                              : "bg-white/[0.05] text-white/60"
                        )}
                      >
                        {item.status}
                      </span>

                      <div className="rounded-[18px] bg-black/20 px-3.5 py-2 text-right backdrop-blur-[8px]">
                        <p className="text-[0.78rem] font-semibold tracking-[-0.04em] text-white/42">Valor</p>
                        <p className="mt-1 text-[15px] font-semibold text-white">
                          {displayValue(formatValue(item.amount, "BRL"))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="xl:self-start">
          <div className="platform-surface rounded-[28px] p-4 sm:p-5">
            <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.98rem] font-semibold tracking-[-0.04em] text-white/82">Total geral</p>
                  <p className="mt-2 text-[1.26rem] font-semibold tracking-[-0.05em] text-white">
                    {displayValue(formatValue(totalBalance, "BRL"))}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-full topics-gradient text-[#120d1e] shadow-[0_10px_24px_rgba(140,82,255,0.26)]">
                  <DollarSign className="h-4 w-4" strokeWidth={2.1} />
                </div>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_62%,#ffffff_100%)] shadow-[0_0_24px_rgba(196,166,255,0.38)]"
                  style={{
                    width: `${Math.max(18, Math.min(100, totalBalance > 0 ? (availableBalance / totalBalance) * 100 : 0))}%`
                  }}
                />
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-[18px] bg-black/16 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                  <p className="text-[0.92rem] font-semibold tracking-[-0.04em] text-[#8ce99a]">Disponivel</p>
                  <p className="mt-1.5 text-[13px] font-semibold text-white">
                    {displayValue(formatValue(availableBalance, "BRL"))}
                  </p>
                </div>
                <div className="rounded-[18px] bg-black/16 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                  <p className="text-[0.92rem] font-semibold tracking-[-0.04em] text-[#f5cf66]">Pendente</p>
                  <p className="mt-1.5 text-[13px] font-semibold text-white">
                    {displayValue(formatValue(processingBalance, "BRL"))}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] bg-[linear-gradient(180deg,rgba(22,26,36,0.92),rgba(14,17,24,0.98))] px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-white/[0.06] text-[#c4a6ff]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.94rem] font-semibold tracking-[-0.04em] text-white/78">Destino do saque</p>
                  <p className="mt-1 text-[1rem] font-semibold tracking-[-0.04em] text-white">
                    {savedPixKey
                      ? `${pixKeyTypeOptions.find((option) => option.value === savedPixKey.type)?.label}: ${displayValue(maskPixKey(savedPixKey.key), "********")}`
                      : "Nenhuma chave PIX cadastrada"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenWithdraw}
                className="topics-gradient mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.94rem] font-semibold tracking-[-0.04em] text-[#09090b] shadow-[0_12px_28px_rgba(140,82,255,0.18)]"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Realizar saque
              </button>

              {walletMessage ? <p className="mt-3 text-[12px] text-white/52">{walletMessage}</p> : null}
            </div>
          </div>
        </aside>
      </section>

      {isWithdrawOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090f]/72 px-4 py-6 backdrop-blur-[12px]"
          onClick={handleCloseWithdrawModal}
        >
          <div
            className="w-full max-w-[640px] rounded-[30px] bg-[linear-gradient(135deg,rgba(140,82,255,0.18),rgba(196,166,255,0.08),rgba(255,255,255,0.05))] p-[1px] shadow-[0_28px_80px_rgba(0,0,0,0.38)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative rounded-[29px] bg-[linear-gradient(180deg,rgba(18,22,31,0.98),rgba(11,14,21,0.995))] px-5 py-5 sm:px-6 sm:py-6">
              <div className="auth-noise absolute inset-0 rounded-[29px] opacity-[0.03]" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.92rem] font-semibold tracking-[-0.04em] text-white/78">Realizar saque</p>
                  <p className="mt-1 text-[13px] leading-5 text-white/48">
                    Informe o valor e a chave PIX para preparar a solicitacao de saque.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseWithdrawModal}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/68 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmitWithdraw} className="relative mt-5 grid gap-3">
                <div>
                  <label className="text-[0.92rem] font-semibold tracking-[-0.04em] text-white/72">Valor do saque</label>
                  <input
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    placeholder="0,00"
                    className="mt-2 h-11 w-full rounded-[16px] border border-white/10 bg-white/[0.04] px-3.5 text-[13px] text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/70"
                  />
                </div>

                <div>
                  <label className="text-[0.92rem] font-semibold tracking-[-0.04em] text-white/72">Tipo de chave PIX</label>
                  <div ref={pixTypeMenuRef} className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setIsPixTypeMenuOpen((current) => !current)}
                      className="flex h-11 w-full items-center justify-between rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] px-3.5 text-left text-[13px] text-white outline-none transition hover:border-[#8c52ff]/38 hover:bg-white/[0.05]"
                    >
                      <span className="font-medium tracking-[-0.03em] text-white">
                        {pixKeyTypeOptions.find((option) => option.value === pixKeyType)?.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-white/46 transition-transform duration-200",
                          isPixTypeMenuOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {isPixTypeMenuOpen ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 rounded-[18px] bg-[linear-gradient(135deg,rgba(140,82,255,0.16),rgba(196,166,255,0.08),rgba(255,255,255,0.05))] p-[1px] shadow-[0_18px_40px_rgba(0,0,0,0.32)]">
                        <div className="rounded-[17px] bg-[linear-gradient(180deg,rgba(18,22,31,0.985),rgba(12,15,22,0.995))] p-2">
                          {pixKeyTypeOptions.map((option) => {
                            const isSelected = option.value === pixKeyType;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setPixKeyType(option.value);
                                  setIsPixTypeMenuOpen(false);
                                }}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-[13px] font-medium tracking-[-0.03em] transition",
                                  isSelected
                                    ? "bg-[linear-gradient(90deg,rgba(140,82,255,0.22),rgba(196,166,255,0.1))] text-white"
                                    : "text-white/72 hover:bg-white/[0.05] hover:text-white"
                                )}
                              >
                                <span>{option.label}</span>
                                {isSelected ? <Check className="h-4 w-4 text-[#c4a6ff]" /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="text-[0.92rem] font-semibold tracking-[-0.04em] text-white/72">Chave PIX</label>
                  <input
                    value={pixKey}
                    onChange={(event) => setPixKey(event.target.value)}
                    placeholder="Digite a chave PIX do usuario"
                    className="mt-2 h-11 w-full rounded-[16px] border border-white/10 bg-white/[0.04] px-3.5 text-[13px] text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/70"
                  />
                </div>

                {walletMessage ? <p className="text-[12px] text-white/52">{walletMessage}</p> : null}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="topics-gradient inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.94rem] font-semibold tracking-[-0.04em] text-[#09090b]"
                  >
                    Confirmar saque
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseWithdrawModal}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[0.94rem] font-medium tracking-[-0.04em] text-white/62 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
