import { describe, expect, it } from "vitest";
import { parseAmazonOrderReport } from "./amazon";

const REPORT = [
  "amazon-order-id,purchase-date,buyer-name,buyer-email,product-name,quantity-purchased,item-price,currency,order-status,ship-city",
  "302-1,2026-10-01T10:00:00+00:00,Ana Lopez,ana@example.com,Cafe 1kg,2,19.90,EUR,Shipped,Madrid",
  "302-1,2026-10-01T10:00:00+00:00,Ana Lopez,ana@example.com,Taza,1,8.00,EUR,Shipped,Madrid",
  "302-2,2026-10-02T09:00:00+00:00,Luis Perez,luis@example.com,Filtro,1,12.50,EUR,Canceled,Sevilla",
  "302-3,2026-10-03T09:00:00+00:00,Marta Ruiz,marta@example.com,Vaso,1,5.00,USD,Shipped,Bilbao",
].join("\n");

describe("parseAmazonOrderReport", () => {
  it("agrupa líneas por pedido y suma el total en céntimos", () => {
    const { orders } = parseAmazonOrderReport(REPORT);
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      orderId: "302-1",
      buyerName: "Ana Lopez",
      buyerEmail: "ana@example.com",
      totalCents: 2790,
      products: ["Cafe 1kg", "Taza"],
      status: "Shipped",
    });
    expect(orders[0].purchaseDate?.toISOString()).toBe("2026-10-01T10:00:00.000Z");
  });

  it("omite pedidos cancelados y pedidos que no están en EUR, con motivo", () => {
    const { skipped } = parseAmazonOrderReport(REPORT);
    expect(skipped).toEqual([
      { orderId: "302-2", reason: "cancelado" },
      { orderId: "302-3", reason: "moneda USD, solo se importan pedidos en EUR" },
    ]);
  });

  it("acepta coma decimal y separador de miles", () => {
    const csv = [
      "amazon-order-id,buyer-name,item-price,currency,order-status",
      '401-1,Eva,"1,234.50",EUR,Shipped',
      '401-2,Noe,"19,99",EUR,Shipped',
    ].join("\n");
    const { orders } = parseAmazonOrderReport(csv);
    expect(orders.find((o) => o.orderId === "401-1")?.totalCents).toBe(123450);
    expect(orders.find((o) => o.orderId === "401-2")?.totalCents).toBe(1999);
  });

  it("omite filas sin amazon-order-id o con precio no numérico", () => {
    const csv = [
      "amazon-order-id,buyer-name,item-price,currency,order-status",
      ",Sin id,10.00,EUR,Shipped",
      "501-1,Pepe,abc,EUR,Shipped",
    ].join("\n");
    const { orders, skipped } = parseAmazonOrderReport(csv);
    expect(orders).toEqual([]);
    expect(skipped).toHaveLength(2);
    expect(skipped[0].reason).toBe("sin amazon-order-id");
    expect(skipped[1].reason).toBe("precio no válido");
  });

  it("devuelve vacío si el archivo no tiene filas", () => {
    expect(parseAmazonOrderReport("amazon-order-id,item-price,currency\n")).toEqual({
      orders: [],
      skipped: [],
    });
  });
});
