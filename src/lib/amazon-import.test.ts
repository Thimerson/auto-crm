import { describe, expect, it } from "vitest";
import * as schema from "../db/schema";
import { importAmazonOrders } from "./amazon-import";
import type { AmazonOrder } from "./amazon";
import { setupTestDb } from "./test-db";

function seedStages(db: ReturnType<typeof setupTestDb>) {
  db.insert(schema.pipelineStages)
    .values([
      { id: "s-prospecto", name: "Prospecto", order: 1 },
      { id: "s-ganado", name: "Cerrado Ganado", order: 5, isWon: true },
    ])
    .run();
}

function order(overrides: Partial<AmazonOrder> = {}): AmazonOrder {
  return {
    orderId: "302-1",
    purchaseDate: new Date("2026-10-01T10:00:00Z"),
    buyerName: "Ana Lopez",
    buyerEmail: "ana@example.com",
    products: ["Cafe 1kg", "Taza"],
    totalCents: 2790,
    status: "Shipped",
    ...overrides,
  };
}

describe("importAmazonOrders", () => {
  it("crea contacto y deal ganado en EUR por cada pedido nuevo", () => {
    const db = setupTestDb();
    seedStages(db);

    const result = importAmazonOrders(db, [order()]);

    expect(result).toMatchObject({ contactsCreated: 1, dealsCreated: 1, duplicates: 0 });
    const [deal] = db.select().from(schema.deals).all();
    expect(deal.value).toBe(2790);
    expect(deal.stageId).toBe("s-ganado");
    expect(deal.title).toBe("Pedido Amazon 302-1");
    expect(deal.notes).toContain("amazon-order:302-1");
    expect(deal.notes).toContain("Cafe 1kg, Taza");
    const [contact] = db.select().from(schema.contacts).all();
    expect(contact.source).toBe("amazon");
    expect(contact.email).toBe("ana@example.com");
  });

  it("no vuelve a importar un pedido ya existente", () => {
    const db = setupTestDb();
    seedStages(db);
    importAmazonOrders(db, [order()]);

    const second = importAmazonOrders(db, [order()]);

    expect(second).toMatchObject({ contactsCreated: 0, dealsCreated: 0, duplicates: 1 });
    expect(db.select().from(schema.deals).all()).toHaveLength(1);
  });

  it("reutiliza el contacto si el comprador ya existe por email", () => {
    const db = setupTestDb();
    seedStages(db);
    importAmazonOrders(db, [order()]);

    const result = importAmazonOrders(db, [order({ orderId: "302-9", totalCents: 500 })]);

    expect(result).toMatchObject({ contactsCreated: 0, dealsCreated: 1 });
    expect(db.select().from(schema.contacts).all()).toHaveLength(1);
    expect(db.select().from(schema.deals).all()).toHaveLength(2);
  });

  it("falla con mensaje claro si no existe ninguna etapa ganada", () => {
    const db = setupTestDb();
    db.insert(schema.pipelineStages)
      .values({ id: "s-1", name: "Prospecto", order: 1 })
      .run();

    expect(() => importAmazonOrders(db, [order()])).toThrow(/etapa ganada/);
  });
});
