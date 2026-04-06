import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatusBannerProps {
  tone: "success" | "error";
  message: string;
}

export function StatusBanner({ tone, message }: StatusBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        tone === "success"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
          : "border-[#ff6c8f]/20 bg-[#ff6c8f]/10 text-[#ffd8e1]"
      )}
    >
      {tone === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
