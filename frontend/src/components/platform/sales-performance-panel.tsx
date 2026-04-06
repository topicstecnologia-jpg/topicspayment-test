"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Clock3, Eye, EyeOff, ShoppingBag, WalletCards } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PlatformDashboardSalesPerformance, PlatformDashboardTrendPoint } from "@/types/platform";

const chartRanges = [
  { id: "7d", label: "7 dias" },
  { id: "15d", label: "15 dias" },
  { id: "30d", label: "30 dias" }
] as const;

const MASKED_VALUE = "********";
const glassShellClass =
  "bg-[linear-gradient(135deg,rgba(140,82,255,0.18),rgba(196,166,255,0.08),rgba(255,255,255,0.035))] p-[1px] shadow-[0_16px_34px_rgba(0,0,0,0.18)]";
const glassInnerClass =
  "bg-[linear-gradient(180deg,rgba(23,26,34,0.72),rgba(11,13,19,0.92))] backdrop-blur-[22px]";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function buildSmoothLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;

    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function getChartGeometry(points: PlatformDashboardTrendPoint[]) {
  const width = 1000;
  const height = 292;
  const paddingLeft = 74;
  const paddingRight = 26;
  const paddingTop = 20;
  const paddingBottom = 32;
  const usableWidth = width - paddingLeft - paddingRight;
  const usableHeight = height - paddingTop - paddingBottom;

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const baseline = Math.max(0, min - (max - min) * 0.2);
  const ceiling = max + (max - baseline) * 0.18;

  const chartPoints = points.map((point, index) => {
    const x = paddingLeft + (usableWidth / Math.max(points.length - 1, 1)) * index;
    const y = paddingTop + usableHeight - ((point.value - baseline) / Math.max(ceiling - baseline, 1)) * usableHeight;

    return {
      ...point,
      x,
      y
    };
  });

  const linePath = buildSmoothLinePath(chartPoints);
  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1]?.x ?? width - paddingRight} ${height - paddingBottom} L ${chartPoints[0]?.x ?? paddingLeft} ${height - paddingBottom} Z`;
  const gridValues = Array.from({ length: 4 }, (_, index) => baseline + ((ceiling - baseline) / 3) * index).reverse();

  return {
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    chartPoints,
    linePath,
    areaPath,
    gridValues
  };
}

export function SalesPerformancePanel({
  performance,
  hideSensitiveData,
  onToggleSensitiveData
}: {
  performance: PlatformDashboardSalesPerformance;
  hideSensitiveData: boolean;
  onToggleSensitiveData: () => void;
}) {
  const [activeRange, setActiveRange] = useState<keyof PlatformDashboardSalesPerformance["periods"]>("7d");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = performance.periods[activeRange];
  const geometry = useMemo(() => getChartGeometry(chartData), [chartData]);
  const activeIndex = hoveredIndex ?? geometry.chartPoints.length - 1;
  const activePoint = geometry.chartPoints[activeIndex];

  function displayValue(value: string, masked = MASKED_VALUE) {
    return hideSensitiveData ? masked : value;
  }

  return (
    <section className="platform-surface overflow-hidden rounded-[28px] p-3.5 sm:p-4 xl:p-5">
      <div className="flex flex-col gap-3.5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-[1.4rem] font-semibold tracking-[-0.06em] text-white sm:text-[1.6rem]">
            {performance.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="text-[1.72rem] font-semibold tracking-[-0.08em] text-white sm:text-[2.05rem]">
              {displayValue(formatCurrency(performance.todayRevenue))}
            </div>
            <div className="pb-1 text-[12px] font-medium text-[#8ce99a]">
              {hideSensitiveData
                ? MASKED_VALUE
                : `${performance.todayDeltaAmount >= 0 ? "+" : "-"}${formatCurrency(Math.abs(performance.todayDeltaAmount))} (${performance.todayDeltaPercent.toFixed(2)}%)`}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleSensitiveData}
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.25 text-[12px] font-medium text-white/62 transition hover:bg-white/[0.06] hover:text-white"
          >
            {hideSensitiveData ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {hideSensitiveData ? "Mostrar dados" : "Ocultar dados"}
          </button>

          {chartRanges.map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => {
                setActiveRange(range.id);
                setHoveredIndex(null);
              }}
              className={cn(
                "rounded-full border px-3 py-1.25 text-[12px] font-medium transition",
                activeRange === range.id
                  ? "topics-gradient border-transparent text-[#09090b] shadow-[0_12px_28px_rgba(140,82,255,0.2)]"
                  : "border-white/8 bg-white/[0.03] text-white/54 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3.5 xl:items-start xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className={cn("rounded-[24px]", glassShellClass)}>
          <div className="relative rounded-[23px] bg-[radial-gradient(circle_at_50%_18%,rgba(140,82,255,0.16),transparent_34%),radial-gradient(circle_at_65%_20%,rgba(196,166,255,0.1),transparent_26%),linear-gradient(180deg,rgba(14,17,25,0.72),rgba(10,13,19,0.9))] p-3 backdrop-blur-[24px] sm:p-3.5">
            <div className="auth-noise absolute inset-0 rounded-[23px] opacity-[0.03]" />
            <div className="relative h-[264px]">
              <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} className="h-full w-full">
                <defs>
                  <linearGradient id="sales-line-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8c52ff" />
                    <stop offset="58%" stopColor="#c4a6ff" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                  <linearGradient id="sales-area-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(196,166,255,0.42)" />
                    <stop offset="52%" stopColor="rgba(140,82,255,0.16)" />
                    <stop offset="100%" stopColor="rgba(140,82,255,0.02)" />
                  </linearGradient>
                  <filter id="sales-soft-shadow" x="-20%" y="-20%" width="140%" height="160%">
                    <feGaussianBlur stdDeviation="12" />
                  </filter>
                </defs>

                {geometry.gridValues.map((gridValue, index) => {
                  const y =
                    geometry.paddingTop +
                    ((geometry.height - geometry.paddingTop - geometry.paddingBottom) / Math.max(geometry.gridValues.length - 1, 1)) * index;

                  return (
                    <g key={`${gridValue}-${index}`}>
                      <line
                        x1={geometry.paddingLeft}
                        x2={geometry.width - geometry.paddingRight}
                        y1={y}
                        y2={y}
                        stroke="rgba(255,255,255,0.06)"
                        strokeDasharray="5 8"
                      />
                      <text x={8} y={y + 4} fill="rgba(255,255,255,0.28)" fontSize="11">
                        {displayValue(formatCurrency(gridValue), "*****")}
                      </text>
                    </g>
                  );
                })}

                <path d={geometry.areaPath} fill="url(#sales-area-fill)" />
                <path d={geometry.linePath} fill="none" stroke="rgba(196,166,255,0.28)" strokeWidth="14" filter="url(#sales-soft-shadow)" />
                <path d={geometry.linePath} fill="none" stroke="url(#sales-line-glow)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

                {geometry.chartPoints.map((point, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <g key={`${point.label}-${index}`}>
                      <line
                        x1={point.x}
                        x2={point.x}
                        y1={point.y}
                        y2={geometry.height - geometry.paddingBottom}
                        stroke={isActive ? "rgba(255,255,255,0.28)" : "transparent"}
                        strokeDasharray="4 6"
                      />
                      <circle cx={point.x} cy={point.y} r={isActive ? 12 : 0} fill="rgba(196,166,255,0.2)" />
                      <circle cx={point.x} cy={point.y} r={isActive ? 5.5 : 0} fill="#ffffff" />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="18"
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    </g>
                  );
                })}

                {activePoint ? (
                  <g transform={`translate(${Math.max(geometry.paddingLeft, Math.min(activePoint.x - 82, geometry.width - 182))} ${Math.max(14, activePoint.y - 74)})`}>
                    <rect width="164" height="58" rx="18" fill="rgba(18,22,31,0.92)" stroke="rgba(255,255,255,0.08)" />
                    <text x="16" y="22" fill="rgba(255,255,255,0.48)" fontSize="10" letterSpacing="1.8">
                      {activePoint.label}
                    </text>
                    <text x="16" y="40" fill="#ffffff" fontSize="16" fontWeight="600">
                      {displayValue(formatCurrency(activePoint.value))}
                    </text>
                  </g>
                ) : null}

                {geometry.chartPoints.map((point) => (
                  <text
                    key={`axis-${point.label}`}
                    x={point.x}
                    y={geometry.height - 8}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.28)"
                    fontSize="11"
                  >
                    {point.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className={cn("rounded-[22px]", glassShellClass)}>
            <div className={cn("rounded-[21px] p-3", glassInnerClass)}>
              <div className="flex items-center gap-2.5">
                <div className="topics-gradient flex h-9 w-9 items-center justify-center rounded-[16px] text-[#120f1d]">
                  <WalletCards className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[0.88rem] font-semibold tracking-[-0.04em] text-white/78">Receita hoje</p>
                  <p className="mt-0.5 text-[1.08rem] font-semibold tracking-[-0.05em] text-white">
                    {displayValue(formatCurrency(performance.todayRevenue))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={cn("rounded-[22px]", glassShellClass)}>
            <div className={cn("rounded-[21px] p-3", glassInnerClass)}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[16px] bg-white/[0.06] text-[#c4a6ff]">
                  <ShoppingBag className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[0.88rem] font-semibold tracking-[-0.04em] text-white/78">Vendas do dia</p>
                  <p className="mt-0.5 text-[1.08rem] font-semibold tracking-[-0.05em] text-white">
                    {displayValue(performance.ordersToday.toLocaleString("pt-BR"))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={cn("rounded-[22px]", glassShellClass)}>
            <div className={cn("rounded-[21px] p-3", glassInnerClass)}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[16px] bg-white/[0.06] text-[#c4a6ff]">
                  <Clock3 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[0.88rem] font-semibold tracking-[-0.04em] text-white/78">Ticket medio</p>
                  <p className="mt-0.5 text-[1.08rem] font-semibold tracking-[-0.05em] text-white">
                    {displayValue(formatCurrency(performance.averageTicket))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] bg-[linear-gradient(180deg,#8c52ff_0%,#c4a6ff_38%,#c4a6ff_68%,#ffffff_100%)] p-3 text-[#171322] shadow-[0_14px_28px_rgba(11,13,19,0.16)]">
            <p className="text-[0.88rem] font-semibold tracking-[-0.04em] text-[#2f2450]/82">Tendencia atual</p>
            <p className="mt-2 text-[1rem] font-semibold tracking-[-0.04em] text-[#171322]">
              {performance.todayDeltaAmount >= 0 ? "Alta no fechamento" : "Ajuste na curva"}
            </p>
            <p className="mt-1.5 text-[12px] leading-5 text-[#2b2343]/78">
              {performance.todayDeltaAmount >= 0
                ? "Hoje fechou acima do periodo anterior, com leitura positiva na linha de vendas."
                : "A linha esfriou em relacao ao periodo anterior, sinalizando oportunidade de reativacao."}
            </p>
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-[#191525]/12 px-2.5 py-1.25 text-[0.86rem] font-medium tracking-[-0.04em] text-[#171322]/76">
              Explorar detalhes
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
