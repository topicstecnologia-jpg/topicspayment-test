"use client";

import type { KeyboardEvent } from "react";
import { Power } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PlatformProductItem } from "@/types/platform";

import { buildProductCover } from "./product-utils";

interface ProductCardProps {
  product: PlatformProductItem;
  isBusy: boolean;
  onEdit: (product: PlatformProductItem) => void;
  onToggle: (product: PlatformProductItem) => void;
}

export function ProductCard({
  product,
  isBusy,
  onEdit,
  onToggle
}: ProductCardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onEdit(product);
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onEdit(product)}
      onKeyDown={handleKeyDown}
      className="group relative aspect-[5/7] w-full overflow-visible rounded-[30px] p-0 text-left outline-none transition duration-300 hover:-translate-y-1 hover:rotate-[-0.25deg] focus-visible:-translate-y-1"
    >
      <div className="absolute inset-x-[10%] inset-y-[9%] rounded-[36px] bg-[radial-gradient(circle,rgba(160,96,255,0.34),rgba(97,44,221,0.1)_52%,transparent_76%)] blur-[34px] transition duration-300 group-hover:opacity-100" />
      <div className="absolute inset-x-[18%] top-[-3%] h-20 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.24),transparent_72%)] blur-[22px] opacity-70" />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(88,51,195,0.28),rgba(28,14,61,0.74)_22%,rgba(6,4,18,0.98)_100%)] shadow-[0_22px_62px_rgba(4,2,14,0.38)] transition duration-300 group-hover:border-white/18">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(232,222,255,0.24),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(145,91,255,0.28),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,rgba(255,255,255,0.01)_72%,rgba(255,255,255,0.04)_100%)]" />
        <div className="relative m-2.5 flex-1 overflow-hidden rounded-[26px]">
          <img
            src={buildProductCover(product)}
            alt={product.name}
            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,10,36,0.08)_0%,rgba(13,8,28,0.18)_22%,rgba(8,5,20,0.5)_62%,rgba(6,4,16,0.92)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent)] opacity-80" />
          <div className="absolute inset-x-4 top-5 text-center">
            <h3 className="line-clamp-2 min-h-[2.5rem] text-[1.18rem] font-medium leading-[1.04] tracking-[-0.055em] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.34)]">
              {product.name}
            </h3>
          </div>

          <div className="absolute inset-x-3.5 bottom-3.5">
            <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-[rgba(10,8,20,0.44)] px-3.5 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium tracking-[0.04em] text-white/72">
                  ID {product.id}
                </p>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle(product);
                }}
                disabled={isBusy}
                className={cn(
                  "inline-flex h-9 min-w-[104px] items-center justify-center gap-1.5 rounded-full px-3.5 text-[11.5px] font-semibold shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition disabled:cursor-not-allowed disabled:opacity-60",
                  product.isActive
                    ? "bg-white text-[#1a1330] hover:bg-white/92"
                    : "border border-white/12 bg-white/10 text-white backdrop-blur-md hover:bg-white/16"
                )}
              >
                <Power className="h-3.5 w-3.5" />
                {isBusy
                  ? "Salvando..."
                  : product.isActive
                    ? "Desativar"
                    : "Ativar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
