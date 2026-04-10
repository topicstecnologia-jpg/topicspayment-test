import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
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

export interface DeletedPlatformProductRecord {
  id: string;
  name: string;
}

type PlatformProductRecordRow = Awaited<
  ReturnType<typeof prisma.platformProduct.findFirstOrThrow>
>;

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

function normalizeProductType(value?: string): PlatformProductType {
  return value === "course" ||
    value === "community" ||
    value === "mentorship" ||
    value === "template" ||
    value === "service" ||
    value === "event" ||
    value === "subscription"
    ? value
    : "other";
}

function normalizeRefundWindow(value?: string): PlatformProductRefundWindow {
  return value === "14_days" || value === "21_days" || value === "30_days" ? value : "7_days";
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeOfferRecord(
  productId: string,
  offer: Partial<PlatformProductOfferRecord>,
  index: number
): PlatformProductOfferRecord {
  const normalized: PlatformProductOfferRecord = {
    id: offer.id?.trim() || `${productId}-offer-${index + 1}`,
    title: offer.title?.trim() || `Oferta ${index + 1}`,
    description: offer.description?.trim() || "",
    checkoutDescription: offer.checkoutDescription?.trim() || "",
    imageUrl: typeof offer.imageUrl === "string" ? offer.imageUrl : null,
    price:
      typeof offer.price === "number" && Number.isFinite(offer.price)
        ? Math.max(offer.price, 0)
        : 0,
    anchorPrice:
      typeof offer.anchorPrice === "number" && Number.isFinite(offer.anchorPrice)
        ? Math.max(offer.anchorPrice, 0)
        : undefined,
    itemCount:
      typeof offer.itemCount === "number" && Number.isFinite(offer.itemCount)
        ? Math.max(Math.trunc(offer.itemCount), 0)
        : 1,
    billingCycle:
      offer.billingCycle === "monthly" || offer.billingCycle === "annual"
        ? offer.billingCycle
        : "one_time",
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

  return normalized;
}

function normalizeOffers(
  productId: string,
  offers: PlatformProductOfferInput[] | null | undefined
) {
  const normalizedOffers = Array.isArray(offers)
    ? offers.map((offer, index) => normalizeOfferRecord(productId, offer, index))
    : [];

  if (normalizedOffers.length === 0) {
    return [];
  }

  const primaryIndex = normalizedOffers.findIndex((offer) => offer.isPrimary);
  const safePrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return normalizedOffers.map((offer, index) => ({
    ...offer,
    isPrimary: index === safePrimaryIndex
  }));
}

function normalizeCouponRecord(
  productId: string,
  coupon: Partial<PlatformProductCouponRecord>,
  index: number
): PlatformProductCouponRecord {
  return {
    id: coupon.id?.trim() || `${productId}-coupon-${index + 1}`,
    code: coupon.code?.trim().toUpperCase() || `TOPICS${index + 1}`,
    discountType: coupon.discountType === "fixed" ? "fixed" : "percent",
    discountValue:
      typeof coupon.discountValue === "number" && Number.isFinite(coupon.discountValue)
        ? Math.max(coupon.discountValue, 0)
        : 0,
    active: coupon.active ?? true,
    note: coupon.note?.trim() || ""
  };
}

function normalizeCoupons(
  productId: string,
  coupons: PlatformProductCouponInput[] | null | undefined
) {
  return Array.isArray(coupons)
    ? coupons.map((coupon, index) => normalizeCouponRecord(productId, coupon, index))
    : [];
}

function parseOffers(
  productId: string,
  value: Prisma.JsonValue
): PlatformProductOfferRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return normalizeOffers(productId, value as PlatformProductOfferInput[]);
}

function parseCoupons(
  productId: string,
  value: Prisma.JsonValue
): PlatformProductCouponRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return normalizeCoupons(productId, value as PlatformProductCouponInput[]);
}

function mapPlatformProductRecord(item: PlatformProductRecordRow): PlatformProductRecord {
  return {
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl,
    category: item.category,
    description: item.description,
    salesPageUrl: item.hasSalesPage ? item.salesPageUrl : null,
    hasSalesPage: item.hasSalesPage,
    productType: normalizeProductType(item.productType),
    invoiceStatementDescriptor: item.invoiceStatementDescriptor,
    refundWindow: normalizeRefundWindow(item.refundWindow),
    supportEmail: item.supportEmail,
    supportPhone: item.supportPhone,
    price: item.price,
    sales: item.sales,
    stock: item.stock,
    isActive: item.isActive,
    offers: parseOffers(item.id, item.offers),
    coupons: parseCoupons(item.id, item.coupons),
    updatedAt: item.updatedAt.toISOString()
  };
}

async function getScopedPlatformProduct(ownerId: string, productId: string) {
  const item = await prisma.platformProduct.findFirst({
    where: {
      id: productId,
      ownerId
    }
  });

  if (!item) {
    throw new AppError("Produto nao encontrado.", 404);
  }

  return item;
}

export async function listPlatformProductRecords(ownerId: string) {
  const items = await prisma.platformProduct.findMany({
    where: { ownerId },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return items.map(mapPlatformProductRecord);
}

export async function createPlatformProductRecord(
  ownerId: string,
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
  const normalizedItem = await prisma.$transaction(async (transaction) => {
    const createdItem = await transaction.platformProduct.create({
      data: {
        ownerId,
        name: input.name.trim(),
        imageUrl: input.imageUrl ?? null,
        category: input.category.trim(),
        description: input.description?.trim() || "",
        salesPageUrl: input.hasSalesPage ? input.salesPageUrl?.trim() || null : null,
        hasSalesPage: Boolean(input.hasSalesPage),
        productType: normalizeProductType(input.productType),
        invoiceStatementDescriptor:
          input.invoiceStatementDescriptor?.trim() || buildInvoiceStatementDescriptor(input.name),
        refundWindow: normalizeRefundWindow(input.refundWindow),
        supportEmail: input.supportEmail?.trim() || "",
        supportPhone: input.supportPhone?.trim() || "",
        price: Math.max(input.price, 0),
        sales: 0,
        stock:
          typeof input.stock === "number" && Number.isFinite(input.stock)
            ? Math.max(Math.trunc(input.stock), 0)
            : 0,
        isActive: Boolean(input.isActive),
        offers: toInputJsonValue([]),
        coupons: toInputJsonValue([])
      }
    });

    return transaction.platformProduct.update({
      where: { id: createdItem.id },
      data: {
        offers: toInputJsonValue(normalizeOffers(createdItem.id, input.offers)),
        coupons: toInputJsonValue(normalizeCoupons(createdItem.id, input.coupons))
      }
    });
  });

  return mapPlatformProductRecord(normalizedItem);
}

export async function updatePlatformProductRecord(
  ownerId: string,
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
  const current = await getScopedPlatformProduct(ownerId, productId);

  const next = await prisma.platformProduct.update({
    where: { id: current.id },
    data: {
      name: input.name.trim(),
      imageUrl: input.imageUrl ?? null,
      category: input.category.trim(),
      description: input.description?.trim() || "",
      salesPageUrl: input.hasSalesPage ? input.salesPageUrl?.trim() || null : null,
      hasSalesPage: Boolean(input.hasSalesPage),
      productType: normalizeProductType(input.productType),
      invoiceStatementDescriptor:
        input.invoiceStatementDescriptor?.trim() || buildInvoiceStatementDescriptor(input.name),
      refundWindow: normalizeRefundWindow(input.refundWindow),
      supportEmail: input.supportEmail?.trim() || "",
      supportPhone: input.supportPhone?.trim() || "",
      price: Math.max(input.price, 0),
      stock:
        typeof input.stock === "number" && Number.isFinite(input.stock)
          ? Math.max(Math.trunc(input.stock), 0)
          : current.stock,
      isActive: input.isActive ?? current.isActive,
      offers: toInputJsonValue(normalizeOffers(current.id, input.offers)),
      coupons: toInputJsonValue(normalizeCoupons(current.id, input.coupons))
    }
  });

  return mapPlatformProductRecord(next);
}

export async function setPlatformProductActiveState(
  ownerId: string,
  productId: string,
  isActive: boolean
) {
  const current = await getScopedPlatformProduct(ownerId, productId);

  const next = await prisma.platformProduct.update({
    where: { id: current.id },
    data: {
      isActive
    }
  });

  return mapPlatformProductRecord(next);
}

export async function deletePlatformProductRecord(
  ownerId: string,
  productId: string
): Promise<DeletedPlatformProductRecord> {
  const current = await getScopedPlatformProduct(ownerId, productId);

  await prisma.platformProduct.delete({
    where: { id: current.id }
  });

  return {
    id: current.id,
    name: current.name
  };
}
