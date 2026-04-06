import type { ReactNode } from "react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  cardTitle: string;
  cardSubtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({
  cardTitle,
  cardSubtitle,
  children,
  footer
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.015),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.012),transparent_22%)]" />

      <div className="relative w-full max-w-[372px]">
        <div className="absolute -left-3 -top-3 h-20 w-20 rounded-full bg-white/50 blur-[18px]" />
        <div className="absolute left-3 top-0 h-24 w-28 rounded-full bg-[#ff7e99]/38 blur-[28px]" />
        <div className="absolute right-4 top-5 h-12 w-24 rounded-full bg-white/[0.05] blur-[20px]" />

        <section className="glass-panel relative min-h-[474px] overflow-hidden rounded-[31px] border border-white/15 px-4 py-6 shadow-[0_24px_90px_rgba(0,0,0,0.56)] sm:px-5 sm:py-7">
          <div className="auth-noise absolute inset-0 rounded-[31px]" />
          <div className="absolute inset-[1px] rounded-[30px] border border-white/[0.04]" />
          <div className="absolute inset-[2px] rounded-[29px] bg-[linear-gradient(180deg,rgba(255,255,255,0.015),transparent_18%,transparent_75%,rgba(255,255,255,0.008))]" />
          <div className="absolute inset-x-0 top-0 h-px bg-white/12" />
          <div className="absolute -left-3 -top-4 h-16 w-16 rounded-full bg-white/45 blur-[16px]" />
          <div className="absolute left-7 top-3 h-20 w-24 rounded-full bg-[#ff839d]/18 blur-[24px]" />
          <div className="absolute inset-x-14 top-6 h-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_22%,transparent_68%)] opacity-60 blur-[18px]" />
          <div className="absolute left-10 top-20 h-16 w-52 rounded-full bg-black/30 blur-[38px]" />
          <div className="absolute bottom-8 left-10 right-10 h-20 rounded-full bg-black/20 blur-[36px]" />

          <div className="relative">
            <div className="mb-8 pt-5 text-center">
              <h1 className="text-[2.4rem] font-semibold tracking-[-0.055em] text-white [text-shadow:0_2px_18px_rgba(255,255,255,0.09)]">
                {cardTitle}
              </h1>
              <p className="mt-2 text-[11px] text-white/28">{cardSubtitle}</p>
            </div>

            {children}

            <div className="mt-6 pt-0.5">{footer}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
