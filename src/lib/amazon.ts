import { parseCsv } from "./csv";

export interface AmazonOrder {
  orderId: string;
  purchaseDate: Date | null;
  buyerName: string;
  buyerEmail: string | null;
  products: string[];
  totalCents: number;
  status: string;
}

export interface SkippedOrder {
  orderId: string;
  reason: string;
}

export interface AmazonParseResult {
  orders: AmazonOrder[];
  skipped: SkippedOrder[];
}

const CANCELED_STATUSES = new Set(["canceled", "cancelled"]);

// "19.90" → 1990, "1,234.50" → 123450, "19,99" → 1999. Devuelve null si no es un número.
export function parseEuroCents(raw: string): number | null {
  let value = raw.trim();
  if (!value) return null;
  if (value.includes(".") && value.includes(",")) {
    value = value.replace(/,/g, "");
  } else if (value.includes(",")) {
    value = value.replace(",", ".");
  }
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

type Row = Record<string, string>;

function lowerKeys(row: Row): Row {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value])
  );
}

// Reporte de pedidos de Amazon (una fila por artículo). Agrupa por pedido y suma sus artículos.
export function parseAmazonOrderReport(csvText: string): AmazonParseResult {
  const rows = parseCsv(csvText).map(lowerKeys);
  const orders: AmazonOrder[] = [];
  const skipped: SkippedOrder[] = [];
  const groups = new Map<string, Row[]>();

  for (const row of rows) {
    const orderId = row["amazon-order-id"];
    if (!orderId) {
      skipped.push({ orderId: "", reason: "sin amazon-order-id" });
      continue;
    }
    groups.set(orderId, [...(groups.get(orderId) ?? []), row]);
  }

  for (const [orderId, lines] of groups) {
    const first = lines[0];
    const status = first["order-status"] ?? "";
    const currency = (first["currency"] ?? "").toUpperCase();

    if (CANCELED_STATUSES.has(status.toLowerCase())) {
      skipped.push({ orderId, reason: "cancelado" });
      continue;
    }
    if (currency !== "EUR") {
      skipped.push({
        orderId,
        reason: `moneda ${currency || "desconocida"}, solo se importan pedidos en EUR`,
      });
      continue;
    }

    const amounts = lines.map((line) => parseEuroCents(line["item-price"] ?? ""));
    if (amounts.some((amount) => amount === null)) {
      skipped.push({ orderId, reason: "precio no válido" });
      continue;
    }

    const purchaseDate = new Date(first["purchase-date"] ?? "");
    const buyerEmail = lines.map((line) => line["buyer-email"]).find(Boolean) ?? null;
    const buyerName = lines.map((line) => line["buyer-name"]).find(Boolean) ?? "";

    orders.push({
      orderId,
      purchaseDate: Number.isNaN(purchaseDate.getTime()) ? null : purchaseDate,
      buyerName,
      buyerEmail,
      products: lines.map((line) => line["product-name"]).filter(Boolean),
      totalCents: amounts.reduce<number>((sum, amount) => sum + (amount ?? 0), 0),
      status,
    });
  }

  return { orders, skipped };
}
