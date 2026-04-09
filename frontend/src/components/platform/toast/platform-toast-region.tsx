"use client";

import type { CSSProperties } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { type PlatformToast, usePlatformShell } from "../platform-shell-context";

const toastToneMap: Record<
  PlatformToast["tone"],
  {
    icon: typeof CheckCircle2;
    iconClassName: string;
    badgeClassName: string;
    borderClassName: string;
    barClassName: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClassName: "text-[#74f0b2]",
    badgeClassName: "bg-[rgba(57,185,128,0.12)]",
    borderClassName: "border-[rgba(57,185,128,0.18)]",
    barClassName: "bg-[linear-gradient(90deg,#39b980_0%,#74f0b2_100%)]"
  },
  error: {
    icon: AlertTriangle,
    iconClassName: "text-[#ff96aa]",
    badgeClassName: "bg-[rgba(239,71,111,0.12)]",
    borderClassName: "border-[rgba(239,71,111,0.22)]",
    barClassName: "bg-[linear-gradient(90deg,#ef476f_0%,#ff96aa_100%)]"
  },
  info: {
    icon: Info,
    iconClassName: "text-[#c4a6ff]",
    badgeClassName: "bg-[rgba(140,82,255,0.14)]",
    borderClassName: "border-[rgba(140,82,255,0.22)]",
    barClassName: "bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_100%)]"
  }
};

export function PlatformToastRegion() {
  const { toasts, dismissToast } = usePlatformShell();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[140] flex w-[min(92vw,380px)] flex-col gap-3">
      {toasts.map((toast) => {
        const tone = toastToneMap[toast.tone];
        const Icon = tone.icon;

        return (
          <article
            key={toast.id}
            className={cn(
              "platform-toast-enter pointer-events-auto overflow-hidden rounded-[24px] border bg-[linear-gradient(180deg,rgba(20,23,31,0.98),rgba(11,13,19,0.99))] shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl",
              tone.borderClassName
            )}
          >
            <div className="flex items-start gap-3 px-4 py-4">
              <div
                className={cn(
                  "flex h-11 w-11 flex-none items-center justify-center rounded-[16px]",
                  tone.badgeClassName
                )}
              >
                <Icon className={cn("h-5 w-5", tone.iconClassName)} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-[-0.02em] text-white">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-[13px] leading-5 text-white/56">{toast.description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-white/44 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Fechar notificacao"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-1 w-full bg-white/[0.05]">
              <div
                className={cn("platform-toast-progress h-full origin-left", tone.barClassName)}
                style={{ "--toast-duration": `${toast.durationMs}ms` } as CSSProperties}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
