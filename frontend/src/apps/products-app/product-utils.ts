import { ApiError } from "@/lib/api";
import type { ProductEditorInput, ProductFormInput } from "@/schemas/product";
import type {
  PlatformProductCoupon,
  PlatformProductItem,
  PlatformProductOffer,
  PlatformProductRefundWindow,
  PlatformProductType
} from "@/types/platform";

export const productTabs = ["Todos", "Ativos", "Desativados"] as const;

export const metricAccentMap: Record<string, string> = {
  produtos: "from-[#7dd3fc]/24 via-[#38bdf8]/10 to-transparent",
  ativos: "from-[#34d399]/24 via-[#10b981]/10 to-transparent",
  desativados: "from-[#f59e0b]/20 via-[#f97316]/10 to-transparent",
  projetado: "from-[#c084fc]/24 via-[#8b5cf6]/10 to-transparent"
};

const productCoverPalettes = [
  { base: "#10051f", top: "#915eff", bottom: "#271145", glow: "#c5a7ff", accent: "#ff5ec4" },
  { base: "#071226", top: "#68abff", bottom: "#14244f", glow: "#9bd9ff", accent: "#7f5cff" },
  { base: "#091c18", top: "#4ce6bf", bottom: "#10382f", glow: "#8effe1", accent: "#62b9ff" },
  { base: "#1a0a12", top: "#ff9d3d", bottom: "#4f1822", glow: "#ffd6a1", accent: "#ff5f7a" }
] as const;

function hashValue(value: string) {
  return Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0);
}

function inferProductType(name: string, category: string): PlatformProductType {
  const fingerprint = `${name} ${category}`.toLowerCase();

  if (fingerprint.includes("assinatura")) {
    return "subscription";
  }

  if (fingerprint.includes("comunidade") || fingerprint.includes("membros")) {
    return "community";
  }

  if (fingerprint.includes("curso")) {
    return "course";
  }

  if (fingerprint.includes("mentoria")) {
    return "mentorship";
  }

  if (fingerprint.includes("template")) {
    return "template";
  }

  if (fingerprint.includes("evento") || fingerprint.includes("workshop")) {
    return "event";
  }

  if (fingerprint.includes("serv")) {
    return "service";
  }

  return "other";
}

function buildInvoiceStatementDescriptor(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 22);
}

function getSafeRefundWindow(
  value: PlatformProductItem["refundWindow"] | ProductEditorInput["refundWindow"] | undefined
): PlatformProductRefundWindow {
  return value === "14_days" || value === "21_days" || value === "30_days" ? value : "7_days";
}

export function ensurePrimaryOffer(offers: PlatformProductOffer[]): PlatformProductOffer[] {
  if (offers.length === 0) {
    return offers;
  }

  const primaryIndex = offers.findIndex((offer) => offer.isPrimary);
  const safeIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return offers.map((offer, index) => ({
    ...offer,
    isPrimary: index === safeIndex
  }));
}

export function buildDefaultCoupons(): PlatformProductCoupon[] {
  return [];
}

export function buildProductCover(product: PlatformProductItem) {
  if (product.imageUrl) {
    return product.imageUrl;
  }

  const palette = productCoverPalettes[hashValue(product.id) % productCoverPalettes.length];
  const seed = hashValue(product.id + product.name);
  const highlightX = 640 + (seed % 120);
  const highlightY = 170 + (seed % 90);
  const accentX = 250 + (seed % 160);
  const accentY = 980 - (seed % 120);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="1280" viewBox="0 0 960 1280" fill="none">
      <defs>
        <linearGradient id="bg" x1="120" y1="0" x2="860" y2="1220" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.top}"/>
          <stop offset="0.46" stop-color="${palette.bottom}"/>
          <stop offset="1" stop-color="${palette.base}"/>
        </linearGradient>
        <radialGradient id="glowMain" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${highlightX} ${highlightY}) rotate(132) scale(520 420)">
          <stop stop-color="${palette.glow}" stop-opacity="0.95"/>
          <stop offset="1" stop-color="${palette.glow}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glowAccent" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${accentX} ${accentY}) rotate(90) scale(360 300)">
          <stop stop-color="${palette.accent}" stop-opacity="0.42"/>
          <stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="glass" x1="168" y1="180" x2="684" y2="1090" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.22"/>
          <stop offset="0.34" stop-color="white" stop-opacity="0.08"/>
          <stop offset="1" stop-color="white" stop-opacity="0"/>
        </linearGradient>
        <filter id="blurSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="42"/>
        </filter>
        <filter id="blurLarge" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="88"/>
        </filter>
      </defs>
      <rect width="960" height="1280" rx="64" fill="${palette.base}"/>
      <rect width="960" height="1280" rx="64" fill="url(#bg)"/>
      <rect width="960" height="1280" rx="64" fill="url(#glowMain)"/>
      <rect width="960" height="1280" rx="64" fill="url(#glowAccent)"/>
      <ellipse cx="${highlightX}" cy="${highlightY}" rx="156" ry="134" fill="white" fill-opacity="0.18" filter="url(#blurSoft)"/>
      <ellipse cx="${accentX}" cy="${accentY}" rx="164" ry="128" fill="${palette.accent}" fill-opacity="0.18" filter="url(#blurLarge)"/>
      <path d="M204 1138C224 904 306 682 458 540C554 450 674 386 790 370C788 566 754 752 668 904C600 1022 486 1130 318 1210L204 1138Z" fill="#04030D" fill-opacity="0.46"/>
      <path d="M242 1086C250 888 326 720 458 604C538 534 630 494 716 484C720 638 696 776 624 900C558 1016 460 1100 320 1166L242 1086Z" fill="url(#glass)" fill-opacity="0.44"/>
      <circle cx="304" cy="876" r="122" fill="${palette.accent}" fill-opacity="0.12" filter="url(#blurLarge)"/>
      <circle cx="694" cy="298" r="84" fill="${palette.glow}" fill-opacity="0.18" filter="url(#blurSoft)"/>
      <path d="M0 0H960V1280H0V0Z" fill="url(#bg)" fill-opacity="0.08"/>
      <rect x="38" y="38" width="884" height="1204" rx="44" stroke="white" stroke-opacity="0.08"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function createDraftProduct(values?: Partial<ProductFormInput>): PlatformProductItem {
  const draft = {
    id: "draft-product",
    name: values?.name || "Novo produto",
    imageUrl: values?.imageUrl || null,
    category: values?.category || "Tecnologia",
    price: values?.price || 0
  };

  return {
    ...draft,
    description: `Descricao inicial para ${draft.name.toLowerCase()}.`,
    salesPageUrl: "",
    hasSalesPage: false,
    productType: inferProductType(draft.name, draft.category),
    invoiceStatementDescriptor: buildInvoiceStatementDescriptor(draft.name),
    refundWindow: "7_days",
    supportEmail: "",
    supportPhone: "",
    isActive: false,
    sales: 0,
    stock: 999,
    offers: [],
    coupons: buildDefaultCoupons(),
    updatedAt: new Date().toISOString()
  };
}

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export function formatCount(value: number) {
  return value.toLocaleString("pt-BR");
}

export function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Atualizado agora";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return fallback;
}

export function getProductDefaults(product?: PlatformProductItem): ProductFormInput {
  return {
    name: product?.name ?? "",
    category: product?.category ?? "",
    price: product?.price ?? 0,
    imageUrl: product?.imageUrl ?? undefined
  };
}

export function getProductEditorDefaults(product: PlatformProductItem): ProductEditorInput {
  return {
    name: product.name,
    category: product.category,
    description: product.description ?? "",
    salesPageUrl: product.salesPageUrl ?? "",
    hasSalesPage: product.hasSalesPage ?? Boolean(product.salesPageUrl),
    productType: product.productType ?? inferProductType(product.name, product.category),
    invoiceStatementDescriptor:
      product.invoiceStatementDescriptor || buildInvoiceStatementDescriptor(product.name),
    refundWindow: getSafeRefundWindow(product.refundWindow),
    supportEmail: product.supportEmail ?? "",
    supportPhone: product.supportPhone ?? "",
    isActive: product.isActive,
    price: product.price,
    stock: product.stock,
    imageUrl: product.imageUrl ?? undefined,
    offers: ensurePrimaryOffer(product.offers ?? []),
    coupons: product.coupons ?? buildDefaultCoupons()
  };
}

export function mergeProductWithEditorValues(
  product: PlatformProductItem,
  values: ProductEditorInput
): PlatformProductItem {
  return {
    ...product,
    name: values.name,
    category: values.category,
    description: values.description,
    salesPageUrl: values.hasSalesPage ? values.salesPageUrl || null : null,
    hasSalesPage: values.hasSalesPage,
    productType: values.productType,
    invoiceStatementDescriptor: values.invoiceStatementDescriptor,
    refundWindow: getSafeRefundWindow(values.refundWindow),
    supportEmail: values.supportEmail,
    supportPhone: values.supportPhone,
    isActive: values.isActive,
    price: values.price,
    stock: values.stock,
    imageUrl: values.imageUrl ?? null,
    offers: ensurePrimaryOffer(
      values.offers.map((offer, index) => ({
        ...offer,
        imageUrl: offer.imageUrl ?? null,
        id: offer.id || `${product.id}-offer-${index + 1}`
      }))
    ),
    coupons: values.coupons.map((coupon, index) => ({
      ...coupon,
      id: coupon.id || `${product.id}-coupon-${index + 1}`,
      code: coupon.code.trim().toUpperCase()
    }))
  };
}
