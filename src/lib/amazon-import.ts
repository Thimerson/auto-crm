import { eq, like } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import type { AmazonOrder } from "./amazon";
import { normalizeEmail } from "./dedupe";

export interface AmazonImportResult {
  contactsCreated: number;
  dealsCreated: number;
  duplicates: number;
}

// Cada pedido nuevo genera un deal en la etapa ganada. El número de pedido queda en notes
// para no volver a importarlo si se sube el mismo reporte otra vez.
export function importAmazonOrders(
  db: BetterSQLite3Database<typeof schema>,
  orders: AmazonOrder[]
): AmazonImportResult {
  const wonStage = db
    .select()
    .from(schema.pipelineStages)
    .where(eq(schema.pipelineStages.isWon, true))
    .orderBy(schema.pipelineStages.order)
    .get();
  if (!wonStage) {
    throw new Error("No hay una etapa ganada en el pipeline");
  }

  const knownContacts = db.select().from(schema.contacts).all();
  const result: AmazonImportResult = { contactsCreated: 0, dealsCreated: 0, duplicates: 0 };

  for (const order of orders) {
    const marker = `amazon-order:${order.orderId}`;
    const alreadyImported = db
      .select({ id: schema.deals.id })
      .from(schema.deals)
      .where(like(schema.deals.notes, `${marker} ·%`))
      .get();
    if (alreadyImported) {
      result.duplicates++;
      continue;
    }

    const email = normalizeEmail(order.buyerEmail);
    let contact = email
      ? knownContacts.find((c) => normalizeEmail(c.email) === email)
      : undefined;

    if (!contact) {
      const now = new Date();
      contact = db
        .insert(schema.contacts)
        .values({
          name: order.buyerName || email || "Comprador Amazon",
          email,
          source: "amazon",
          temperature: "cold",
          score: 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
      knownContacts.push(contact);
      result.contactsCreated++;
    }

    const now = new Date();
    db.insert(schema.deals)
      .values({
        title: `Pedido Amazon ${order.orderId}`,
        value: order.totalCents,
        stageId: wonStage.id,
        contactId: contact.id,
        probability: 100,
        notes: `${marker} · ${order.products.join(", ")}`,
        createdAt: order.purchaseDate ?? now,
        updatedAt: now,
      })
      .run();
    result.dealsCreated++;
  }

  return result;
}
