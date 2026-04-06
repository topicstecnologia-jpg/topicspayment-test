import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({
  children,
  className,
  loading,
  variant = "primary",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition duration-200",
        variant === "primary" &&
          "topics-gradient text-[#09090b] shadow-[0_18px_45px_rgba(140,82,255,0.28)] hover:brightness-105",
        variant === "secondary" &&
          "border border-white/8 bg-white/[0.04] text-white hover:border-white/15 hover:bg-white/[0.06]",
        variant === "ghost" && "bg-transparent text-white/70 hover:text-white",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Aguarde..." : children}
    </button>
  );
}
