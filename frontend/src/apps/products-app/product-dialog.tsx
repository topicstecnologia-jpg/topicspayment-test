"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useForm } from "react-hook-form";
import { Check, ChevronDown, ImagePlus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { productFormSchema, type ProductFormInput } from "@/schemas/product";
import type {
  PlatformProductItem,
  PlatformProductRefundWindow,
  PlatformProductType
} from "@/types/platform";

import {
  buildProductCover,
  createDraftProduct,
  getProductDefaults
} from "./product-utils";

const MAX_COVER_SIZE_BYTES = 10 * 1024 * 1024;

const productTypeOptions: Array<{ value: PlatformProductType; label: string }> = [
  { value: "course", label: "Curso" },
  { value: "community", label: "Comunidade" },
  { value: "mentorship", label: "Mentoria" },
  { value: "template", label: "Template" },
  { value: "service", label: "Serviço" },
  { value: "event", label: "Evento" },
  { value: "subscription", label: "Assinatura" },
  { value: "other", label: "Outro" }
];

const refundWindowOptions: Array<{ value: PlatformProductRefundWindow; label: string }> = [
  { value: "7_days", label: "7 dias" },
  { value: "14_days", label: "14 dias" },
  { value: "21_days", label: "21 dias" },
  { value: "30_days", label: "30 dias" }
];

const baseCategoryOptions = [
  "Tecnologia",
  "Digital",
  "Comunidade",
  "Membros",
  "Serviços",
  "Eventos",
  "Educação",
  "Consultoria"
];

interface ProductDialogProps {
  product: PlatformProductItem | null;
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: ProductFormInput) => Promise<void>;
}

interface ProductSelectProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  error?: string;
}

function ProductSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  error
}: ProductSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (!isOpen) {
      return;
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/78">{label}</label>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-[18px] border px-4 text-left text-white outline-none transition",
            isOpen
              ? "border-[#8c52ff]/65 bg-[#151926] shadow-[0_0_0_4px_rgba(140,82,255,0.1)]"
              : "border-white/10 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.05]",
            error ? "border-[#ff9db1]/70" : ""
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="truncate text-[0.96rem] text-white">{selectedOption?.label ?? value}</span>
          <ChevronDown
            className={cn("h-4 w-4 flex-none text-white/54 transition-transform", isOpen ? "rotate-180" : "")}
          />
        </button>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,25,35,0.99),rgba(12,15,24,0.99))] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="platform-scrollbar max-h-64 overflow-y-auto pr-1">
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[16px] px-3.5 py-3 text-left text-sm transition",
                      isSelected
                        ? "bg-[linear-gradient(135deg,rgba(140,82,255,0.2),rgba(196,166,255,0.08))] text-white"
                        : "text-white/72 hover:bg-white/[0.05] hover:text-white"
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>{option.label}</span>
                    <Check className={cn("h-4 w-4 text-[#c4a6ff]", isSelected ? "opacity-100" : "opacity-0")} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-[#ff9db1]">{error}</p> : null}
    </div>
  );
}

export function ProductDialog({
  product,
  isOpen,
  isSubmitting,
  error,
  onClose,
  onSubmit
}: ProductDialogProps) {
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: getProductDefaults(product ?? undefined)
  });

  const {
    clearErrors,
    formState,
    register,
    reset,
    setError,
    setValue,
    watch
  } = form;

  useEffect(() => {
    reset(getProductDefaults(product ?? undefined));
  }, [form, isOpen, product, reset]);

  const watchedValues = watch();
  const descriptionLength = watchedValues.description?.length ?? 0;
  const hasSalesPage = watchedValues.hasSalesPage ?? false;
  const isProductActive = watchedValues.isActive ?? false;
  const categoryOptions = useMemo(() => {
    const currentCategory = watchedValues.category?.trim();

    if (currentCategory && !baseCategoryOptions.includes(currentCategory)) {
      return [currentCategory, ...baseCategoryOptions];
    }

    return baseCategoryOptions;
  }, [watchedValues.category]);

  if (!isOpen) {
    return null;
  }

  function applyCoverFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("imageUrl", {
        type: "manual",
        message: "Envie um arquivo de imagem válido para a capa."
      });
      return;
    }

    if (file.size > MAX_COVER_SIZE_BYTES) {
      setError("imageUrl", {
        type: "manual",
        message: "A capa precisa ter no máximo 10MB."
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("imageUrl", {
          type: "manual",
          message: "Não foi possível carregar a imagem selecionada."
        });
        return;
      }

      clearErrors("imageUrl");
      setValue("imageUrl", reader.result, {
        shouldDirty: true,
        shouldValidate: true
      });
    };

    reader.onerror = () => {
      setError("imageUrl", {
        type: "manual",
        message: "Não foi possível ler o arquivo enviado."
      });
    };

    reader.readAsDataURL(file);
  }

  function handleCoverInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    applyCoverFile(file);
    event.target.value = "";
  }

  function handleCoverDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDraggingCover(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    applyCoverFile(file);
  }

  const previewProduct = product ?? createDraftProduct(watchedValues);
  const coverPreview = buildProductCover(previewProduct);

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/32">Novo produto</p>
          <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.06em] text-white">
            Informações do produto
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

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <button
          type="button"
          onClick={() =>
            setValue("isActive", !isProductActive, {
              shouldDirty: true,
              shouldValidate: true
            })
          }
          className="inline-flex items-center gap-3 self-start"
          aria-pressed={isProductActive}
        >
          <span
            className={cn(
              "relative inline-flex h-8 w-14 rounded-full border transition",
              isProductActive
                ? "border-transparent bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_100%)]"
                : "border-white/10 bg-white/[0.08]"
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-6 w-6 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.26)] transition",
                isProductActive ? "left-[30px]" : "left-1"
              )}
            />
          </span>
          <span className="text-sm font-semibold text-white">
            {isProductActive ? "Produto ativo" : "Produto desativado"}
          </span>
        </button>

        <input type="hidden" {...register("price", { valueAsNumber: true })} />
        <input type="hidden" {...register("stock", { valueAsNumber: true })} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-white/78">Nome do produto</label>
            <input
              className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
              placeholder="Ex.: Intervenção"
              {...register("name")}
            />
            {formState.errors.name ? (
              <p className="text-xs text-[#ff9db1]">{formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-white/78">URL da página de vendas</label>
            <input
              className={cn(
                "h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10",
                !hasSalesPage && "cursor-not-allowed border-white/6 bg-white/[0.02] text-white/28"
              )}
              placeholder="https://..."
              disabled={!hasSalesPage}
              {...register("salesPageUrl")}
            />
            {formState.errors.salesPageUrl ? (
              <p className="text-xs text-[#ff9db1]">{formState.errors.salesPageUrl.message}</p>
            ) : (
              <p className="text-[11px] leading-5 text-white/34">
                {hasSalesPage
                  ? "Use a URL publicada da página que recebe o tráfego e a conversão."
                  : "Ative a opção abaixo quando a página estiver pronta para receber a URL."}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-white/78">Página de vendas já publicada?</label>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setValue("hasSalesPage", true, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }}
                className={cn(
                  "flex items-center gap-3 rounded-[20px] border px-4 py-4 text-left transition",
                  hasSalesPage
                    ? "border-[#8c52ff]/50 bg-[linear-gradient(180deg,rgba(140,82,255,0.16),rgba(140,82,255,0.06))] text-white"
                    : "border-white/10 bg-white/[0.03] text-white/52 hover:bg-white/[0.05] hover:text-white/82"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border transition",
                    hasSalesPage ? "border-[#ff77c8] bg-[#ff77c8]/22" : "border-white/18 bg-transparent"
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full transition", hasSalesPage ? "bg-[#ff77c8]" : "bg-transparent")} />
                </span>
                <span className="text-sm font-semibold">Sim, já possuo.</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue("hasSalesPage", false, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                  clearErrors("salesPageUrl");
                }}
                className={cn(
                  "flex items-center gap-3 rounded-[20px] border px-4 py-4 text-left transition",
                  !hasSalesPage
                    ? "border-white/14 bg-white/[0.06] text-white"
                    : "border-white/10 bg-white/[0.03] text-white/52 hover:bg-white/[0.05] hover:text-white/82"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border transition",
                    !hasSalesPage ? "border-white/80 bg-white/18" : "border-white/18 bg-transparent"
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full transition", !hasSalesPage ? "bg-white" : "bg-transparent")} />
                </span>
                <span className="text-sm font-semibold">Não, ainda não possuo.</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-white/78">Descrição do produto</label>
              <span className="text-[11px] text-white/34">{descriptionLength}/1000 caracteres</span>
            </div>
            <textarea
              rows={7}
              className="w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
              placeholder="Explique o que o produto entrega, para quem ele é ideal e como a oferta funciona."
              {...register("description")}
            />
            {formState.errors.description ? (
              <p className="text-xs text-[#ff9db1]">{formState.errors.description.message}</p>
            ) : (
              <p className="text-[11px] leading-5 text-white/34">
                Descreva a proposta, a transformação e o contexto de compra com o mesmo tom premium da plataforma.
              </p>
            )}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-white/78">Capa do produto</label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleCoverInputChange}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingCover(true);
              }}
              onDragLeave={() => setIsDraggingCover(false)}
              onDrop={handleCoverDrop}
              className={cn(
                "group relative min-h-[230px] w-full overflow-hidden rounded-[24px] border border-dashed text-left transition",
                isDraggingCover
                  ? "border-[#8c52ff]/62 bg-[#8c52ff]/8"
                  : "border-white/10 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.05]"
              )}
            >
              <img
                src={coverPreview}
                alt={previewProduct.name}
                className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,14,0.24)_0%,rgba(7,9,14,0.72)_52%,rgba(7,9,14,0.9)_100%)]" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-6 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/12 bg-white/[0.08] text-white shadow-[0_20px_40px_rgba(0,0,0,0.22)]">
                  <ImagePlus className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-white">Arraste e solte um arquivo ou clique para importar.</p>
                  <p className="mt-2 text-[12px] leading-5 text-white/46">
                    PNG, JPG ou WEBP com até 10MB. Se não enviar uma capa nova, a identidade automática da plataforma continua ativa.
                  </p>
                </div>
                <span className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/80">
                  {watchedValues.imageUrl ? "Trocar capa atual" : "Selecionar capa"}
                </span>
              </div>
            </button>
            {formState.errors.imageUrl ? (
              <p className="text-xs text-[#ff9db1]">{formState.errors.imageUrl.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <ProductSelect
              label="Tipo de produto"
              value={watchedValues.productType ?? "other"}
              options={productTypeOptions}
              onChange={(nextValue) =>
                setValue("productType", nextValue, {
                  shouldDirty: true,
                  shouldValidate: true
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            <ProductSelect
              label="Categoria"
              value={watchedValues.category ?? categoryOptions[0]}
              options={categoryOptions.map((option) => ({ value: option, label: option }))}
              onChange={(nextValue) =>
                setValue("category", nextValue, {
                  shouldDirty: true,
                  shouldValidate: true
                })
              }
              error={formState.errors.category?.message}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/78">Identificação na fatura do cartão de crédito</label>
            <input
              className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
              placeholder="TOPICS PAY"
              {...register("invoiceStatementDescriptor")}
            />
            {formState.errors.invoiceStatementDescriptor ? (
              <p className="text-xs text-[#ff9db1]">{formState.errors.invoiceStatementDescriptor.message}</p>
            ) : (
              <p className="text-[11px] leading-5 text-white/34">
                Caso informada, aparecerá na fatura com o limite padrão do emissor.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <ProductSelect
              label="Prazo de reembolso"
              value={watchedValues.refundWindow ?? "7_days"}
              options={refundWindowOptions}
              onChange={(nextValue) =>
                setValue("refundWindow", nextValue, {
                  shouldDirty: true,
                  shouldValidate: true
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/78">E-mail de contato do suporte</label>
            <input
              type="email"
              className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
              placeholder="suporte@topicspay.com"
              {...register("supportEmail")}
            />
            {formState.errors.supportEmail ? (
              <p className="text-xs text-[#ff9db1]">{formState.errors.supportEmail.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/78">Contato do suporte</label>
            <input
              className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
              placeholder="(11) 99999-9999"
              {...register("supportPhone")}
            />
            {formState.errors.supportPhone ? (
              <p className="text-xs text-[#ff9db1]">{formState.errors.supportPhone.message}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
          <div className="min-h-[20px]">
            {error ? <p className="text-sm text-[#ff9db1]">{error}</p> : null}
          </div>

          <div className="flex flex-wrap gap-3">
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
              {isSubmitting ? "Salvando..." : "Criar produto"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
