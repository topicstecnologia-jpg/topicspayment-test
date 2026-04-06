import { countUsers } from "../lib/app-repository";
import {
  createPlatformProductRecord,
  listPlatformProductRecords,
  setPlatformProductActiveState,
  updatePlatformProductRecord,
  type PlatformProductCouponInput,
  type PlatformProductOfferInput,
  type PlatformProductRefundWindow,
  type PlatformProductType
} from "../lib/platform-product-store";
import type { SafeUser } from "../types/auth";

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
}

function buildZeroTrendSeries(days: number) {
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));

    return {
      label: formatDayLabel(date),
      value: 0
    };
  });
}

function getAdminOverview() {
  return Promise.all([
    countUsers(),
    countUsers("admin"),
    countUsers("member"),
    countUsers("guest")
  ]).then(([totalUsers, admins, members, guests]) => ({
    totalUsers,
    admins,
    members,
    guests
  }));
}

async function getPlatformProductsCatalog(ownerId: string) {
  return listPlatformProductRecords(ownerId);
}

export async function getDashboardPayload(user: SafeUser) {
  const productItems = await getPlatformProductsCatalog(user.id);
  const trend30Days = buildZeroTrendSeries(30);
  const adminOverview = user.role === "admin" ? await getAdminOverview() : null;
  const activeProducts = productItems.filter((item) => item.isActive).length;

  return {
    overview: [
      {
        id: "volume-total",
        label: "Volume total",
        value: 0,
        suffix: "BRL",
        helper: "Mostra somente volume confirmado por dados reais"
      },
      {
        id: "recebido",
        label: "Recebido",
        value: 0,
        suffix: "BRL",
        helper: "Pagamentos compensados"
      },
      {
        id: "em-processamento",
        label: "Em processamento",
        value: 0,
        suffix: "BRL",
        helper: "Fluxo aguardando liberacao"
      },
      {
        id: "produtos-ativos",
        label: "Produtos ativos",
        value: activeProducts,
        suffix: "COUNT",
        helper: "Catalogo ativo do usuario autenticado"
      }
    ],
    salesMap: {
      title: "Mapa global de vendas",
      subtitle: "O mapa sera preenchido assim que houver vendas reais registradas.",
      hubId: "",
      locations: [],
      routes: [],
      stats: {
        countries: 0,
        regions: 0,
        orders: 0
      }
    },
    salesPerformance: {
      title: "Faturamento do dia",
      subtitle: "Sem serie historica real registrada ate o momento.",
      todayRevenue: 0,
      todayDeltaAmount: 0,
      todayDeltaPercent: 0,
      ordersToday: 0,
      averageTicket: 0,
      periods: {
        "7d": trend30Days.slice(-7),
        "15d": trend30Days.slice(-15),
        "30d": trend30Days
      }
    },
    spotlight: {
      title: "Painel central",
      subtitle: "Resumo conectado da operacao",
      invoiceCode: "Sem movimentacao",
      company: "TOPICS Pay",
      customer: user.name,
      blocks: [
        {
          label: "Receita do mes",
          value: 0
        },
        {
          label: "Saldo pendente",
          value: 0
        },
        {
          label: "Produtos ativos",
          value: activeProducts
        }
      ]
    },
    feed: [],
    adminOverview
  };
}

export async function getProductsPayload(userId: string) {
  const productItems = await getPlatformProductsCatalog(userId);
  const projectedRevenue = productItems.reduce((total, item) => total + item.price * item.sales, 0);

  return {
    metrics: [
      {
        id: "produtos",
        label: "Produtos cadastrados",
        value: productItems.length,
        suffix: "COUNT"
      },
      {
        id: "ativos",
        label: "Ativos",
        value: productItems.filter((item) => item.isActive).length,
        suffix: "COUNT"
      },
      {
        id: "desativados",
        label: "Desativados",
        value: productItems.filter((item) => !item.isActive).length,
        suffix: "COUNT"
      },
      {
        id: "projetado",
        label: "Receita registrada",
        value: projectedRevenue,
        suffix: "BRL"
      }
    ],
    items: productItems,
    featured: {
      title: "Conexao com vendas",
      description:
        "Os indicadores desta area passam a refletir apenas dados persistidos no banco do usuario autenticado.",
      ctaLabel: "Ver area de vendas",
      ctaHref: "/minhas-vendas"
    }
  };
}

export async function createPlatformProduct(
  userId: string,
  input: {
    name: string;
    imageUrl?: string;
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
  return createPlatformProductRecord(userId, {
    name: input.name,
    imageUrl: input.imageUrl ?? null,
    category: input.category,
    description: input.description,
    salesPageUrl: input.salesPageUrl,
    hasSalesPage: input.hasSalesPage,
    productType: input.productType,
    invoiceStatementDescriptor: input.invoiceStatementDescriptor,
    refundWindow: input.refundWindow,
    supportEmail: input.supportEmail,
    supportPhone: input.supportPhone,
    isActive: input.isActive,
    price: input.price,
    stock: input.stock,
    offers: input.offers,
    coupons: input.coupons
  });
}

export async function updatePlatformProduct(
  userId: string,
  productId: string,
  input: {
    name: string;
    imageUrl?: string;
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
  return updatePlatformProductRecord(userId, productId, {
    name: input.name,
    imageUrl: input.imageUrl ?? null,
    category: input.category,
    description: input.description,
    salesPageUrl: input.salesPageUrl,
    hasSalesPage: input.hasSalesPage,
    productType: input.productType,
    invoiceStatementDescriptor: input.invoiceStatementDescriptor,
    refundWindow: input.refundWindow,
    supportEmail: input.supportEmail,
    supportPhone: input.supportPhone,
    isActive: input.isActive,
    price: input.price,
    stock: input.stock,
    offers: input.offers,
    coupons: input.coupons
  });
}

export async function updatePlatformProductActiveState(
  userId: string,
  productId: string,
  isActive: boolean
) {
  return setPlatformProductActiveState(userId, productId, isActive);
}

export async function getSalesPayload(user: SafeUser) {
  return {
    metrics: [
      {
        id: "volume-total",
        label: "Volume total",
        value: 0,
        suffix: "BRL"
      },
      {
        id: "recebido",
        label: "Recebido",
        value: 0,
        suffix: "BRL"
      },
      {
        id: "ticket-medio",
        label: "Ticket medio",
        value: 0,
        suffix: "BRL"
      },
      {
        id: "pedidos",
        label: "Pedidos recentes",
        value: 0,
        suffix: "COUNT"
      }
    ],
    items: [],
    detail: {
      invoiceCode: "Sem pedidos",
      company: "TOPICS Pay",
      customer: user.name,
      principalAmount: 0,
      balanceDue: 0,
      payoutStatus: "Sem repasses"
    }
  };
}
