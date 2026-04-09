"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ImageIcon, X } from "lucide-react";

import { productFormSchema, type ProductFormInput } from "@/schemas/product";
import type { PlatformProductItem } from "@/types/platform";

import {
  buildProductCover,
  createDraftProduct,
  getProductDefaults
} from "./product-utils";

interface ProductDialogProps {
  product: PlatformProductItem | null;
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: ProductFormInput) => Promise<void>;
}

export function ProductDialog({
  product,
  isOpen,
  isSubmitting,
  error,
  onClose,
  onSubmit
}: ProductDialogProps) {
  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: getProductDefaults(product ?? undefined)
  });

  useEffect(() => {
    form.reset(getProductDefaults(product ?? undefined));
  }, [form, isOpen, product]);

  if (!isOpen) {
    return null;
  }

  const watchedValues = form.watch();
  const previewProduct = product ?? createDraftProduct(watchedValues);
  const imagePreview = watchedValues.imageUrl || buildProductCover(previewProduct);

  return (
    <aside className="platform-surface rounded-[32px] p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,0.28)] lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/32">
            {product ? "Editar produto" : "Novo produto"}
          </p>
          <h2 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.06em] text-white">
            {product ? "Atualize os dados do produto" : "Criar produto ao lado da sua vitrine"}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-white/58 transition hover:bg-white/[0.08] hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,25,35,0.96),rgba(10,13,20,0.98))]">
          <div className="absolute left-7 right-7 top-0 h-2 rounded-b-full bg-[linear-gradient(90deg,#60a5fa_0%,#3b82f6_52%,#8c52ff_100%)] shadow-[0_0_30px_rgba(96,165,250,0.35)]" />
          <img
            src={imagePreview}
            alt={watchedValues.name || "Preview do produto"}
            className="h-[300px] w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,rgba(7,9,14,0)_0%,rgba(7,9,14,0.92)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex items-center gap-2 text-[#8fb9ff]">
              <ImageIcon className="h-4 w-4" />
              <p className="text-[11px] uppercase tracking-[0.2em]">Preview do card</p>
            </div>
            <p className="mt-3 text-[1.2rem] font-semibold text-white">
              {watchedValues.name || "Novo produto"}
            </p>
            <p className="mt-1 text-[13px] text-white/54">
              {watchedValues.category || "Categoria do produto"}
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/52">
              Nome do produto
            </label>
            <input
              className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
              placeholder="Ex.: Comunidade TOPICS Prime"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-[#ff9db1]">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/52">
                Categoria
              </label>
              <input
                className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
                placeholder="Digital, Mentoria, Comunidade..."
                {...form.register("category")}
              />
              {form.formState.errors.category ? (
                <p className="text-xs text-[#ff9db1]">{form.formState.errors.category.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/52">
                Preco
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
                placeholder="0,00"
                {...form.register("price", { valueAsNumber: true })}
              />
              {form.formState.errors.price ? (
                <p className="text-xs text-[#ff9db1]">{form.formState.errors.price.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/52">
              URL da imagem
            </label>
            <input
              className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
              placeholder="https://..."
              {...form.register("imageUrl")}
            />
            {form.formState.errors.imageUrl ? (
              <p className="text-xs text-[#ff9db1]">{form.formState.errors.imageUrl.message}</p>
            ) : (
              <p className="text-[11px] leading-5 text-white/34">
                Se nao informar uma imagem, o sistema gera uma capa estilizada automaticamente.
              </p>
            )}
          </div>

          <div className="flex min-h-[20px] items-center">
            {error ? <p className="text-sm text-[#ff9db1]">{error}</p> : null}
          </div>

          <div className="flex flex-wrap gap-3 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-white/68 transition hover:bg-white/[0.05] hover:text-white"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#8c52ff_0%,#c4a6ff_58%,#ffffff_100%)] px-5 py-2.5 text-sm font-semibold text-[#171a24] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : product ? "Salvar alteracoes" : "Criar produto"}
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
