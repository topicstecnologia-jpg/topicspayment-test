"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type MouseEvent } from "react";
import {
  BarChart3,
  Bell,
  Box,
  LayoutDashboard
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { platformDataCache, prefetchPlatformData } from "@/lib/platform-data-cache";
import { cn } from "@/lib/utils";

import { PlatformBottomBlur } from "./platform-bottom-blur";
import { PlatformEnergyLines } from "./platform-energy-lines";
import { usePlatformShell } from "./platform-shell-context";
import { ProfileMenu } from "./profile-menu";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortLabel: "Geral" },
  { href: "/meus-produtos", label: "Meus Produtos", icon: Box, shortLabel: "Produtos" },
  { href: "/minhas-vendas", label: "Minhas Vendas", icon: BarChart3, shortLabel: "Vendas" }
] as const;

const routeMeta = {
  "/dashboard": {
    title: "Dashboard TOPICS Pay",
    subtitle: "Visao consolidada das apps conectadas com leitura simples, elegante e orientada a operacao.",
    eyebrow: "TOPICS Pay",
    status: "Painel central ativo",
    sideTitle: "Stack conectada",
    sideValue: "3 apps",
    sideNote: "Dashboard, produtos e vendas usando a mesma autenticacao protegida."
  },
  "/meus-produtos": {
    title: "Meus Produtos",
    subtitle: "Catalogo modular com leitura clara para acompanhar oferta, status e evolucao comercial.",
    eyebrow: "TOPICS Pay / Catalogo",
    status: "Catalogo sincronizado",
    sideTitle: "Produtos vivos",
    sideValue: "App modular",
    sideNote: "Estrutura separada para crescer com seguranca sem quebrar a plataforma."
  },
  "/minhas-vendas": {
    title: "Minhas Vendas",
    subtitle: "Recebimentos, pedidos e payout reunidos em uma experiencia tecnica e facil de entender.",
    eyebrow: "TOPICS Pay / Financeiro",
    status: "Recebimentos online",
    sideTitle: "Fluxo financeiro",
    sideValue: "API segura",
    sideNote: "Leitura conectada ao backend da plataforma e aos produtos ativos."
  }
} as const;

const revenueLevels = [
  { level: 1, min: 0, next: 10_000 },
  { level: 2, min: 10_000, next: 100_000 },
  { level: 3, min: 100_000, next: 500_000 },
  { level: 4, min: 500_000, next: 1_000_000 },
  { level: 5, min: 1_000_000, next: null }
] as const;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getTotalRevenueValue(data: { overview: Array<{ id: string; value: number }> } | null) {
  return data?.overview.find((item) => item.id === "volume-total")?.value ?? null;
}

function getRevenueLevel(totalRevenue: number) {
  let activeLevel: (typeof revenueLevels)[number] = revenueLevels[0];

  for (const item of revenueLevels) {
    if (totalRevenue >= item.min) {
      activeLevel = item;
    }
  }

  const nextLevel = activeLevel.next
    ? revenueLevels.find((item) => item.level === activeLevel.level + 1) ?? null
    : null;
  const remaining = activeLevel.next ? Math.max(activeLevel.next - totalRevenue, 0) : 0;
  const progress = activeLevel.next
    ? ((totalRevenue - activeLevel.min) / Math.max(activeLevel.next - activeLevel.min, 1)) * 100
    : 100;

  return {
    currentLevel: activeLevel.level,
    nextLevel: nextLevel?.level ?? null,
    nextGoal: activeLevel.next,
    remaining,
    progress: Math.max(8, Math.min(100, progress))
  };
}

export function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isBootstrapping } = useAuth();
  const { isHeroVisible } = usePlatformShell();
  const currentRoute =
    navItems.find((item) => pathname.startsWith(item.href))?.href ?? "/dashboard";
  const [optimisticRoute, setOptimisticRoute] = useState(currentRoute);
  const [isNavigating, startNavigation] = useTransition();
  const [totalRevenue, setTotalRevenue] = useState<number | null>(() =>
    getTotalRevenueValue(platformDataCache.dashboard.get())
  );

  useEffect(() => {
    if (!isBootstrapping && !user) {
      router.replace("/login");
    }
  }, [isBootstrapping, router, user]);

  useEffect(() => {
    setOptimisticRoute(currentRoute);
  }, [currentRoute]);

  useEffect(() => {
    if (!user) {
      setTotalRevenue(null);
      return;
    }

    let active = true;

    navItems.forEach((item) => {
      router.prefetch(item.href);
    });

    void prefetchPlatformData();

    void platformDataCache.dashboard
      .load()
      .then((response) => {
        if (!active) {
          return;
        }

        const revenue = getTotalRevenueValue(response) ?? 0;
        setTotalRevenue(revenue);
      })
      .catch(() => {
        if (active) {
          setTotalRevenue(0);
        }
      });

    return () => {
      active = false;
    };
  }, [router, user?.id]);

  const currentMeta = routeMeta[currentRoute];
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(new Date()),
    []
  );
  const revenueLevel = useMemo(() => getRevenueLevel(totalRevenue ?? 0), [totalRevenue]);
  const activeRoute = isNavigating ? optimisticRoute : currentRoute;

  function handleNavigation(event: MouseEvent<HTMLAnchorElement>, href: (typeof navItems)[number]["href"]) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (href === currentRoute) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setOptimisticRoute(href);
    startNavigation(() => {
      router.push(href, { scroll: false });
    });
  }

  if (isBootstrapping) {
    return (
      <div className="platform-shell flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-[320px] flex-col items-center gap-2.5">
          <img
            src="https://res.cloudinary.com/dmwf5xxxg/image/upload/q_auto/f_auto/v1775186081/TOPICS_Pay_imxu18.png"
            alt="TOPICS Pay"
            className="h-auto w-[188px]"
          />
          <div className="platform-loading-bar" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <main className="platform-shell platform-compact min-h-screen px-2 py-2 text-white sm:px-2.5 lg:px-3">
      <PlatformEnergyLines />
      <div className="mx-auto max-w-[1490px] xl:grid xl:grid-cols-[64px_minmax(0,1fr)] xl:gap-3">
        <aside className="hidden xl:block">
          <div className="sticky top-2 flex min-h-[calc(100vh-1rem)] items-center justify-center py-2">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeRoute === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    scroll={false}
                    onClick={(event) => handleNavigation(event, item.href)}
                    onMouseEnter={() => router.prefetch(item.href)}
                    onFocus={() => router.prefetch(item.href)}
                    className="group flex flex-col items-center gap-1"
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-[18px] border transition-[transform,background-color,color,box-shadow] duration-200 will-change-transform",
                        isActive
                          ? "topics-gradient border-transparent text-[#09090b] shadow-[0_16px_30px_rgba(140,82,255,0.24)]"
                          : "border-white/10 bg-white/[0.03] text-white/58 group-hover:-translate-y-0.5 group-hover:bg-white/[0.08] group-hover:text-white"
                      )}
                    >
                      <Icon className="h-[14px] w-[14px]" />
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium tracking-[0.01em] transition-colors duration-200",
                        isActive ? "text-white" : "text-white/42 group-hover:text-white/72"
                      )}
                    >
                      {item.shortLabel}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="space-y-2.5 lg:space-y-3">
          <section className="px-0.5 py-1.5 sm:px-1 lg:px-2">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 flex-col gap-2.5">
                  <div className="flex min-w-0 flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-4">
                    <img
                      src="https://res.cloudinary.com/dmwf5xxxg/image/upload/q_auto/f_auto/v1775186081/TOPICS_Pay_imxu18.png"
                      alt="TOPICS Pay"
                      className="h-auto w-[170px] flex-none xl:w-[186px]"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-[0.92rem] font-semibold tracking-[-0.03em] text-white sm:text-[1rem]">
                        Olá, {user.name}! Hoje é {todayLabel}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-[228px] flex-1 px-0.5 sm:max-w-[320px]">
                    <p className="text-[0.7rem] font-medium tracking-[-0.02em] text-[#b7bec6]">
                      {revenueLevel.nextLevel && revenueLevel.nextGoal
                        ? `Faltam ${totalRevenue === null ? "..." : formatCurrency(totalRevenue)} / ${formatCurrency(revenueLevel.nextGoal)} para o nivel ${revenueLevel.nextLevel}!`
                        : "Nivel maximo atingido"}
                    </p>

                    <div className="relative mt-1.5 h-1.25 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_62%,#ffffff_100%)] shadow-[0_0_18px_rgba(196,166,255,0.2)]"
                        style={{ width: `${revenueLevel.progress}%` }}
                      />
                    </div>
                  </div>

                  <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-white/58 transition hover:bg-white/[0.08] hover:text-white">
                    <Bell className="h-4 w-4" />
                  </button>
                  <ProfileMenu />
                </div>
              </div>
            </div>
          </section>

          {isHeroVisible ? (
            <section className="platform-surface overflow-hidden rounded-[28px] p-0">
              <div className="relative min-h-[156px] sm:min-h-[188px] lg:min-h-[230px] xl:min-h-[270px]">
                <img
                  src="https://res.cloudinary.com/dmwf5xxxg/image/upload/q_auto/f_auto/v1775259683/Pay_2_qcxjj7.png"
                  alt={currentMeta.title}
                  className="absolute inset-0 h-full w-full object-cover object-[40%_center] md:object-[43%_center] xl:object-[46%_center]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,8,12,0.32)_0%,rgba(6,8,12,0.12)_20%,rgba(6,8,12,0.06)_42%,rgba(6,8,12,0.12)_100%)]" />
              </div>
            </section>
          ) : null}

          <section>{children}</section>
        </div>
      </div>
      </main>
      <PlatformBottomBlur />
    </>
  );
}
