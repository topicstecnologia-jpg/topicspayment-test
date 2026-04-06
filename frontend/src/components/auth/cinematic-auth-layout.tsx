import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface CinematicAuthLayoutProps {
  title: string;
  prompt: string;
  actionLabel: string;
  actionHref: string;
  children?: ReactNode;
  footer?: ReactNode;
  showBackButton?: boolean;
  panelContent?: ReactNode;
  collapseAside?: boolean;
  panelVariant?: "card" | "plain";
}

function AuthVisualPanel({
  children,
  variant = "card"
}: {
  children?: ReactNode;
  variant?: "card" | "plain";
}) {
  if (children) {
    if (variant === "plain") {
      return (
        <section className="w-full max-w-[468px]">
          <div className="relative flex min-h-[520px] items-center justify-start">{children}</div>
        </section>
      );
    }

    return (
      <section className="relative mx-auto w-full max-w-[366px] lg:max-w-[428px]">
        <div className="absolute inset-x-10 bottom-0 h-28 rounded-full bg-[#cc6f2b]/10 blur-[60px]" />

        <div className="relative min-h-[560px] overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(20,20,24,0.96),rgba(12,12,15,0.98))] px-6 py-6 shadow-[0_30px_90px_rgba(0,0,0,0.58)] sm:px-8 sm:py-8">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_20%,rgba(0,0,0,0.16)_100%)]" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(rgba(255,255,255,0.8)_0.45px,transparent_0.7px)] [background-size:6px_6px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(140,82,255,0.12),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(255,255,255,0.05),transparent_18%),radial-gradient(circle_at_50%_100%,rgba(204,111,43,0.08),transparent_22%)]" />

          <div className="relative flex min-h-[496px] items-center justify-start">{children}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mx-auto w-full max-w-[366px] lg:max-w-[428px]">
      <div className="absolute inset-x-10 bottom-0 h-28 rounded-full bg-[#cc6f2b]/18 blur-[60px]" />

      <div className="relative h-[560px] overflow-hidden rounded-[30px] border border-white/8 bg-[#141416] shadow-[0_30px_90px_rgba(0,0,0,0.58)]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_22%,rgba(0,0,0,0.1)_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(rgba(255,255,255,0.8)_0.45px,transparent_0.7px)] [background-size:6px_6px]" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/dmwf5xxxg/image/upload/q_auto/f_auto/v1775187612/Retrato_estilizado_com_%C3%B3culos_modernos_qici4s.png')"
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,10,0.1)_0%,rgba(9,10,12,0.06)_26%,rgba(8,7,7,0.18)_44%,rgba(18,11,7,0.24)_64%,rgba(15,10,8,0.44)_80%,rgba(10,8,7,0.74)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_18%,rgba(255,233,212,0.18),transparent_14%),radial-gradient(circle_at_62%_74%,rgba(208,129,72,0.12),transparent_18%)]" />

        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.08)_16%,rgba(0,0,0,0.28)_48%,rgba(0,0,0,0.44)_100%)]" />

        <p className="absolute bottom-4 left-7 text-[10px] text-white/48">
          Ambiente visual conceitual da autenticacao TOPICS Pay
        </p>
      </div>
    </section>
  );
}

export function CinematicAuthLayout({
  title,
  prompt,
  actionLabel,
  actionHref,
  children,
  footer,
  showBackButton = true,
  panelContent,
  collapseAside = false,
  panelVariant = "card"
}: CinematicAuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070708] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_78%,rgba(223,120,52,0.2),transparent_18%),radial-gradient(circle_at_44%_50%,rgba(248,175,92,0.1),transparent_16%),radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.035),transparent_26%),linear-gradient(180deg,#090909_0%,#070708_55%,#060606_100%)]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(rgba(255,255,255,0.8)_0.45px,transparent_0.7px)] [background-size:6px_6px]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-8 sm:px-8 lg:px-12">
        <div
          className={`grid w-full items-center gap-8 ${
            collapseAside ? "lg:grid-cols-[1fr]" : "lg:grid-cols-[0.94fr_0.96fr] lg:gap-12"
          }`}
        >
          <AuthVisualPanel variant={panelVariant}>{panelContent}</AuthVisualPanel>

          {collapseAside ? null : (
            <section className="mx-auto w-full max-w-[396px] lg:max-w-[430px]">
              <div className="space-y-7">
                <div className="space-y-4">
                  <img
                    src="https://res.cloudinary.com/dmwf5xxxg/image/upload/q_auto/f_auto/v1775186081/TOPICS_Pay_imxu18.png"
                    alt="TOPICS Pay"
                    className="h-auto w-[170px] drop-shadow-[0_12px_34px_rgba(0,0,0,0.38)]"
                  />

                  <h1 className="max-w-[410px] text-[2rem] font-semibold leading-[0.95] tracking-[-0.06em] text-white sm:text-[2.9rem]">
                    {title}
                  </h1>

                  <div className="flex items-center gap-4 text-[13px] text-white/38">
                    {showBackButton ? (
                      <Link
                        href="/login"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/65 transition hover:border-white/20 hover:text-white"
                        aria-label="Voltar ao login"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}

                    <div className="flex items-center gap-2.5">
                      <span>{prompt}</span>
                      <Link
                        href={actionHref}
                        className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/80 transition hover:border-white/20 hover:bg-white/[0.06]"
                      >
                        {actionLabel}
                      </Link>
                    </div>
                  </div>
                </div>

                {panelContent ? null : children}

                {footer ? (
                  <div className="max-w-[350px] text-[10px] leading-5 text-white/22">{footer}</div>
                ) : null}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
