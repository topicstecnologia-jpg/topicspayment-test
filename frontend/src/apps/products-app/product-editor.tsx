"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  ArrowLeft,
  BadgePercent,
  BarChart3,
  Boxes,
  Check,
  ChevronDown,
  Copy,
  CircleDollarSign,
  ExternalLink,
  ImagePlus,
  Info,
  Layers3,
  PackageCheck,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  X
} from "lucide-react";

import { productEditorSchema, type ProductEditorInput } from "@/schemas/product";
import { cn } from "@/lib/utils";
import type {
  PlatformProductCouponDiscountType,
  PlatformProductItem,
  PlatformProductOfferCardInterestPayer,
  PlatformProductOfferBillingCycle,
  PlatformProductRefundWindow,
  PlatformProductType
} from "@/types/platform";

import {
  buildProductCover,
  ensurePrimaryOffer,
  formatCurrency,
  formatUpdatedAt,
  getProductEditorDefaults,
  mergeProductWithEditorValues
} from "./product-utils";

type ProductEditorSection = "dashboard" | "details" | "offers" | "coupons";
type OfferViewMode = "list" | "editor";
type ProductEditorOffer = ProductEditorInput["offers"][number];

const editorSections = [
  { id: "dashboard", label: "Dashboard do produto", icon: BarChart3 },
  { id: "details", label: "Informacoes do produto", icon: Info },
  { id: "offers", label: "Ofertas", icon: Layers3 },
  { id: "coupons", label: "Cupons", icon: BadgePercent }
] as const satisfies Array<{
  id: ProductEditorSection;
  label: string;
  icon: typeof BarChart3;
}>;

const billingCycleLabels: Record<PlatformProductOfferBillingCycle, string> = {
  one_time: "Pagamento único",
  monthly: "Mensal",
  annual: "Anual"
};

const billingCycleOptions: Array<{
  value: PlatformProductOfferBillingCycle;
  label: string;
}> = [
  { value: "one_time", label: "Pagamento único" },
  { value: "monthly", label: "Mensal" },
  { value: "annual", label: "Anual" }
];

const boletoDueDayOptions = [
  { value: "1", label: "1 dia" },
  { value: "2", label: "2 dias" },
  { value: "3", label: "3 dias" },
  { value: "5", label: "5 dias" },
  { value: "7", label: "7 dias" }
] as const;

const discountTypeLabels: Record<PlatformProductCouponDiscountType, string> = {
  percent: "Percentual",
  fixed: "Valor fixo"
};

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

function hashValue(value: string) {
  return Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0);
}

function buildOfferCode(productId: string, offerId: string, index: number) {
  return hashValue(`${productId}:${offerId}:${index}`)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0")
    .slice(-8);
}

function buildOfferCheckoutUrl(salesPageUrl: string | null, offerId: string) {
  if (!salesPageUrl) {
    return null;
  }

  try {
    const url = new URL(salesPageUrl);
    url.searchParams.set("offer", offerId);
    return url.toString();
  } catch {
    return null;
  }
}

function buildProductTrend(product: PlatformProductItem) {
  const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const now = new Date();

  return Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);

    return {
      label: monthFormatter.format(date).replace(".", ""),
      revenue: 0,
      orders: 0
    };
  });
}

function buildRecentSales() {
  return [] as Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
    when: string;
  }>;
}

interface PlatformSelectOption<T extends string> {
  value: T;
  label: string;
}

interface PlatformSelectProps<T extends string> {
  label: string;
  value: T;
  options: Array<PlatformSelectOption<T>>;
  onChange: (value: T) => void;
  error?: string;
  helperText?: string;
}

function PlatformSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
  helperText
}: PlatformSelectProps<T>) {
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
              : "border-white/10 bg-[#121722] hover:border-white/16 hover:bg-[#171d2b]",
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
      {!error && helperText ? <p className="text-[11px] leading-5 text-white/34">{helperText}</p> : null}
    </div>
  );
}

function buildEmptyOffer(isPrimary: boolean): ProductEditorOffer {
  return {
    title: "",
    checkoutDescription: "",
    description: "",
    imageUrl: null,
    price: 0,
    anchorPrice: undefined,
    itemCount: 1,
    billingCycle: "one_time",
    isFree: false,
    passFixedFeeToBuyer: false,
    cardEnabled: true,
    cardInterestPayer: "buyer",
    cardSmartInstallments: false,
    cardSinglePaymentEnabled: true,
    boletoEnabled: true,
    boletoDueDays: 1,
    boletoInfinite: true,
    boletoAfterDueDays: 30,
    pixManualEnabled: true,
    paymentMethodDiscountsEnabled: false,
    active: true,
    isPrimary
  };
}

function isOfferUntouched(offer: ProductEditorOffer | undefined) {
  if (!offer) {
    return true;
  }

  return (
    offer.title.trim() === "" &&
    offer.checkoutDescription.trim() === "" &&
    offer.description.trim() === "" &&
    !offer.imageUrl &&
    Number(offer.price ?? 0) === 0 &&
    offer.anchorPrice == null &&
    Number(offer.itemCount ?? 1) === 1 &&
    offer.billingCycle === "one_time" &&
    offer.isFree === false &&
    offer.passFixedFeeToBuyer === false &&
    offer.cardEnabled === true &&
    offer.cardInterestPayer === "buyer" &&
    offer.cardSmartInstallments === false &&
    offer.cardSinglePaymentEnabled === true &&
    offer.boletoEnabled === true &&
    Number(offer.boletoDueDays ?? 1) === 1 &&
    offer.boletoInfinite === true &&
    Number(offer.boletoAfterDueDays ?? 30) === 30 &&
    offer.pixManualEnabled === true &&
    offer.paymentMethodDiscountsEnabled === false &&
    offer.active === true
  );
}

interface ProductEditorProps {
  product: PlatformProductItem | null;
  isOpen: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  error: string | null;
  successMessage: string | null;
  onClose: () => void;
  onDelete: () => Promise<boolean>;
  onSubmit: (values: ProductEditorInput) => Promise<void>;
}

export function ProductEditor({
  product,
  isOpen,
  isSubmitting,
  isDeleting,
  error,
  successMessage,
  onClose,
  onDelete,
  onSubmit
}: ProductEditorProps) {
  const [activeSection, setActiveSection] = useState<ProductEditorSection>("dashboard");
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [offerViewMode, setOfferViewMode] = useState<OfferViewMode>("list");
  const [selectedOfferIndex, setSelectedOfferIndex] = useState<number | null>(null);
  const [creatingOfferIndex, setCreatingOfferIndex] = useState<number | null>(null);
  const [offersFeedback, setOffersFeedback] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmationValue, setDeleteConfirmationValue] = useState("");
  const [deleteValidationError, setDeleteValidationError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const offerImageInputRef = useRef<HTMLInputElement | null>(null);
  const form = useForm<ProductEditorInput>({
    resolver: zodResolver(productEditorSchema),
    defaultValues: product ? getProductEditorDefaults(product) : undefined
  });

  const {
    clearErrors,
    control,
    formState,
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch
  } = form;
  const offersFieldArray = useFieldArray({ control, name: "offers", keyName: "fieldKey" });
  const couponsFieldArray = useFieldArray({ control, name: "coupons", keyName: "fieldKey" });

  useEffect(() => {
    if (!isOpen || !product) {
      return;
    }

    reset(getProductEditorDefaults(product));
    setOfferViewMode("list");
    setSelectedOfferIndex((product.offers?.length ?? 0) > 0 ? 0 : null);
    setCreatingOfferIndex(null);
    setOffersFeedback(null);
    setIsDeleteOpen(false);
    setDeleteConfirmationValue("");
    setDeleteValidationError(null);
  }, [isOpen, product, reset]);

  useEffect(() => {
    if (!isOpen || !product) {
      return;
    }

    setActiveSection("dashboard");
  }, [isOpen, product?.id]);

  useEffect(() => {
    const offersLength = offersFieldArray.fields.length;

    if (offersLength === 0) {
      setOfferViewMode("list");
      setCreatingOfferIndex(null);
    }

    setSelectedOfferIndex((current) => {
      if (offersLength === 0) {
        return null;
      }

      if (current == null) {
        return 0;
      }

      return current >= offersLength ? offersLength - 1 : current;
    });
  }, [offersFieldArray.fields.length]);

  const watchedValues = watch() as ProductEditorInput;
  const descriptionLength = watchedValues.description?.length ?? 0;
  const hasSalesPage = watchedValues.hasSalesPage ?? true;
  const isProductActive = watchedValues.isActive ?? false;
  const offersValues: ProductEditorInput["offers"] = watchedValues.offers ?? [];
  const categoryOptions = useMemo(() => {
    const currentCategory = watchedValues.category?.trim();

    if (currentCategory && !baseCategoryOptions.includes(currentCategory)) {
      return [currentCategory, ...baseCategoryOptions];
    }

    return baseCategoryOptions;
  }, [watchedValues.category]);

  useEffect(() => {
    const primaryOffer =
      watchedValues.offers?.find((offer: ProductEditorInput["offers"][number]) => offer.isPrimary) ??
      watchedValues.offers?.[0];

    if (!primaryOffer) {
      return;
    }

    if (getValues("price") !== primaryOffer.price) {
      setValue("price", primaryOffer.price, { shouldDirty: true });
    }
  }, [getValues, setValue, watchedValues.offers]);

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

  const previewProduct = useMemo(() => {
    if (!product) {
      return null;
    }

    return mergeProductWithEditorValues(product, {
      ...watchedValues,
      offers: ensurePrimaryOffer(
        (watchedValues.offers ?? []).map((offer: ProductEditorInput["offers"][number], index: number) => ({
          ...offer,
          imageUrl: offer.imageUrl ?? null,
          id: offer.id || `${product.id}-offer-${index + 1}`
        }))
      ),
      coupons: (watchedValues.coupons ?? []).map((coupon: ProductEditorInput["coupons"][number], index: number) => ({
        ...coupon,
        id: coupon.id || `${product.id}-coupon-${index + 1}`
      }))
    });
  }, [product, watchedValues]);

  if (!isOpen || !product || !previewProduct) {
    return null;
  }

  const coverPreview = buildProductCover(previewProduct);
  const trend = buildProductTrend(previewProduct);
  const recentSales = buildRecentSales();
  const primaryOffer =
    previewProduct.offers.find((offer: PlatformProductItem["offers"][number]) => offer.isPrimary) ??
    previewProduct.offers[0];
  const revenueEstimate = previewProduct.price * previewProduct.sales;
  const selectedOffer =
    selectedOfferIndex != null ? offersValues[selectedOfferIndex] ?? null : null;
  const selectedOfferErrors =
    selectedOfferIndex != null ? formState.errors.offers?.[selectedOfferIndex] : undefined;
  const selectedOfferId =
    selectedOfferIndex != null
      ? selectedOffer?.id || `${product.id}-offer-${selectedOfferIndex + 1}`
      : null;
  const selectedOfferCode =
    selectedOfferId && selectedOfferIndex != null
      ? buildOfferCode(product.id, selectedOfferId, selectedOfferIndex)
      : null;
  const selectedOfferCheckoutUrl =
    selectedOfferId ? buildOfferCheckoutUrl(previewProduct.salesPageUrl, selectedOfferId) : null;
  const selectedOfferPreview = selectedOffer?.imageUrl || coverPreview;
  const selectedOfferCheckoutDescriptionLength = selectedOffer?.checkoutDescription?.length ?? 0;
  const selectedOfferDescriptionLength = selectedOffer?.description?.length ?? 0;
  const isCreatingNewOffer =
    selectedOfferIndex != null && creatingOfferIndex === selectedOfferIndex;
  const isBusy = isSubmitting || isDeleting;
  const expectedDeleteConfirmation = previewProduct.name.trim();
  const deleteConfirmationMatches = deleteConfirmationValue.trim() === expectedDeleteConfirmation;

  function closeDeleteDialog() {
    if (isDeleting) {
      return;
    }

    setIsDeleteOpen(false);
    setDeleteConfirmationValue("");
    setDeleteValidationError(null);
  }

  async function handleDeleteConfirmation() {
    if (!deleteConfirmationMatches) {
      setDeleteValidationError("Digite exatamente o nome do produto para confirmar a exclusão.");
      return;
    }

    setDeleteValidationError(null);
    const deleted = await onDelete();

    if (deleted) {
      closeDeleteDialog();
    }
  }

  function openOfferEditor(index: number, mode: "existing" | "new" = "existing") {
    setSelectedOfferIndex(index);
    setCreatingOfferIndex(mode === "new" ? index : null);
    setOfferViewMode("editor");
    setOffersFeedback(null);
  }

  function appendOffer() {
    const nextIndex = offersFieldArray.fields.length;

    offersFieldArray.append(buildEmptyOffer(offersFieldArray.fields.length === 0));
    openOfferEditor(nextIndex, "new");
  }

  function closeOfferEditor() {
    const pendingOffer =
      creatingOfferIndex != null ? (getValues("offers") ?? [])[creatingOfferIndex] : undefined;

    if (creatingOfferIndex != null && isOfferUntouched(pendingOffer)) {
      offersFieldArray.remove(creatingOfferIndex);
    }

    setCreatingOfferIndex(null);
    setOfferViewMode("list");
    setOffersFeedback(null);
  }

  function setPrimaryOffer(index: number) {
    setValue(
      "offers",
      (getValues("offers") ?? []).map((offer: ProductEditorInput["offers"][number], offerIndex: number) => ({
        ...offer,
        isPrimary: offerIndex === index
      })),
      { shouldDirty: true, shouldValidate: true }
    );
  }

  function removeOffer(index: number) {
    const currentOffers = getValues("offers") ?? [];
    const wasPrimary = currentOffers[index]?.isPrimary;
    const nextLength = Math.max(currentOffers.length - 1, 0);

    offersFieldArray.remove(index);
    setOffersFeedback(null);
    setOfferViewMode("list");
    setCreatingOfferIndex((current) => {
      if (current == null) {
        return null;
      }

      if (current === index) {
        return null;
      }

      return current > index ? current - 1 : current;
    });

    setSelectedOfferIndex((current) => {
      if (nextLength === 0) {
        return null;
      }

      if (current == null) {
        return 0;
      }

      if (current === index) {
        return Math.min(index, nextLength - 1);
      }

      return current > index ? current - 1 : current;
    });

    if (wasPrimary && getValues("offers").length > 0) {
      setPrimaryOffer(0);
    }
  }

  function toggleOfferActive(index: number) {
    const currentValue = getValues(`offers.${index}.active`) ?? true;

    setValue(`offers.${index}.active`, !currentValue, {
      shouldDirty: true,
      shouldValidate: true
    });
    setOffersFeedback(null);
  }

  async function copyOfferCheckoutLink(index: number) {
    if (!product || !previewProduct) {
      return;
    }

    const offer = offersValues[index];
    const offerId = offer?.id || `${product.id}-offer-${index + 1}`;
    const checkoutUrl = buildOfferCheckoutUrl(previewProduct.salesPageUrl, offerId);

    if (!checkoutUrl) {
      setOffersFeedback("Preencha a URL da página de vendas para liberar o link do checkout.");
      return;
    }

    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setOffersFeedback("Link do checkout copiado.");
    } catch {
      setOffersFeedback("Não foi possível copiar o link do checkout.");
    }
  }

  function openOfferCheckout(index: number) {
    if (!product || !previewProduct) {
      return;
    }

    const offer = offersValues[index];
    const offerId = offer?.id || `${product.id}-offer-${index + 1}`;
    const checkoutUrl = buildOfferCheckoutUrl(previewProduct.salesPageUrl, offerId);

    if (!checkoutUrl) {
      setOffersFeedback("Preencha a URL da página de vendas para visualizar o checkout.");
      return;
    }

    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  }

  function applyOfferImageFile(file: File, offerIndex: number) {
    if (!file.type.startsWith("image/")) {
      setError(`offers.${offerIndex}.imageUrl`, {
        type: "manual",
        message: "Envie um arquivo de imagem válido para a oferta."
      });
      return;
    }

    if (file.size > MAX_COVER_SIZE_BYTES) {
      setError(`offers.${offerIndex}.imageUrl`, {
        type: "manual",
        message: "A imagem da oferta precisa ter no máximo 10MB."
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError(`offers.${offerIndex}.imageUrl`, {
          type: "manual",
          message: "Não foi possível carregar a imagem selecionada."
        });
        return;
      }

      clearErrors(`offers.${offerIndex}.imageUrl`);
      setValue(`offers.${offerIndex}.imageUrl`, reader.result, {
        shouldDirty: true,
        shouldValidate: true
      });
    };

    reader.onerror = () => {
      setError(`offers.${offerIndex}.imageUrl`, {
        type: "manual",
        message: "Não foi possível ler o arquivo enviado."
      });
    };

    reader.readAsDataURL(file);
  }

  function handleOfferImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || selectedOfferIndex == null) {
      return;
    }

    applyOfferImageFile(file, selectedOfferIndex);
    event.target.value = "";
  }

  function renderOfferEditor() {
    if (!selectedOffer || selectedOfferIndex == null) {
      return null;
    }

    return (
      <div className="space-y-5">
        <input type="hidden" {...register(`offers.${selectedOfferIndex}.billingCycle` as const)} />
        <input type="hidden" {...register(`offers.${selectedOfferIndex}.active` as const)} />
        <input type="hidden" {...register(`offers.${selectedOfferIndex}.imageUrl` as const)} />

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={closeOfferEditor}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/72 transition hover:bg-white/[0.05] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para ofertas
            </button>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/32">
                {isCreatingNewOffer ? "Nova oferta" : "Editar oferta"}
              </p>
              <h4 className="mt-2 text-[1.28rem] font-semibold tracking-[-0.05em] text-white">
                {selectedOffer.title?.trim() ||
                  (isCreatingNewOffer ? "Preencha os dados da nova oferta" : `Oferta ${selectedOfferIndex + 1}`)}
              </h4>
              <p className="mt-2 text-[13px] leading-6 text-white/46">
                Cadastre os campos manualmente antes de salvar a oferta.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPrimaryOffer(selectedOfferIndex)}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition",
                selectedOffer.isPrimary
                  ? "topics-gradient text-[#10131b]"
                  : "border border-white/10 bg-white/[0.03] text-white/72 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              {selectedOffer.isPrimary ? "Oferta principal" : "Definir como principal"}
            </button>
            <button
              type="button"
              onClick={() => removeOffer(selectedOfferIndex)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-sm font-medium text-white/58 transition hover:bg-white/[0.05] hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </button>
          </div>
        </div>

        {offersFeedback ? <p className="text-sm text-white/58">{offersFeedback}</p> : null}

        <section className="platform-surface rounded-[30px] p-5 lg:p-6">
          <div className="grid gap-5 xl:grid-cols-[165px_minmax(0,1fr)] xl:items-start">
            <div className="space-y-2">
              <input
                ref={offerImageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleOfferImageInputChange}
              />

              <button
                type="button"
                onClick={() => offerImageInputRef.current?.click()}
                className="group relative flex aspect-square w-full items-end overflow-hidden rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] text-left transition hover:border-white/18 hover:bg-white/[0.05]"
              >
                <img
                  src={selectedOfferPreview}
                  alt={selectedOffer.title?.trim() || "Nova oferta"}
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,14,0.08)_0%,rgba(7,9,14,0.62)_55%,rgba(7,9,14,0.88)_100%)]" />
                <div className="relative z-10 flex w-full flex-col items-center gap-3 px-4 py-4 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/12 bg-white/[0.08] text-white shadow-[0_16px_36px_rgba(0,0,0,0.2)]">
                    <ImagePlus className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">Imagem da oferta</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/50">Clique para enviar PNG, JPG ou WEBP.</p>
                  </div>
                </div>
              </button>

              {selectedOffer.imageUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    setValue(`offers.${selectedOfferIndex}.imageUrl`, null, {
                      shouldDirty: true,
                      shouldValidate: true
                    })
                  }
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/68 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Remover imagem
                </button>
              ) : null}

              {selectedOfferErrors?.imageUrl ? (
                <p className="text-xs text-[#ff9db1]">{selectedOfferErrors.imageUrl.message}</p>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/78">Nome da oferta</label>
                  <input
                    className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
                    placeholder="Informe o nome da sua oferta"
                    {...register(`offers.${selectedOfferIndex}.title` as const)}
                  />
                  {selectedOfferErrors?.title ? (
                    <p className="text-xs text-[#ff9db1]">{selectedOfferErrors.title.message}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-white/78">Descrição no checkout</label>
                    <span className="text-[11px] text-white/34">{selectedOfferCheckoutDescriptionLength}/180</span>
                  </div>
                  <input
                    className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
                    placeholder="Texto exibido no checkout"
                    {...register(`offers.${selectedOfferIndex}.checkoutDescription` as const)}
                  />
                  {selectedOfferErrors?.checkoutDescription ? (
                    <p className="text-xs text-[#ff9db1]">{selectedOfferErrors.checkoutDescription.message}</p>
                  ) : (
                    <p className="text-[11px] leading-5 text-white/34">
                      Quando preenchido, este campo pode substituir o nome da oferta no checkout.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-white/78">Descrição</label>
                  <span className="text-[11px] text-white/34">{selectedOfferDescriptionLength}/600</span>
                </div>
                <textarea
                  rows={5}
                  className="w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
                  placeholder="Forneça um texto que descreva melhor sua oferta."
                  {...register(`offers.${selectedOfferIndex}.description` as const)}
                />
                {selectedOfferErrors?.description ? (
                  <p className="text-xs text-[#ff9db1]">{selectedOfferErrors.description.message}</p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <PlatformSelect
                  label="Tipo de cobrança"
                  value={selectedOffer.billingCycle ?? "one_time"}
                  options={billingCycleOptions}
                  onChange={(nextValue) =>
                    setValue(`offers.${selectedOfferIndex}.billingCycle`, nextValue, {
                      shouldDirty: true,
                      shouldValidate: true
                    })
                  }
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/78">Preço de ancoragem</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
                    placeholder="Valor comparativo"
                    {...register(`offers.${selectedOfferIndex}.anchorPrice` as const, {
                      setValueAs: (value) => (value === "" ? undefined : Number(value))
                    })}
                  />
                  {selectedOfferErrors?.anchorPrice ? (
                    <p className="text-xs text-[#ff9db1]">{selectedOfferErrors.anchorPrice.message}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/78">Preço do produto</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
                    placeholder="Informe um valor"
                    {...register(`offers.${selectedOfferIndex}.price` as const, { valueAsNumber: true })}
                  />
                  {selectedOfferErrors?.price ? (
                    <p className="text-xs text-[#ff9db1]">{selectedOfferErrors.price.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/78">Link do checkout</label>
                  <div className="flex min-h-[48px] items-center rounded-[18px] border border-white/10 bg-white/[0.03] px-4 text-sm text-white/60">
                    {selectedOfferCheckoutUrl ??
                      "Preencha a URL da página de vendas do produto para gerar o link desta oferta."}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/78">Quantidade de itens</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
                    placeholder="1"
                    {...register(`offers.${selectedOfferIndex}.itemCount` as const, { valueAsNumber: true })}
                  />
                  {selectedOfferErrors?.itemCount ? (
                    <p className="text-xs text-[#ff9db1]">{selectedOfferErrors.itemCount.message}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="platform-surface rounded-[30px] p-5 lg:p-6">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                key: "active",
                label: "Ativar oferta?",
                description: "Quando desligada, a oferta continua salva, mas fica fora do fluxo principal."
              },
              {
                key: "isFree",
                label: "Oferta grátis",
                description: "Use para experiências gratuitas ou ofertas sem cobrança imediata."
              },
              {
                key: "passFixedFeeToBuyer",
                label: "Repassar taxa fixa",
                description: "Repassa a taxa fixa da operação para o comprador quando fizer sentido."
              }
            ].map((toggle) => {
              const checked = Boolean(selectedOffer[toggle.key as keyof ProductEditorOffer]);

              return (
                <button
                  key={toggle.key}
                  type="button"
                  onClick={() =>
                    setValue(
                      `offers.${selectedOfferIndex}.${toggle.key}` as any,
                      !checked,
                      { shouldDirty: true, shouldValidate: true }
                    )
                  }
                  className={cn(
                    "rounded-[22px] border px-4 py-4 text-left transition",
                    checked
                      ? "border-[#8c52ff]/44 bg-[linear-gradient(180deg,rgba(140,82,255,0.16),rgba(140,82,255,0.05))]"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{toggle.label}</span>
                    <span
                      className={cn(
                        "relative inline-flex h-7 w-12 rounded-full border transition",
                        checked
                          ? "border-transparent bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_100%)]"
                          : "border-white/10 bg-white/[0.08]"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.26)] transition",
                          checked ? "left-[25px]" : "left-0.5"
                        )}
                      />
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] leading-5 text-white/40">{toggle.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="platform-surface rounded-[30px] p-5 lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h5 className="text-[1.05rem] font-semibold tracking-[-0.04em] text-white">Cartão de crédito</h5>
              <p className="mt-2 text-[13px] leading-6 text-white/46">
                Configure a cobrança principal por cartão e o comportamento do parcelamento.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setValue(`offers.${selectedOfferIndex}.cardEnabled`, !selectedOffer.cardEnabled, {
                  shouldDirty: true,
                  shouldValidate: true
                })
              }
              className="inline-flex items-center gap-3 self-start"
              aria-pressed={selectedOffer.cardEnabled}
            >
              <span
                className={cn(
                  "relative inline-flex h-8 w-14 rounded-full border transition",
                  selectedOffer.cardEnabled
                    ? "border-transparent bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_100%)]"
                    : "border-white/10 bg-white/[0.08]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-6 w-6 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.26)] transition",
                    selectedOffer.cardEnabled ? "left-[30px]" : "left-1"
                  )}
                />
              </span>
              <span className="text-sm font-semibold text-white">
                {selectedOffer.cardEnabled ? "Cartão habilitado" : "Cartão desabilitado"}
              </span>
            </button>
          </div>

          <div className={cn("mt-5 space-y-4", !selectedOffer.cardEnabled && "opacity-45")}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/78">Cobrança de juros</label>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { value: "buyer" as PlatformProductOfferCardInterestPayer, label: "Juros pagos pelo cliente" },
                  { value: "seller" as PlatformProductOfferCardInterestPayer, label: "Juros pagos pelo vendedor" }
                ].map((option) => {
                  const isSelected = selectedOffer.cardInterestPayer === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!selectedOffer.cardEnabled}
                      onClick={() =>
                        setValue(`offers.${selectedOfferIndex}.cardInterestPayer`, option.value, {
                          shouldDirty: true,
                          shouldValidate: true
                        })
                      }
                      className={cn(
                        "flex items-center gap-3 rounded-[20px] border px-4 py-4 text-left transition disabled:cursor-not-allowed",
                        isSelected
                          ? "border-[#8c52ff]/50 bg-[linear-gradient(180deg,rgba(140,82,255,0.16),rgba(140,82,255,0.06))] text-white"
                          : "border-white/10 bg-white/[0.03] text-white/56 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border transition",
                          isSelected ? "border-[#ff77c8] bg-[#ff77c8]/22" : "border-white/18 bg-transparent"
                        )}
                      >
                        <span className={cn("h-2.5 w-2.5 rounded-full transition", isSelected ? "bg-[#ff77c8]" : "bg-transparent")} />
                      </span>
                      <span className="text-sm font-semibold">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedOffer.cardEnabled}
              onClick={() =>
                setValue(
                  `offers.${selectedOfferIndex}.cardSmartInstallments`,
                  !selectedOffer.cardSmartInstallments,
                  { shouldDirty: true, shouldValidate: true }
                )
              }
              className="flex w-full items-start justify-between gap-4 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:bg-white/[0.05] disabled:cursor-not-allowed"
            >
              <div>
                <p className="text-sm font-semibold text-white">Permitir parcelamento inteligente?</p>
                <p className="mt-2 text-[12px] leading-5 text-white/40">
                  Use essa opção para simular uma composição de parcelas mais flexível no cartão.
                </p>
              </div>
              <span
                className={cn(
                  "relative mt-0.5 inline-flex h-7 w-12 rounded-full border transition",
                  selectedOffer.cardSmartInstallments
                    ? "border-transparent bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_100%)]"
                    : "border-white/10 bg-white/[0.08]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.26)] transition",
                    selectedOffer.cardSmartInstallments ? "left-[25px]" : "left-0.5"
                  )}
                />
              </span>
            </button>

            <button
              type="button"
              disabled={!selectedOffer.cardEnabled}
              onClick={() =>
                setValue(
                  `offers.${selectedOfferIndex}.cardSinglePaymentEnabled`,
                  !selectedOffer.cardSinglePaymentEnabled,
                  { shouldDirty: true, shouldValidate: true }
                )
              }
              className={cn(
                "flex w-full items-center gap-3 rounded-[20px] border px-4 py-4 text-left transition disabled:cursor-not-allowed",
                selectedOffer.cardSinglePaymentEnabled
                  ? "border-[#8c52ff]/28 bg-[linear-gradient(180deg,rgba(140,82,255,0.12),rgba(140,82,255,0.04))]"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-md border transition",
                  selectedOffer.cardSinglePaymentEnabled
                    ? "border-[#8c52ff]/40 bg-[#8c52ff]/24 text-white"
                    : "border-white/18 bg-transparent text-transparent"
                )}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-semibold text-white">
                {formatCurrency(Number(selectedOffer.price ?? 0))} (à vista)
              </span>
            </button>
          </div>
        </section>

        <section className="platform-surface rounded-[30px] p-5 lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h5 className="text-[1.05rem] font-semibold tracking-[-0.04em] text-white">Boleto bancário</h5>
              <p className="mt-2 text-[13px] leading-6 text-white/46">
                Ajuste o vencimento e o comportamento do boleto desta oferta.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setValue(`offers.${selectedOfferIndex}.boletoEnabled`, !selectedOffer.boletoEnabled, {
                  shouldDirty: true,
                  shouldValidate: true
                })
              }
              className="inline-flex items-center gap-3 self-start"
              aria-pressed={selectedOffer.boletoEnabled}
            >
              <span
                className={cn(
                  "relative inline-flex h-8 w-14 rounded-full border transition",
                  selectedOffer.boletoEnabled
                    ? "border-transparent bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_100%)]"
                    : "border-white/10 bg-white/[0.08]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-6 w-6 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.26)] transition",
                    selectedOffer.boletoEnabled ? "left-[30px]" : "left-1"
                  )}
                />
              </span>
              <span className="text-sm font-semibold text-white">
                {selectedOffer.boletoEnabled ? "Boleto habilitado" : "Boleto desabilitado"}
              </span>
            </button>
          </div>

          <div className={cn("mt-5 grid gap-4 md:grid-cols-2", !selectedOffer.boletoEnabled && "opacity-45")}>
            <PlatformSelect
              label="Vencimento em dias úteis"
              value={`${selectedOffer.boletoDueDays ?? 1}` as (typeof boletoDueDayOptions)[number]["value"]}
              options={boletoDueDayOptions.map((option) => ({
                value: option.value,
                label: option.label
              }))}
              onChange={(nextValue) =>
                setValue(`offers.${selectedOfferIndex}.boletoDueDays`, Number(nextValue), {
                  shouldDirty: true,
                  shouldValidate: true
                })
              }
              helperText="Defina em quantos dias úteis o boleto deve vencer."
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/78">Quantidade de dias após vencimento</label>
              <input
                type="number"
                min="1"
                step="1"
                disabled={!selectedOffer.boletoEnabled}
                className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="30"
                {...register(`offers.${selectedOfferIndex}.boletoAfterDueDays` as const, {
                  valueAsNumber: true
                })}
              />
              {selectedOfferErrors?.boletoAfterDueDays ? (
                <p className="text-xs text-[#ff9db1]">{selectedOfferErrors.boletoAfterDueDays.message}</p>
              ) : null}
            </div>

            <button
              type="button"
              disabled={!selectedOffer.boletoEnabled}
              onClick={() =>
                setValue(`offers.${selectedOfferIndex}.boletoInfinite`, !selectedOffer.boletoInfinite, {
                  shouldDirty: true,
                  shouldValidate: true
                })
              }
              className="flex w-full items-start justify-between gap-4 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:bg-white/[0.05] disabled:cursor-not-allowed md:col-span-2"
            >
              <div>
                <p className="text-sm font-semibold text-white">Habilitar boleto infinito?</p>
                <p className="mt-2 text-[12px] leading-5 text-white/40">
                  Mantém o boleto renovável dentro do período configurado após o vencimento.
                </p>
              </div>
              <span
                className={cn(
                  "relative mt-0.5 inline-flex h-7 w-12 rounded-full border transition",
                  selectedOffer.boletoInfinite
                    ? "border-transparent bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_100%)]"
                    : "border-white/10 bg-white/[0.08]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.26)] transition",
                    selectedOffer.boletoInfinite ? "left-[25px]" : "left-0.5"
                  )}
                />
              </span>
            </button>
          </div>
        </section>

        <section className="platform-surface rounded-[30px] p-5 lg:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h5 className="text-[1.05rem] font-semibold tracking-[-0.04em] text-white">Pix manual</h5>
                  <p className="mt-2 text-[13px] leading-6 text-white/46">
                    Pagamento instantâneo via QR Code ou código Pix.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setValue(`offers.${selectedOfferIndex}.pixManualEnabled`, !selectedOffer.pixManualEnabled, {
                      shouldDirty: true,
                      shouldValidate: true
                    })
                  }
                  className="inline-flex items-center gap-3 self-start"
                  aria-pressed={selectedOffer.pixManualEnabled}
                >
                  <span
                    className={cn(
                      "relative inline-flex h-8 w-14 rounded-full border transition",
                      selectedOffer.pixManualEnabled
                        ? "border-transparent bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_100%)]"
                        : "border-white/10 bg-white/[0.08]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-6 w-6 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.26)] transition",
                        selectedOffer.pixManualEnabled ? "left-[30px]" : "left-1"
                      )}
                    />
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h5 className="text-[1.05rem] font-semibold tracking-[-0.04em] text-white">
                    Descontos por método de pagamento
                  </h5>
                  <p className="mt-2 text-[13px] leading-6 text-white/46">
                    Habilite esta opção quando quiser diferenciar condições por cartão, boleto ou Pix.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setValue(
                      `offers.${selectedOfferIndex}.paymentMethodDiscountsEnabled`,
                      !selectedOffer.paymentMethodDiscountsEnabled,
                      { shouldDirty: true, shouldValidate: true }
                    )
                  }
                  className="inline-flex items-center gap-3 self-start"
                  aria-pressed={selectedOffer.paymentMethodDiscountsEnabled}
                >
                  <span
                    className={cn(
                      "relative inline-flex h-8 w-14 rounded-full border transition",
                      selectedOffer.paymentMethodDiscountsEnabled
                        ? "border-transparent bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_100%)]"
                        : "border-white/10 bg-white/[0.08]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-6 w-6 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.26)] transition",
                        selectedOffer.paymentMethodDiscountsEnabled ? "left-[30px]" : "left-1"
                      )}
                    />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="truncate text-[1.65rem] font-semibold tracking-[-0.07em] text-white">
          {previewProduct.name}
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f5b942]/40 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#f5c14d] transition hover:bg-[#f5b942]/8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para produtos
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="platform-surface rounded-[30px] p-5 lg:p-6 xl:sticky xl:top-5">
          <nav className="space-y-2">
            {editorSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[22px] border px-4 py-3.5 text-left transition",
                    isActive
                      ? "border-white/10 bg-white/[0.06] text-white shadow-[inset_3px_0_0_0_rgba(255,255,255,0.9)]"
                      : "border-transparent bg-transparent text-white/56 hover:border-white/8 hover:bg-white/[0.03] hover:text-white/82"
                  )}
                >
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-[14px]", isActive ? "bg-white/[0.08] text-white" : "bg-white/[0.04] text-white/54")}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="text-[0.96rem] font-semibold tracking-[-0.03em]">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {activeSection === "dashboard" ? (
            <div className="space-y-5" data-section="dashboard">
                    <section className="platform-surface overflow-hidden rounded-[30px] p-0">
                      <div className="border-b border-white/8 px-5 py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-white/34">Receita dos ultimos meses</p>
                            <h3 className="mt-2 text-[1.2rem] font-semibold tracking-[-0.05em] text-white">Pulso comercial do produto</h3>
                          </div>
                          <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/54">
                            {primaryOffer ? billingCycleLabels[primaryOffer.billingCycle] : "Oferta principal"}
                          </div>
                        </div>
                      </div>

                      <div className="px-5 py-5">
                        <div className="rounded-[26px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-8 text-center">
                          <p className="text-sm font-semibold text-white">Sem historico real registrado ainda.</p>
                          <p className="mt-2 text-[13px] leading-6 text-white/46">
                            O grafico desta area sera preenchido quando houver eventos reais de venda persistidos para este produto.
                          </p>
                          <div className="mt-5 flex flex-wrap justify-center gap-2">
                            {trend.map((point) => (
                              <span
                                key={point.label}
                                className="inline-flex rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/42"
                              >
                                {point.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <article className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/[0.06] text-[#79c4ff]">
                            <CircleDollarSign className="h-5 w-5" />
                          </div>
                          <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-white/34">Receita registrada</p>
                          <p className="mt-2 text-[1.3rem] font-semibold tracking-[-0.05em] text-white">{formatCurrency(revenueEstimate)}</p>
                        </article>

                        <article className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/[0.06] text-[#8ce99a]">
                            <PackageCheck className="h-5 w-5" />
                          </div>
                          <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-white/34">Vendas</p>
                          <p className="mt-2 text-[1.3rem] font-semibold tracking-[-0.05em] text-white">{previewProduct.sales}</p>
                        </article>

                        <article className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/[0.06] text-[#f5c463]">
                            <Boxes className="h-5 w-5" />
                          </div>
                          <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-white/34">Estoque</p>
                          <p className="mt-2 text-[1.3rem] font-semibold tracking-[-0.05em] text-white">{previewProduct.stock}</p>
                        </article>
                      </div>

                      <aside className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(21,25,35,0.98),rgba(12,15,24,0.99))] p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-white/34">Ultimas vendas</p>
                        <div className="mt-4 space-y-3">
                          {recentSales.length === 0 ? (
                            <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-center">
                              <p className="text-sm font-semibold text-white">Nenhuma venda real registrada.</p>
                              <p className="mt-2 text-[12px] leading-5 text-white/44">
                                Assim que a operacao começar a receber pedidos reais, eles aparecerao aqui.
                              </p>
                            </div>
                          ) : null}
                          {recentSales.map((sale) => (
                            <div key={sale.id} className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-white">{sale.customer}</p>
                                  <p className="mt-1 text-[12px] text-white/40">{sale.when}</p>
                                </div>
                                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", sale.status === "Pago" ? "bg-white text-[#11161f]" : "bg-white/[0.08] text-white/76")}>
                                  {sale.status}
                                </span>
                              </div>
                              <p className="mt-3 text-[15px] font-semibold text-white">{formatCurrency(sale.amount)}</p>
                            </div>
                          ))}
                        </div>
                      </aside>
                    </section>
                  </div>
                ) : null}
                {activeSection === "details" ? (
                  <div className="space-y-5" data-section="details">
                    <section>
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:justify-start">
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
                        </div>

                        <input type="hidden" {...register("imageUrl")} />
                        <input type="hidden" {...register("productType")} />
                        <input type="hidden" {...register("category")} />
                        <input type="hidden" {...register("refundWindow")} />

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-medium text-white/78">Nome do produto</label>
                            <input
                              className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
                              placeholder="Ex.: Intervencao"
                              {...register("name")}
                            />
                            {formState.errors.name ? <p className="text-xs text-[#ff9db1]">{formState.errors.name.message}</p> : null}
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
                                  : "Ative a opção acima quando a página estiver pronta para receber a URL."}
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
                            <PlatformSelect
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
                            <PlatformSelect
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
                              placeholder="INTERVENÇÃO"
                              {...register("invoiceStatementDescriptor")}
                            />
                            {formState.errors.invoiceStatementDescriptor ? (
                              <p className="text-xs text-[#ff9db1]">{formState.errors.invoiceStatementDescriptor.message}</p>
                            ) : (
                              <p className="text-[11px] leading-5 text-white/34">Caso informada, aparecerá na fatura com o limite padrão do emissor.</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <PlatformSelect
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
                            {formState.errors.supportEmail ? <p className="text-xs text-[#ff9db1]">{formState.errors.supportEmail.message}</p> : null}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-white/78">Contato do suporte</label>
                            <input
                              className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10"
                              placeholder="(11) 99999-9999"
                              {...register("supportPhone")}
                            />
                            {formState.errors.supportPhone ? <p className="text-xs text-[#ff9db1]">{formState.errors.supportPhone.message}</p> : null}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : null}
                {activeSection === "offers" ? (
                  <div className="space-y-6" data-section="offers">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-[1.2rem] font-semibold tracking-[-0.05em] text-white">Ofertas do produto</h3>
                        <p className="mt-2 text-[13px] leading-6 text-white/46">
                          Crie planos, variações e condições comerciais no mesmo visual premium da plataforma.
                        </p>
                      </div>

                      {offerViewMode === "list" ? (
                        <button
                          type="button"
                          onClick={appendOffer}
                          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[linear-gradient(135deg,#8c52ff_0%,#c4a6ff_58%,#ffffff_100%)] px-5 py-2.5 text-sm font-semibold text-[#171a24] transition hover:brightness-105"
                        >
                          <Plus className="h-4 w-4" />
                          Cadastrar nova oferta
                        </button>
                      ) : null}
                    </div>

                    {offerViewMode === "editor" && selectedOffer && selectedOfferIndex != null ? (
                      renderOfferEditor()
                    ) : offersFieldArray.fields.length === 0 ? (
                      <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,22,31,0.82),rgba(10,13,19,0.9))] p-4 lg:p-6">
                        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-white/8 bg-[rgba(12,15,22,0.72)] px-6 text-center">
                          <div className="relative flex h-28 w-28 items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(140,82,255,0.22),transparent_70%)] blur-[12px]" />
                            <div className="absolute -left-1 top-7 h-4 w-20 rounded-full bg-white/90" />
                            <div className="absolute -right-2 top-2 h-4 w-16 rounded-full bg-white/90" />
                            <div className="absolute -left-4 bottom-5 h-4 w-24 rounded-full bg-white/90" />
                            <div className="absolute right-1 bottom-1 h-4 w-12 rounded-full bg-white/90" />
                            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-[22px] border border-[#8c52ff]/45 bg-[linear-gradient(180deg,rgba(140,82,255,0.12),rgba(140,82,255,0.04))] text-[#c4a6ff]">
                              <CircleDollarSign className="h-10 w-10" />
                            </div>
                          </div>

                          <h4 className="mt-10 text-[1.9rem] font-semibold tracking-[-0.06em] text-white">
                            Vamos começar?
                          </h4>
                          <p className="mt-3 max-w-[460px] text-[15px] leading-7 text-white/60">
                            Você ainda não inseriu nenhuma oferta aqui.
                          </p>

                          <button
                            type="button"
                            onClick={appendOffer}
                            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8c52ff_0%,#6d3dff_100%)] px-6 py-3 text-base font-semibold text-white shadow-[0_20px_45px_rgba(92,52,255,0.22)] transition hover:brightness-110"
                          >
                            <Plus className="h-4.5 w-4.5" />
                            Cadastrar novo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="hidden xl:grid xl:grid-cols-[120px_minmax(0,1.7fr)_130px_160px_150px_130px_320px] xl:items-center xl:px-4">
                          {["Código", "Nome", "Preço", "Quantidade de itens", "Atualizado em", "Ativo?", "Ações"].map((label) => (
                            <p key={label} className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/28">
                              {label}
                            </p>
                          ))}
                        </div>

                        <div className="grid gap-3">
                          {offersFieldArray.fields.map((field, index: number) => {
                            const currentOffer: ProductEditorInput["offers"][number] | undefined =
                              offersValues[index];
                            const currentOfferBillingCycle =
                              (currentOffer?.billingCycle ?? "one_time") as PlatformProductOfferBillingCycle;
                            const offerId = currentOffer?.id || `${product.id}-offer-${index + 1}`;
                            const offerCode = buildOfferCode(product.id, offerId, index);
                            const isSelected = selectedOfferIndex === index;
                            const isPrimary = currentOffer?.isPrimary;
                            const isOfferActive = currentOffer?.active ?? true;
                            const checkoutUrl = buildOfferCheckoutUrl(previewProduct.salesPageUrl, offerId);

                            return (
                              <article
                                key={field.fieldKey}
                                className={cn(
                                  "rounded-[28px] border bg-[linear-gradient(180deg,rgba(18,22,31,0.84),rgba(10,13,19,0.92))] px-4 py-4 transition lg:px-5",
                                  isSelected
                                    ? "border-[#8c52ff]/50 shadow-[0_24px_60px_rgba(92,52,255,0.14)]"
                                    : "border-white/8 hover:border-white/12"
                                )}
                              >
                                <input type="hidden" {...register(`offers.${index}.billingCycle` as const)} />
                                <input type="hidden" {...register(`offers.${index}.active` as const)} />

                                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[120px_minmax(0,1.7fr)_130px_160px_150px_130px_320px] xl:items-center">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/28 xl:hidden">Código</p>
                                    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/78">
                                      {offerCode}
                                    </span>
                                  </div>

                                  <div className="min-w-0 space-y-1">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/28 xl:hidden">Nome</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="truncate text-base font-semibold text-white">
                                        {currentOffer?.title?.trim() || `Oferta ${index + 1}`}
                                      </p>
                                      {isPrimary ? (
                                        <span className="inline-flex rounded-full bg-[linear-gradient(135deg,#8c52ff_0%,#c4a6ff_58%,#ffffff_100%)] px-2.5 py-1 text-[11px] font-semibold text-[#171a24]">
                                          Principal
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="truncate text-sm text-white/46">
                                      {currentOffer?.description?.trim() || billingCycleLabels[currentOfferBillingCycle]}
                                    </p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/28 xl:hidden">Preço</p>
                                    <p className="text-sm font-semibold text-white">
                                      {formatCurrency(Number(currentOffer?.price ?? 0))}
                                    </p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/28 xl:hidden">Quantidade de itens</p>
                                    <p className="text-sm text-white/72">
                                      {currentOffer?.itemCount ?? 1} {(currentOffer?.itemCount ?? 1) === 1 ? "item" : "itens"}
                                    </p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/28 xl:hidden">Atualizado em</p>
                                    <p className="text-sm text-white/72">{formatUpdatedAt(previewProduct.updatedAt)}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/28 xl:hidden">Ativo?</p>
                                    <button
                                      type="button"
                                      onClick={() => toggleOfferActive(index)}
                                      className="inline-flex items-center gap-3"
                                      aria-pressed={isOfferActive}
                                    >
                                      <span
                                        className={cn(
                                          "relative inline-flex h-7 w-12 rounded-full border transition",
                                          isOfferActive
                                            ? "border-transparent bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_100%)]"
                                            : "border-white/10 bg-white/[0.08]"
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "absolute top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.26)] transition",
                                            isOfferActive ? "left-[25px]" : "left-0.5"
                                          )}
                                        />
                                      </span>
                                      <span className="text-sm font-medium text-white/72">
                                        {isOfferActive ? "Ativa" : "Inativa"}
                                      </span>
                                    </button>
                                  </div>

                                  <div className="flex flex-wrap gap-2 xl:justify-end">
                                    <button
                                      type="button"
                                      onClick={() => openOfferEditor(index)}
                                      className={cn(
                                        "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition",
                                        isSelected
                                          ? "border-[#8c52ff]/45 bg-[#8c52ff]/14 text-white"
                                          : "border-white/10 bg-white/[0.03] text-white/72 hover:bg-white/[0.05] hover:text-white"
                                      )}
                                    >
                                      <Pencil className="h-4 w-4" />
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void copyOfferCheckoutLink(index)}
                                      disabled={!checkoutUrl}
                                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/72 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      <Copy className="h-4 w-4" />
                                      Copiar link
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openOfferCheckout(index)}
                                      disabled={!checkoutUrl}
                                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/72 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Visualizar checkout
                                    </button>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>

                        {offersFeedback ? <p className="text-sm text-white/58">{offersFeedback}</p> : null}
                      </div>
                    )}
                  </div>
                ) : null}
                {activeSection === "coupons" ? (
                  <div className="space-y-5" data-section="coupons">
                    <section className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,22,31,0.98),rgba(10,13,19,0.98))] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-white/34">Cupons</p>
                          <h3 className="mt-2 text-[1.2rem] font-semibold tracking-[-0.05em] text-white">Campanhas promocionais e descontos</h3>
                          <p className="mt-2 text-[13px] leading-6 text-white/46">
                            Organize codigos promocionais com percentual ou valor fixo e escolha quais devem ficar ativos.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            couponsFieldArray.append({
                              code: "",
                              discountType: "percent",
                              discountValue: 10,
                              active: true,
                              note: ""
                            })
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/78 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar cupom
                        </button>
                      </div>

                      <div className="mt-5 grid gap-4">
                        {couponsFieldArray.fields.length === 0 ? (
                          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center text-white/46">
                            Nenhum cupom cadastrado ainda. Crie o primeiro para liberar campanhas promocionais.
                          </div>
                        ) : null}

                        {couponsFieldArray.fields.map((field, index: number) => (
                          <article key={field.fieldKey} className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
                            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/52">Codigo</label>
                                  <input className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white uppercase outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10" placeholder="TOPICS20" {...register(`coupons.${index}.code` as const)} />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/52">Tipo</label>
                                  <select className="h-12 w-full rounded-[18px] border border-white/10 bg-[#121722] px-4 text-white outline-none transition focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10" {...register(`coupons.${index}.discountType` as const)}>
                                    {Object.entries(discountTypeLabels).map(([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/52">Desconto</label>
                                  <input type="number" step="0.01" min="0" className="h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10" placeholder="10" {...register(`coupons.${index}.discountValue` as const, { valueAsNumber: true })} />
                                </div>

                                <div className="flex items-end gap-3">
                                  <label className="flex h-12 flex-1 items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 text-sm text-white/78">
                                    <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" {...register(`coupons.${index}.active` as const)} />
                                    Cupom ativo
                                  </label>
                                  <button type="button" onClick={() => couponsFieldArray.remove(index)} className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-transparent px-4 text-sm font-medium text-white/52 transition hover:bg-white/[0.05] hover:text-white">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                  <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/52">Observacao</label>
                                  <textarea rows={3} className="w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10" placeholder="Ex.: cupom para aquecimento da campanha de lancamento." {...register(`coupons.${index}.note` as const)} />
                                </div>
                              </div>

                              <div className="rounded-[22px] border border-white/8 bg-black/18 px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-white/[0.06] text-[#f5c463]">
                                    <Tag className="h-4.5 w-4.5" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-white">{watchedValues.coupons?.[index]?.code || "NOVOCUPOM"}</p>
                                    <p className="mt-1 text-[12px] text-white/42">{watchedValues.coupons?.[index]?.active ? "Ativo" : "Inativo"}</p>
                                  </div>
                                </div>
                                <p className="mt-4 text-[1.1rem] font-semibold text-white">
                                  {watchedValues.coupons?.[index]?.discountType === "fixed"
                                    ? formatCurrency(watchedValues.coupons?.[index]?.discountValue ?? 0)
                                    : `${watchedValues.coupons?.[index]?.discountValue ?? 0}%`}
                                </p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}

          <div className="platform-surface rounded-[28px] px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                <div className="min-h-[20px]">
                  {error ? <p className="text-sm text-[#ff9db1]">{error}</p> : null}
                  {successMessage ? <p className="text-sm text-[#7ee7ba]">{successMessage}</p> : null}
                  {!error && !successMessage ? <p className="text-sm text-white/38">Salve quando terminar de ajustar a area selecionada.</p> : null}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteValidationError(null);
                    setDeleteConfirmationValue("");
                    setIsDeleteOpen(true);
                  }}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ff5f7a]/30 bg-[#ff5f7a]/10 px-4 py-2.5 text-sm font-medium text-[#ffb5c0] transition hover:bg-[#ff5f7a]/16 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir produto
                </button>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-white/68 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Fechar editor
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8c52ff_0%,#c4a6ff_58%,#ffffff_100%)] px-5 py-2.5 text-sm font-semibold text-[#171a24] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  {isSubmitting ? "Salvando..." : "Salvar produto"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {isDeleteOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(5,8,14,0.78)] px-4 py-5 backdrop-blur-sm">
          <div className="w-full max-w-[560px] text-white sm:px-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[1.45rem] font-semibold tracking-[-0.05em] text-white">
                  Excluir produto
                </h3>
              </div>

              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-white/58 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-1.5">
              <input
                type="text"
                value={deleteConfirmationValue}
                onChange={(event) => {
                  setDeleteConfirmationValue(event.target.value);
                  if (deleteValidationError) {
                    setDeleteValidationError(null);
                  }
                }}
                disabled={isDeleting}
                placeholder={`Digite "${previewProduct.name}"`}
                className={cn(
                  "h-12 w-full rounded-[18px] border bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10 disabled:cursor-not-allowed disabled:opacity-60",
                  deleteValidationError ? "border-[#ff9db1]/70" : "border-white/10"
                )}
              />
              <p className="text-[12px] text-white/40">
                Digite: <span className="font-semibold text-white/74">{expectedDeleteConfirmation}</span>
              </p>
              {deleteValidationError ? (
                <p className="text-xs text-[#ff9db1]">{deleteValidationError}</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-sm font-medium text-white/68 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConfirmation()}
                disabled={!deleteConfirmationMatches || isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ef476f_0%,#ff8ea4_100%)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
