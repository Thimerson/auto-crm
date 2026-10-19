import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";

export type DeleteContactResult = "deleted" | "not_found" | "has_deals";

// Borra el contacto junto con sus actividades. Si tiene deals no borra nada,
// porque deals.contact_id es obligatorio y no se puede quitar sin decidir qué hacer con el deal.
export function deleteContactCascade(
  db: BetterSQLite3Database<typeof schema>,
  id: string
): DeleteContactResult {
  const contact = db
    .select()
    .from(schema.contacts)
    .where(eq(schema.contacts.id, id))
    .get();
  if (!contact) return "not_found";

  const linkedDeals = db
    .select()
    .from(schema.deals)
    .where(eq(schema.deals.contactId, id))
    .all();
  if (linkedDeals.length > 0) return "has_deals";

  db.transaction((tx) => {
    tx.delete(schema.activities).where(eq(schema.activities.contactId, id)).run();
    tx.delete(schema.contacts).where(eq(schema.contacts.id, id)).run();
  });

  return "deleted";
}
