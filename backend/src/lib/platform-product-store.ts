import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { AppError } from "../utils/app-error";

export type PlatformProductOfferBillingCycle = "one_time" | "monthly" | "annual";
export type PlatformProductOfferCardInterestPayer = "buyer" | "seller";
export type PlatformProductCouponDiscountType = "percent" | "fixed";
export type PlatformProductType =
  | "course"
  | "community"
  | "mentorship"
  | "template"
  | "service"
  | "event"
  | "subscription"
  | "other";
export type PlatformProductRefundWindow = "7_days" | "14_days" | "21_days" | "30_days";

export interface PlatformProductOfferRecord {
  id: string;
  title: string;
  description: string;
  checkoutDescription: string;
  imageUrl: string | null;
  price: number;
  anchorPrice?: number;
  itemCount: number;
  billingCycle: PlatformProductOfferBillingCycle;
  isFree: boolean;
  passFixedFeeToBuyer: boolean;
  cardEnabled: boolean;
  cardInterestPayer: PlatformProductOfferCardInterestPayer;
  cardSmartInstallments: boolean;
  cardSinglePaymentEnabled: boolean;
  boletoEnabled: boolean;
  boletoDueDays: number;
  boletoInfinite: boolean;
  boletoAfterDueDays: number;
  pixManualEnabled: boolean;
  paymentMethodDiscountsEnabled: boolean;
  active: boolean;
  isPrimary: boolean;
}

export interface PlatformProductCouponRecord {
  id: string;
  code: string;
  discountType: PlatformProductCouponDiscountType;
  discountValue: number;
  active: boolean;
  note: string;
}

export type PlatformProductOfferInput = Omit<PlatformProductOfferRecord, "id"> & { id?: string };
export type PlatformProductCouponInput = Omit<PlatformProductCouponRecord, "id"> & { id?: string };

export interface PlatformProductRecord {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string;
  description: string;
  salesPageUrl: string | null;
  hasSalesPage: boolean;
  productType: PlatformProductType;
  invoiceStatementDescriptor: string;
  refundWindow: PlatformProductRefundWindow;
  supportEmail: string;
  supportPhone: string;
  price: number;
  sales: number;
  stock: number;
  isActive: boolean;
  offers: PlatformProductOfferRecord[];
  coupons: PlatformProductCouponRecord[];
  updatedAt: string;
}

interface PlatformProductStoreData {
  items: PlatformProductRecord[];
}

const platformProductsFilePath = path.join(process.cwd(), ".data", "platform-products.json");

const defaultOfferSettings = {
  checkoutDescription: "",
  imageUrl: null,
  anchorPrice: undefined,
  isFree: false,
  passFixedFeeToBuyer: false,
  cardEnabled: true,
  cardInterestPayer: "buyer" as const,
  cardSmartInstallments: false,
  cardSinglePaymentEnabled: true,
  boletoEnabled: true,
  boletoDueDays: 1,
  boletoInfinite: true,
  boletoAfterDueDays: 30,
  pixManualEnabled: true,
  paymentMethodDiscountsEnabled: false,
  active: true
};

const defaultPlatformProducts: PlatformProductRecord[] = [
  {
    id: "prod-001",
    name: "Assinatura TOPICS Prime",
    imageUrl: null,
    category: "Membros",
    description:
      "Comunidade premium com encontros, materiais estrategicos e area fechada para membros recorrentes.",
    salesPageUrl: "https://topicspay.com/produtos/topics-prime",
    hasSalesPage: true,
    productType: "subscription",
    invoiceStatementDescriptor: "TOPICS PRIME",
    refundWindow: "7_days",
    supportEmail: "suporte@topicspay.com",
    supportPhone: "(11) 4000-1001",
    price: 129.9,
    sales: 148,
    stock: 999,
    isActive: true,
    offers: [
      {
        id: "prod-001-offer-1",
        title: "Plano mensal",
        description: "Acesso completo com renovacao mensal e comunidade privada.",
        ...defaultOfferSettings,
        price: 129.9,
        itemCount: 1,
        billingCycle: "monthly",
        active: true,
        isPrimary: true
      },
      {
        id: "prod-001-offer-2",
        title: "Plano anual",
        description: "Doze meses com desconto e materiais exclusivos liberados no onboarding.",
        ...defaultOfferSettings,
        price: 1199,
        itemCount: 1,
        billingCycle: "annual",
        active: true,
        isPrimary: false
      }
    ],
    coupons: [
      {
        id: "prod-001-coupon-1",
        code: "TOPICS15",
        discountType: "percent",
        discountValue: 15,
        active: true,
        note: "Cupom de boas-vindas para a primeira assinatura."
      }
    ],
    updatedAt: "2026-04-04T09:14:00.000Z"
  },
  {
    id: "prod-002",
    name: "Mentoria Express",
    imageUrl: null,
    category: "Servicos",
    description:
      "Sessao individual com foco em destravar operacao, oferta e posicionamento comercial em poucos dias.",
    salesPageUrl: "https://topicspay.com/produtos/mentoria-express",
    hasSalesPage: true,
    productType: "mentorship",
    invoiceStatementDescriptor: "MENTORIA EXPRESS",
    refundWindow: "7_days",
    supportEmail: "suporte@topicspay.com",
    supportPhone: "(11) 4000-1002",
    price: 890,
    sales: 32,
    stock: 18,
    isActive: true,
    offers: [
      {
        id: "prod-002-offer-1",
        title: "Sessao avulsa",
        description: "Mentoria individual de alta intensidade com plano de acao personalizado.",
        ...defaultOfferSettings,
        price: 890,
        itemCount: 1,
        billingCycle: "one_time",
        active: true,
        isPrimary: true
      }
    ],
    coupons: [
      {
        id: "prod-002-coupon-1",
        code: "EXPRESS100",
        discountType: "fixed",
        discountValue: 100,
        active: false,
        note: "Cupom sazonal para reativacao de leads mornos."
      }
    ],
    updatedAt: "2026-04-03T21:03:00.000Z"
  },
  {
    id: "prod-003",
    name: "Template TOPICS Pay",
    imageUrl: null,
    category: "Digital",
    description:
      "Kit digital pronto para acelerar a estrutura visual da operacao com paginas, anuncios e componentes base.",
    salesPageUrl: "https://topicspay.com/produtos/template-topics-pay",
    hasSalesPage: true,
    productType: "template",
    invoiceStatementDescriptor: "TEMPLATE TOPICS PAY",
    refundWindow: "7_days",
    supportEmail: "suporte@topicspay.com",
    supportPhone: "(11) 4000-1003",
    price: 67,
    sales: 0,
    stock: 999,
    isActive: false,
    offers: [
      {
        id: "prod-003-offer-1",
        title: "Compra unica",
        description: "Download imediato com atualizacoes do pacote base por tempo limitado.",
        ...defaultOfferSettings,
        price: 67,
        itemCount: 1,
        billingCycle: "one_time",
        active: true,
        isPrimary: true
      }
    ],
    coupons: [],
    updatedAt: "2026-04-03T13:46:00.000Z"
  },
  {
    id: "prod-004",
    name: "Workshop Premium",
    imageUrl: null,
    category: "Eventos",
    description:
      "Treinamento intensivo ao vivo com materiais, gravacao e acompanhamento rapido no pos-evento.",
    salesPageUrl: "https://topicspay.com/produtos/workshop-premium",
    hasSalesPage: true,
    productType: "event",
    invoiceStatementDescriptor: "WORKSHOP PREMIUM",
    refundWindow: "7_days",
    supportEmail: "suporte@topicspay.com",
    supportPhone: "(11) 4000-1004",
    price: 349,
    sales: 12,
    stock: 40,
    isActive: false,
    offers: [
      {
        id: "prod-004-offer-1",
        ...defaultOfferSettings,
        title: "Ingresso padrão",
        description: "Acesso ao encontro ao vivo com material de apoio e replay liberado.",
        price: 349,
        itemCount: 1,
        billingCycle: "one_time",
        active: true,
        isPrimary: true
      },
      {
        id: "prod-004-offer-2",
        ...defaultOfferSettings,
        title: "Ingresso VIP",
        description: "Inclui replay estendido, templates extras e grupo de acompanhamento.",
        price: 549,
        itemCount: 1,
        billingCycle: "one_time",
        active: true,
        isPrimary: false
      }
    ],
    coupons: [
      {
        id: "prod-004-coupon-1",
        code: "VIP25",
        discountType: "percent",
        discountValue: 25,
        active: true,
        note: "Cupom para lote especial de parceiros."
      }
    ],
    updatedAt: "2026-03-31T18:22:00.000Z"
  }
];

function buildDefaultProductDescription(item: {
  name: string;
  category: string;
}) {
  return `${item.name} com entrega ${item.category.toLowerCase()} e estrutura pronta para vender com a TOPICS Pay.`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildDefaultSalesPageUrl(item: {
  name: string;
}) {
  return `https://topicspay.com/produtos/${slugify(item.name) || "produto"}`;
}

function inferProductType(item: {
  category: string;
  name: string;
}): PlatformProductType {
  const fingerprint = `${item.name} ${item.category}`.toLowerCase();

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

function buildDefaultOffer(item: {
  id: string;
  name: string;
  category: string;
  price: number;
}): PlatformProductOfferRecord {
  return {
    id: `${item.id}-offer-1`,
    title: "Oferta principal",
    description: `Condicao principal para ${item.name.toLowerCase()} na categoria ${item.category.toLowerCase()}.`,
    ...defaultOfferSettings,
    price: item.price,
    itemCount: 1,
    billingCycle: "one_time",
    isPrimary: true
  };
}

function normalizeOfferRecord(
  product: { id: string; name: string; category: string; price: number },
  offer: Partial<PlatformProductOfferRecord>,
  index: number
): PlatformProductOfferRecord {
  return {
    id: offer.id || `${product.id}-offer-${index + 1}`,
    title: offer.title?.trim() || `Oferta ${index + 1}`,
    description: offer.description?.trim() || `Condicao comercial para ${product.name.toLowerCase()}.`,
    checkoutDescription: offer.checkoutDescription?.trim() || "",
    imageUrl: typeof offer.imageUrl === "string" ? offer.imageUrl : null,
    price: typeof offer.price === "number" && Number.isFinite(offer.price) ? Math.max(offer.price, 0) : product.price,
    anchorPrice:
      typeof offer.anchorPrice === "number" && Number.isFinite(offer.anchorPrice)
        ? Math.max(offer.anchorPrice, 0)
        : undefined,
    itemCount:
      typeof offer.itemCount === "number" && Number.isFinite(offer.itemCount)
        ? Math.max(Math.trunc(offer.itemCount), 0)
        : 1,
    billingCycle:
      offer.billingCycle === "monthly" || offer.billingCycle === "annual" ? offer.billingCycle : "one_time",
    isFree: Boolean(offer.isFree),
    passFixedFeeToBuyer: Boolean(offer.passFixedFeeToBuyer),
    cardEnabled: offer.cardEnabled ?? true,
    cardInterestPayer: offer.cardInterestPayer === "seller" ? "seller" : "buyer",
    cardSmartInstallments: Boolean(offer.cardSmartInstallments),
    cardSinglePaymentEnabled: offer.cardSinglePaymentEnabled ?? true,
    boletoEnabled: offer.boletoEnabled ?? true,
    boletoDueDays:
      typeof offer.boletoDueDays === "number" && Number.isFinite(offer.boletoDueDays)
        ? Math.max(Math.trunc(offer.boletoDueDays), 1)
        : 1,
    boletoInfinite: offer.boletoInfinite ?? true,
    boletoAfterDueDays:
      typeof offer.boletoAfterDueDays === "number" && Number.isFinite(offer.boletoAfterDueDays)
        ? Math.max(Math.trunc(offer.boletoAfterDueDays), 1)
        : 30,
    pixManualEnabled: offer.pixManualEnabled ?? true,
    paymentMethodDiscountsEnabled: Boolean(offer.paymentMethodDiscountsEnabled),
    active: offer.active ?? true,
    isPrimary: Boolean(offer.isPrimary)
  };
}

function normalizeCouponRecord(
  productId: string,
  coupon: Partial<PlatformProductCouponRecord>,
  index: number
): PlatformProductCouponRecord {
  return {
    id: coupon.id || `${productId}-coupon-${index + 1}`,
    code: coupon.code?.trim().toUpperCase() || `TOPICS${index + 1}`,
    discountType: coupon.discountType === "fixed" ? "fixed" : "percent",
    discountValue:
      typeof coupon.discountValue === "number" && Number.isFinite(coupon.discountValue)
        ? Math.max(coupon.discountValue, 0)
        : 10,
    active: coupon.active ?? true,
    note: coupon.note?.trim() || ""
  };
}

function normalizeProductRecord(
  item: Omit<Partial<PlatformProductRecord>, "offers" | "coupons"> &
    Pick<PlatformProductRecord, "id" | "name" | "category"> & {
      offers?: PlatformProductOfferInput[];
      coupons?: PlatformProductCouponInput[];
    }
) {
  const normalized: PlatformProductRecord = {
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl ?? null,
    category: item.category,
    description: item.description?.trim() || buildDefaultProductDescription(item),
    hasSalesPage: item.hasSalesPage ?? Boolean(item.salesPageUrl?.trim()),
    salesPageUrl: null,
    productType:
      item.productType === "course" ||
      item.productType === "community" ||
      item.productType === "mentorship" ||
      item.productType === "template" ||
      item.productType === "service" ||
      item.productType === "event" ||
      item.productType === "subscription"
        ? item.productType
        : inferProductType(item),
    invoiceStatementDescriptor:
      item.invoiceStatementDescriptor?.trim() || buildInvoiceStatementDescriptor(item.name),
    refundWindow:
      item.refundWindow === "14_days" ||
      item.refundWindow === "21_days" ||
      item.refundWindow === "30_days"
        ? item.refundWindow
        : "7_days",
    supportEmail: item.supportEmail?.trim() || "",
    supportPhone: item.supportPhone?.trim() || "",
    price: typeof item.price === "number" && Number.isFinite(item.price) ? Math.max(item.price, 0) : 0,
    sales: typeof item.sales === "number" && Number.isFinite(item.sales) ? Math.max(item.sales, 0) : 0,
    stock: typeof item.stock === "number" && Number.isFinite(item.stock) ? Math.max(item.stock, 0) : 999,
    isActive: Boolean(item.isActive),
    offers: [],
    coupons: Array.isArray(item.coupons)
      ? item.coupons.map((coupon, index) => normalizeCouponRecord(item.id, coupon, index))
      : [],
    updatedAt: item.updatedAt || new Date().toISOString()
  };

  normalized.salesPageUrl = normalized.hasSalesPage
    ? item.salesPageUrl?.trim() || buildDefaultSalesPageUrl(item)
    : null;

  const sourceOffers = Array.isArray(item.offers) ? item.offers : [buildDefaultOffer(normalized)];

  const normalizedOffers = sourceOffers.map((offer, index) =>
    normalizeOfferRecord(normalized, offer, index)
  );

  if (normalizedOffers.length > 0 && !normalizedOffers.some((offer) => offer.isPrimary)) {
    normalizedOffers[0] = {
      ...normalizedOffers[0],
      isPrimary: true
    };
  }

  if (normalizedOffers.length === 0) {
    normalized.offers = [];
    return normalized;
  }

  normalized.offers = normalizedOffers.map((offer, index) => ({
    ...offer,
    isPrimary: index === normalizedOffers.findIndex((item) => item.isPrimary)
  }));

  return normalized;
}

async function readPlatformProductsStore(): Promise<PlatformProductStoreData> {
  try {
    const raw = await readFile(platformProductsFilePath, "utf8");
    const parsed = JSON.parse(raw) as PlatformProductStoreData;

    return {
      items: Array.isArray(parsed.items)
        ? parsed.items
            .filter((item): item is PlatformProductRecord => Boolean(item?.id && item?.name && item?.category))
            .map((item) => normalizeProductRecord(item))
        : []
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        items: []
      };
    }

    throw error;
  }
}

async function writePlatformProductsStore(data: PlatformProductStoreData) {
  await mkdir(path.dirname(platformProductsFilePath), { recursive: true });
  await writeFile(platformProductsFilePath, JSON.stringify(data, null, 2), "utf8");
}

async function getPlatformProductsStore() {
  const data = await readPlatformProductsStore();

  if (data.items.length > 0) {
    return data;
  }

  const seededData = {
    items: defaultPlatformProducts
  };

  await writePlatformProductsStore(seededData);
  return seededData;
}

async function mutatePlatformProductsStore<T>(
  mutator: (data: PlatformProductStoreData) => Promise<T> | T
) {
  const data = await getPlatformProductsStore();
  const result = await mutator(data);
  await writePlatformProductsStore(data);
  return result;
}

function buildProductId() {
  return `prod-${randomUUID().slice(0, 8)}`;
}

export async function listPlatformProductRecords() {
  const data = await getPlatformProductsStore();
  return data.items;
}

export async function createPlatformProductRecord(input: {
  name: string;
  imageUrl: string | null;
  category: string;
  description?: string;
  salesPageUrl?: string;
  hasSalesPage?: boolean;
  productType?: PlatformProductType;
  invoiceStatementDescriptor?: string;
  refundWindow?: PlatformProductRefundWindow;
  supportEmail?: string;
  supportPhone?: string;
  isActive?: boolean;
  price: number;
  stock?: number;
  offers?: PlatformProductOfferInput[];
  coupons?: PlatformProductCouponInput[];
}) {
  return mutatePlatformProductsStore((data) => {
    const now = new Date().toISOString();
    const item = normalizeProductRecord({
      id: buildProductId(),
      name: input.name,
      imageUrl: input.imageUrl,
      category: input.category,
      description: input.description,
      salesPageUrl: input.salesPageUrl,
      hasSalesPage: input.hasSalesPage,
      productType: input.productType,
      invoiceStatementDescriptor: input.invoiceStatementDescriptor,
      refundWindow: input.refundWindow,
      supportEmail: input.supportEmail,
      supportPhone: input.supportPhone,
      price: input.price,
      sales: 0,
      stock: input.stock ?? 999,
      isActive: input.isActive ?? false,
      offers: input.offers,
      coupons: input.coupons,
      updatedAt: now
    });

    data.items.unshift(item);
    return item;
  });
}

export async function updatePlatformProductRecord(
  productId: string,
  input: {
    name: string;
    imageUrl: string | null;
    category: string;
    description?: string;
    salesPageUrl?: string;
    hasSalesPage?: boolean;
    productType?: PlatformProductType;
    invoiceStatementDescriptor?: string;
    refundWindow?: PlatformProductRefundWindow;
    supportEmail?: string;
    supportPhone?: string;
    isActive?: boolean;
    price: number;
    stock?: number;
    offers?: PlatformProductOfferInput[];
    coupons?: PlatformProductCouponInput[];
  }
) {
  return mutatePlatformProductsStore((data) => {
    const index = data.items.findIndex((item) => item.id === productId);

    if (index === -1) {
      throw new AppError("Produto nao encontrado.", 404);
    }

    const current = data.items[index];
    const next = normalizeProductRecord({
      ...current,
      name: input.name,
      imageUrl: input.imageUrl,
      category: input.category,
      description: input.description,
      salesPageUrl: input.salesPageUrl,
      hasSalesPage: input.hasSalesPage ?? current.hasSalesPage,
      productType: input.productType ?? current.productType,
      invoiceStatementDescriptor:
        input.invoiceStatementDescriptor ?? current.invoiceStatementDescriptor,
      refundWindow: input.refundWindow ?? current.refundWindow,
      supportEmail: input.supportEmail ?? current.supportEmail,
      supportPhone: input.supportPhone ?? current.supportPhone,
      isActive: input.isActive ?? current.isActive,
      price: input.price,
      stock: input.stock ?? current.stock,
      offers: input.offers ?? current.offers,
      coupons: input.coupons ?? current.coupons,
      updatedAt: new Date().toISOString()
    });

    data.items[index] = next;
    return next;
  });
}

export async function setPlatformProductActiveState(productId: string, isActive: boolean) {
  return mutatePlatformProductsStore((data) => {
    const index = data.items.findIndex((item) => item.id === productId);

    if (index === -1) {
      throw new AppError("Produto nao encontrado.", 404);
    }

    const next: PlatformProductRecord = {
      ...data.items[index],
      isActive,
      updatedAt: new Date().toISOString()
    };

    data.items[index] = next;
    return next;
  });
}
