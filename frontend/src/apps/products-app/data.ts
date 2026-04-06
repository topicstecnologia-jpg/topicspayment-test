export type ProductStatus = "Ativo" | "Rascunho" | "Pausado";

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  status: ProductStatus;
  price: number;
  sales: number;
  stock: number;
  updatedAt: string;
}

export const productCatalog: ProductItem[] = [
  {
    id: "prod-001",
    name: "Assinatura TOPICS Prime",
    category: "Membros",
    status: "Ativo",
    price: 129.9,
    sales: 148,
    stock: 999,
    updatedAt: "Hoje, 09:14"
  },
  {
    id: "prod-002",
    name: "Mentoria Express",
    category: "Servicos",
    status: "Ativo",
    price: 890,
    sales: 32,
    stock: 18,
    updatedAt: "Ontem, 21:03"
  },
  {
    id: "prod-003",
    name: "Template TOPICS Pay",
    category: "Digital",
    status: "Rascunho",
    price: 67,
    sales: 0,
    stock: 999,
    updatedAt: "Ontem, 13:46"
  },
  {
    id: "prod-004",
    name: "Workshop Premium",
    category: "Eventos",
    status: "Pausado",
    price: 349,
    sales: 12,
    stock: 40,
    updatedAt: "Seg, 18:22"
  }
];

export function getProductsSummary() {
  const ativos = productCatalog.filter((item) => item.status === "Ativo").length;
  const rascunhos = productCatalog.filter((item) => item.status === "Rascunho").length;
  const faturamentoProjetado = productCatalog.reduce(
    (total, item) => total + item.price * Math.max(item.sales, 1),
    0
  );

  return {
    total: productCatalog.length,
    ativos,
    rascunhos,
    faturamentoProjetado
  };
}
