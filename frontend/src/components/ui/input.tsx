import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  endAdornment?: ReactNode;
  layout?: "outside" | "inside";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, endAdornment, className, layout = "outside", ...props },
  ref
) {
  const isInside = layout === "inside";

  return (
    <label className="block space-y-2">
      {!isInside ? <span className="block text-sm text-white/42">{label}</span> : null}
      <div className="relative">
        {isInside ? (
          <span className="pointer-events-none absolute left-5 top-3 text-[10px] text-white/26">
            {label}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            isInside
              ? "h-[52px] w-full rounded-full border border-white/[0.11] bg-[linear-gradient(180deg,rgba(36,37,42,0.78),rgba(23,24,29,0.72))] px-5 pb-2 pt-5 text-[12px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-10px_24px_rgba(0,0,0,0.18)] outline-none transition placeholder:text-white/24 focus:border-white/[0.18] focus:bg-[linear-gradient(180deg,rgba(40,41,47,0.84),rgba(24,25,30,0.76))]"
              : "h-14 w-full rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-white/20 focus:bg-white/[0.05]",
            endAdornment ? "pr-16" : "",
            className
          )}
          {...props}
        />
        {endAdornment ? (
          <div className="absolute inset-y-0 right-2 flex items-center">{endAdornment}</div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-[#ff92ad]">{error}</p> : null}
      {!error && helperText ? <p className="text-xs text-white/35">{helperText}</p> : null}
    </label>
  );
});
