export interface PlatformMetric {
  id: string;
  label: string;
  value: number;
  suffix: "BRL" | "COUNT";
  helper?: string;
}

export interface PlatformSaleItem {
  id: string;
  customer: string;
  product: string;
  status: string;
  amount: number;
  date: string;
  payout: string;
}

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

export interface PlatformProductOffer {
  id: string;
  code: string;
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
  cardInstallmentLimit: number;
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

export interface PlatformProductCoupon {
  id: string;
  code: string;
  discountType: PlatformProductCouponDiscountType;
  discountValue: number;
  active: boolean;
  note: string;
}

export interface PlatformProductItem {
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
  isActive: boolean;
  price: number;
  sales: number;
  stock: number;
  offers: PlatformProductOffer[];
  coupons: PlatformProductCoupon[];
  updatedAt: string;
}

export interface PlatformProductMutationResponse {
  message: string;
  item: PlatformProductItem;
}

export interface PlatformCheckoutItem {
  productId: string;
  offerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerAvatarUrl: string | null;
  productName: string;
  productDescription: string;
  productImageUrl: string | null;
  supportEmail: string;
  supportPhone: string;
  invoiceStatementDescriptor: string;
  refundWindow: PlatformProductRefundWindow;
  offer: PlatformProductOffer;
  coupons: PlatformProductCoupon[];
}

export interface PlatformCheckoutResponse {
  item: PlatformCheckoutItem;
}

export interface PlatformProductDeleteResponse {
  message: string;
  productId: string;
}

export interface PlatformAdminOverview {
  totalUsers: number;
  admins: number;
  members: number;
  guests: number;
}

export interface PlatformDashboardMapLocation {
  id: string;
  city: string;
  country: string;
  amount: number;
  orders: number;
  x: number;
  y: number;
  spotlight: string;
}

export interface PlatformDashboardMapRoute {
  id: string;
  fromId: string;
  toId: string;
}

export interface PlatformDashboardMapData {
  title: string;
  subtitle: string;
  hubId: string;
  locations: PlatformDashboardMapLocation[];
  routes: PlatformDashboardMapRoute[];
  stats: {
    countries: number;
    regions: number;
    orders: number;
  };
}

export interface PlatformDashboardTrendPoint {
  label: string;
  value: number;
}

export interface PlatformDashboardSalesPerformance {
  title: string;
  subtitle: string;
  todayRevenue: number;
  todayDeltaAmount: number;
  todayDeltaPercent: number;
  ordersToday: number;
  averageTicket: number;
  periods: {
    "7d": PlatformDashboardTrendPoint[];
    "15d": PlatformDashboardTrendPoint[];
    "30d": PlatformDashboardTrendPoint[];
  };
}

export interface PlatformDashboardResponse {
  overview: PlatformMetric[];
  salesMap: PlatformDashboardMapData;
  salesPerformance: PlatformDashboardSalesPerformance;
  spotlight: {
    title: string;
    subtitle: string;
    invoiceCode: string;
    company: string;
    customer: string;
    blocks: Array<{
      label: string;
      value: number;
    }>;
  };
  feed: PlatformSaleItem[];
  adminOverview: PlatformAdminOverview | null;
}

export interface PlatformProductsResponse {
  metrics: PlatformMetric[];
  items: PlatformProductItem[];
  featured: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
}

export interface PlatformSalesResponse {
  metrics: PlatformMetric[];
  items: PlatformSaleItem[];
  detail: {
    invoiceCode: string;
    company: string;
    customer: string;
    principalAmount: number;
    balanceDue: number;
    payoutStatus: string;
  };
}
