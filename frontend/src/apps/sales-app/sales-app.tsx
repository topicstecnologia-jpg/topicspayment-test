"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Filter, ReceiptText, TrendingUp, Wallet, Waves } from "lucide-react";

import { platformDataCache } from "@/lib/platform-data-cache";
import { cn } from "@/lib/utils";
import type { PlatformSalesResponse } from "@/types/platform";

function formatValue(value: number, suffix: "BRL" | "COUNT") {
  if (suffix === "BRL") {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  return value.toLocaleString("pt-BR");
}

const tabs = ["Todas", "Pago", "Processando", "Pendente"] as const;

export function SalesApp() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Todas");
  const [data, setData] = useState<PlatformSalesResponse | null>(() => platformDataCache.sales.get());
  const [loading, setLoading] = useState(() => !platformDataCache.sales.hasData());

  useEffect(() => {
    let mounted = true;

    void platformDataCache.sales
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

  const visibleItems = useMemo(() => {
    if (!data) {
      return [];
    }

    return activeTab === "Todas"
      ? data.items
      : data.items.filter((item) => item.status === activeTab);
  }, [activeTab, data]);

  if (loading || !data) {
    return (
      <div className="platform-surface rounded-[28px] px-4 py-6 text-sm text-white/56">
        Carregando dados de vendas...
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <section className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="platform-surface rounded-[28px] p-4 sm:p-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/32">Fluxo comercial</p>
                <h2 className="mt-2.5 text-[1.45rem] font-semibold tracking-[-0.06em] text-white sm:text-[1.7rem]">
                  Vendas lidas em um unico painel
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition",
                      activeTab === tab
                        ? "topics-gradient border-transparent text-[#09090b] shadow-[0_12px_28px_rgba(140,82,255,0.2)]"
                        : "border-white/8 bg-white/[0.03] text-white/54 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="platform-wave-panel rounded-[24px] p-4 sm:p-5">
              <div className="relative z-[1] grid gap-6">
                <div className="grid gap-4 xl:grid-cols-3">
                  {visibleItems.length === 0 ? (
                    <div className="xl:col-span-3 rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/48">
                      Nenhuma venda real encontrada para este filtro.
                    </div>
                  ) : null}
                  {visibleItems.slice(0, 3).map((item, index) => (
                    <div key={item.id}>
                      <p className="text-xs text-white/34">{String(index + 1).padStart(2, "0")}</p>
                      <h3 className="mt-2 text-[15px] font-semibold text-white">{item.customer}</h3>
                      <p className="mt-1.5 text-[13px] text-white/52">{item.product}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {data.metrics.map((item, index) => (
                    <article
                      key={item.id}
                      className={cn(
                        "rounded-[20px] border px-3.5 py-3.5 shadow-[0_14px_28px_rgba(0,0,0,0.12)]",
                        index === 0
                          ? "bg-[#171b27] text-white border-[#171b27]"
                          : "border-white/8 bg-white/[0.04] text-white"
                      )}
                    >
                      <p
                        className={cn(
                          "text-[11px] uppercase tracking-[0.22em]",
                          index === 0 ? "text-white/54" : "text-white/34"
                        )}
                      >
                        {item.label}
                      </p>
                      <p className="mt-3 text-[1.18rem] font-semibold tracking-[-0.05em] sm:text-[1.28rem]">
                        {formatValue(item.value, item.suffix)}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="platform-ink-panel rounded-[28px] p-4 sm:p-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-white/46">Receita atual</p>
            <p className="mt-3 text-[1.9rem] font-semibold tracking-[-0.08em]">
              {formatValue(data.metrics[0]?.value ?? 0, "BRL")}
            </p>
            <p className="mt-2.5 text-[13px] leading-6 text-white/62">
              Leitura financeira conectada ao backend e protegida pela mesma sessao.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3.5 py-1.5 text-[11px] font-medium text-white/78">
              <Waves className="h-4 w-4" />
              Recebimentos online
            </div>
          </div>

          <div className="platform-surface-soft rounded-[24px] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-white/[0.06] text-[#c4a6ff]">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] text-white/42">Status de payout</p>
                <p className="mt-1 text-[15px] font-semibold text-white">{data.detail.payoutStatus}</p>
              </div>
            </div>
          </div>

          <div className="platform-surface-soft rounded-[24px] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-white/[0.07] text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] text-white/42">Conta operacional</p>
                <p className="mt-1 text-[15px] font-semibold text-white">{data.detail.company}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="platform-surface rounded-[28px] p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/32">Pedidos recentes</p>
              <h3 className="mt-2.5 text-[1.28rem] font-semibold tracking-[-0.05em] text-white sm:text-[1.38rem]">
                Timeline comercial conectada
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-white/56">
                <Filter className="h-4 w-4" />
                Filtros ativos
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-white/56">
                <CircleDollarSign className="h-4 w-4" />
                Recebimentos conectados
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {visibleItems.length === 0 ? (
              <article className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-white/48">
                Nenhum pedido real registrado ainda.
              </article>
            ) : null}
            {visibleItems.map((item, index) => (
              <article
                key={item.id}
                className={cn(
                  "rounded-[22px] border px-3.5 py-3.5 shadow-[0_12px_26px_rgba(0,0,0,0.12)]",
                  index === 2
                    ? "bg-[#171b27] border-[#171b27] text-white"
                    : "bg-white/[0.04] border-white/8 text-white"
                )}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{item.customer}</p>
                    <p className={cn("mt-1 text-[13px]", index === 2 ? "text-white/62" : "text-white/56")}>
                      {item.product}
                    </p>
                    <p className={cn("mt-1 text-xs", index === 2 ? "text-white/40" : "text-white/34")}>
                      {item.id} - {item.date}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        index === 2 ? "topics-gradient text-[#09090b]" : "bg-white/[0.06] text-white/68"
                      )}
                    >
                      {item.status}
                    </span>
                    <span className="text-[15px] font-semibold">{formatValue(item.amount, "BRL")}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="platform-surface rounded-[28px] p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/32">Detalhe central</p>
            <h3 className="mt-2.5 text-[1.4rem] font-semibold tracking-[-0.06em] text-white">
              {data.detail.invoiceCode}
            </h3>
            <p className="mt-2 text-[13px] leading-5 text-white/52">
              Cliente conectado: <span className="font-medium text-white">{data.detail.customer}</span>
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/34">Principal</p>
                <p className="mt-2.5 text-[1.18rem] font-semibold tracking-[-0.05em] text-white">
                  {formatValue(data.detail.principalAmount, "BRL")}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/34">Saldo pendente</p>
                <p className="mt-3 text-[1.35rem] font-semibold tracking-[-0.05em] text-white">
                  {formatValue(data.detail.balanceDue, "BRL")}
                </p>
              </div>
            </div>
          </div>

          <div className="platform-surface-soft rounded-[24px] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-white/[0.06] text-[#c4a6ff]">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] text-white/42">Leitura operacional</p>
                <p className="mt-1 text-[15px] font-semibold text-white">
                  Fluxo financeiro sob a mesma protecao
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
