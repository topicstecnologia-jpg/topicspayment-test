export type SaleStatus = "Pago" | "Pendente" | "Processando";

export interface SaleItem {
  id: string;
  customer: string;
  product: string;
  status: SaleStatus;
  amount: number;
  date: string;
  payout: string;
}

export const salesHistory: SaleItem[] = [
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
  }
];

export function getSalesSummary() {
  const total = salesHistory.reduce((sum, sale) => sum + sale.amount, 0);
  const paid = salesHistory
    .filter((sale) => sale.status === "Pago")
    .reduce((sum, sale) => sum + sale.amount, 0);
  const pending = salesHistory
    .filter((sale) => sale.status !== "Pago")
    .reduce((sum, sale) => sum + sale.amount, 0);

  return {
    total,
    paid,
    pending,
    orders: salesHistory.length
  };
}
