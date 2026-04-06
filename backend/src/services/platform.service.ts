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

const salesItems = [
  {
    id: "sale-901",
    customer: "Marina Lopes",
    product: "Assinatura TOPICS Prime",
    status: "Pago",
    amount: 129.9,
    date: "Hoje, 10:08",
    payout: "Liberado"
  },
  {
    id: "sale-902",
    customer: "Lucas Andrade",
    product: "Mentoria Express",
    status: "Processando",
    amount: 890,
    date: "Hoje, 08:42",
    payout: "Aguardando"
  },
  {
    id: "sale-903",
    customer: "Bruna Castro",
    product: "Workshop Premium",
    status: "Pendente",
    amount: 349,
    date: "Ontem, 19:10",
    payout: "Bloqueado"
  },
  {
    id: "sale-904",
    customer: "Guilherme Solis",
    product: "Assinatura TOPICS Prime",
    status: "Pago",
    amount: 129.9,
    date: "Ontem, 16:26",
    payout: "Liberado"
  },
  {
    id: "sale-905",
    customer: "Renata Melo",
    product: "Template TOPICS Pay",
    status: "Pago",
    amount: 67,
    date: "Ontem, 13:48",
    payout: "Liberado"
  }
] as const;

const salesMapLocations = [
  {
    id: "sao-paulo",
    city: "Sao Paulo",
    country: "Brasil",
    amount: 540.7,
    orders: 4,
    x: 31,
    y: 68,
    spotlight: "Maior concentracao de receita da operacao."
  },
  {
    id: "lisboa",
    city: "Lisboa",
    country: "Portugal",
    amount: 326.8,
    orders: 2,
    x: 48,
    y: 37,
    spotlight: "Base recorrente com boa previsibilidade."
  },
  {
    id: "miami",
    city: "Miami",
    country: "Estados Unidos",
    amount: 129.9,
    orders: 1,
    x: 23,
    y: 43,
    spotlight: "Entrada forte no eixo norte-americano."
  },
  {
    id: "mexico",
    city: "Cidade do Mexico",
    country: "Mexico",
    amount: 89.9,
    orders: 1,
    x: 18,
    y: 46,
    spotlight: "Ponto de aceleracao para vendas digitais."
  },
  {
    id: "bogota",
    city: "Bogota",
    country: "Colombia",
    amount: 97,
    orders: 1,
    x: 24,
    y: 55,
    spotlight: "Mercado em crescimento na America Latina."
  },
  {
    id: "londres",
    city: "Londres",
    country: "Reino Unido",
    amount: 119,
    orders: 1,
    x: 49,
    y: 34,
    spotlight: "Operacao conectada ao eixo europeu."
  },
  {
    id: "dubai",
    city: "Dubai",
    country: "Emirados Arabes",
    amount: 135,
    orders: 1,
    x: 60,
    y: 45,
    spotlight: "Rotas premium com ticket acima da media."
  },
  {
    id: "toquio",
    city: "Toquio",
    country: "Japao",
    amount: 129.9,
    orders: 1,
    x: 84,
    y: 43,
    spotlight: "Expansao digital com leitura internacional."
  }
] as const;

const salesMapRoutes = [
  { id: "route-sp-lisboa", fromId: "sao-paulo", toId: "lisboa" },
  { id: "route-sp-miami", fromId: "sao-paulo", toId: "miami" },
  { id: "route-sp-mexico", fromId: "sao-paulo", toId: "mexico" },
  { id: "route-sp-bogota", fromId: "sao-paulo", toId: "bogota" },
  { id: "route-lisboa-londres", fromId: "lisboa", toId: "londres" },
  { id: "route-lisboa-dubai", fromId: "lisboa", toId: "dubai" },
  { id: "route-dubai-toquio", fromId: "dubai", toId: "toquio" }
] as const;

const revenueSeries30Days = [
  382, 415, 436, 401, 462, 508, 486, 522, 548, 496,
  574, 612, 590, 641, 688, 654, 706, 724, 682, 745,
  812, 776, 854, 901, 862, 918, 974, 928, 545.9, 1019.9
] as const;

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
}

function buildTrendSeries(values: readonly number[]) {
  const today = new Date();

  return values.map((value, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (values.length - 1 - index));

    return {
      label: formatDayLabel(date),
      value
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

async function getPlatformProductsCatalog() {
  return listPlatformProductRecords();
}

export async function getDashboardPayload(user: SafeUser) {
  const productItems = await getPlatformProductsCatalog();
  const totalVolume = salesItems.reduce((sum, sale) => sum + sale.amount, 0);
  const paidVolume = salesItems
    .filter((sale) => sale.status === "Pago")
    .reduce((sum, sale) => sum + sale.amount, 0);
  const pendingVolume = salesItems
    .filter((sale) => sale.status !== "Pago")
    .reduce((sum, sale) => sum + sale.amount, 0);
  const todayRevenue = salesItems
    .filter((sale) => sale.date.startsWith("Hoje"))
    .reduce((sum, sale) => sum + sale.amount, 0);
  const yesterdayRevenue = salesItems
    .filter((sale) => sale.date.startsWith("Ontem"))
    .reduce((sum, sale) => sum + sale.amount, 0);
  const ordersToday = salesItems.filter((sale) => sale.date.startsWith("Hoje")).length;
  const todayDeltaAmount = todayRevenue - yesterdayRevenue;
  const todayDeltaPercent = yesterdayRevenue > 0 ? (todayDeltaAmount / yesterdayRevenue) * 100 : 100;
  const trend30Days = buildTrendSeries(revenueSeries30Days);

  const adminOverview = user.role === "admin" ? await getAdminOverview() : null;

  return {
    overview: [
      {
        id: "volume-total",
        label: "Volume total",
        value: totalVolume,
        suffix: "BRL",
        helper: "Consolidado entre produtos e vendas"
      },
      {
        id: "recebido",
        label: "Recebido",
        value: paidVolume,
        suffix: "BRL",
        helper: "Pagamentos compensados"
      },
      {
        id: "em-processamento",
        label: "Em processamento",
        value: pendingVolume,
        suffix: "BRL",
        helper: "Fluxo aguardando liberacao"
      },
      {
        id: "produtos-ativos",
        label: "Produtos ativos",
        value: productItems.filter((item) => item.isActive).length,
        suffix: "COUNT",
        helper: "Catalogo com venda ativa"
      }
    ],
    salesMap: {
      title: "Mapa global de vendas",
      subtitle: "Arraste o painel para explorar as localidades conectadas pela operacao.",
      hubId: "sao-paulo",
      locations: salesMapLocations,
      routes: salesMapRoutes,
      stats: {
        countries: new Set(salesMapLocations.map((location) => location.country)).size,
        regions: salesMapLocations.length,
        orders: salesMapLocations.reduce((total, location) => total + location.orders, 0)
      }
    },
    salesPerformance: {
      title: "Faturamento do dia",
      subtitle: "Acompanhe a linha de vendas e compare a evolucao recente da operacao.",
      todayRevenue,
      todayDeltaAmount,
      todayDeltaPercent,
      ordersToday,
      averageTicket: ordersToday > 0 ? todayRevenue / ordersToday : 0,
      periods: {
        "7d": trend30Days.slice(-7),
        "15d": trend30Days.slice(-15),
        "30d": trend30Days
      }
    },
    spotlight: {
      title: "Painel central",
      subtitle: "Resumo conectado da operacao",
      invoiceCode: "#TP-427012",
      company: "TOPICS Pay",
      customer: user.name,
      blocks: [
        {
          label: "Receita do mes",
          value: paidVolume
        },
        {
          label: "Saldo pendente",
          value: pendingVolume
        },
        {
          label: "Produtos ativos",
          value: productItems.filter((item) => item.isActive).length
        }
      ]
    },
    feed: salesItems.slice(0, 4),
    adminOverview
  };
}

export async function getProductsPayload() {
  const productItems = await getPlatformProductsCatalog();
  const projectedRevenue = productItems.reduce(
    (total, item) => total + item.price * Math.max(item.sales, 1),
    0
  );

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
        label: "Receita projetada",
        value: projectedRevenue,
        suffix: "BRL"
      }
    ],
    items: productItems,
    featured: {
      title: "Conexao com vendas",
      description:
        "Produtos ativos alimentam diretamente os indicadores de receita e recebimentos.",
      ctaLabel: "Ver area de vendas",
      ctaHref: "/minhas-vendas"
    }
  };
}

export async function createPlatformProduct(input: {
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
}) {
  return createPlatformProductRecord({
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
  return updatePlatformProductRecord(productId, {
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

export async function updatePlatformProductActiveState(productId: string, isActive: boolean) {
  return setPlatformProductActiveState(productId, isActive);
}

export async function getSalesPayload(user: SafeUser) {
  const totalVolume = salesItems.reduce((sum, sale) => sum + sale.amount, 0);
  const paidVolume = salesItems
    .filter((sale) => sale.status === "Pago")
    .reduce((sum, sale) => sum + sale.amount, 0);
  const averageTicket = totalVolume / salesItems.length;
  const detail = salesItems[1];

  return {
    metrics: [
      {
        id: "volume-total",
        label: "Volume total",
        value: totalVolume,
        suffix: "BRL"
      },
      {
        id: "recebido",
        label: "Recebido",
        value: paidVolume,
        suffix: "BRL"
      },
      {
        id: "ticket-medio",
        label: "Ticket medio",
        value: averageTicket,
        suffix: "BRL"
      },
      {
        id: "pedidos",
        label: "Pedidos recentes",
        value: salesItems.length,
        suffix: "COUNT"
      }
    ],
    items: salesItems,
    detail: {
      invoiceCode: "#427-012",
      company: "TOPICS Pay",
      customer: user.name,
      principalAmount: detail.amount,
      balanceDue: salesItems
        .filter((sale) => sale.status !== "Pago")
        .reduce((sum, sale) => sum + sale.amount, 0),
      payoutStatus: detail.payout
    }
  };
}
