import { forwardRef } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helperText, children, className, ...props },
  ref
) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm text-white/42">{label}</span>
      <select
        ref={ref}
        className={cn(
          "h-14 w-full rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm text-white outline-none transition focus:border-white/20 focus:bg-white/[0.05]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-sm text-[#ff92ad]">{error}</p> : null}
      {!error && helperText ? <p className="text-xs text-white/35">{helperText}</p> : null}
    </label>
  );
});
