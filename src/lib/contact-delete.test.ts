import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";
import * as schema from "../db/schema";
import { deleteContactCascade } from "./contact-delete";

function setup() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(`
    CREATE TABLE contacts (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT,
      source TEXT NOT NULL DEFAULT 'otro', temperature TEXT NOT NULL DEFAULT 'cold',
      score INTEGER NOT NULL DEFAULT 0, notes TEXT,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE pipeline_stages (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, "order" INTEGER NOT NULL,
      color TEXT NOT NULL DEFAULT '#64748b', is_won INTEGER NOT NULL DEFAULT 0,
      is_lost INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE deals (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, value INTEGER NOT NULL DEFAULT 0,
      stage_id TEXT NOT NULL REFERENCES pipeline_stages(id),
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      expected_close INTEGER, probability INTEGER NOT NULL DEFAULT 0, notes TEXT,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE activities (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, description TEXT NOT NULL,
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      deal_id TEXT REFERENCES deals(id),
      scheduled_at INTEGER, completed_at INTEGER, created_at INTEGER NOT NULL
    );
  `);
  return drizzle(sqlite, { schema });
}

type TestDb = ReturnType<typeof setup>;
const now = new Date();

function seedContact(db: TestDb, id: string) {
  db.insert(schema.contacts)
    .values({ id, name: id, createdAt: now, updatedAt: now })
    .run();
}

function seedActivity(db: TestDb, id: string, contactId: string) {
  db.insert(schema.activities)
    .values({ id, type: "note", description: id, contactId, createdAt: now })
    .run();
}

function seedDeal(db: TestDb, id: string, contactId: string) {
  db.insert(schema.pipelineStages)
    .values({ id: "stage", name: "Stage", order: 1 })
    .onConflictDoNothing()
    .run();
  db.insert(schema.deals)
    .values({
      id,
      title: id,
      stageId: "stage",
      contactId,
      createdAt: now,
      updatedAt: now,
    })
    .run();
}

describe("deleteContactCascade", () => {
  it("borra el contacto y sus actividades sin tocar otros contactos", () => {
    const db = setup();
    seedContact(db, "c1");
    seedContact(db, "c2");
    seedActivity(db, "a1", "c1");
    seedActivity(db, "a2", "c1");
    seedActivity(db, "a3", "c2");

    expect(deleteContactCascade(db, "c1")).toBe("deleted");

    expect(db.select().from(schema.contacts).all().map((c) => c.id)).toEqual(["c2"]);
    expect(db.select().from(schema.activities).all().map((a) => a.id)).toEqual(["a3"]);
  });

  it("devuelve not_found si el contacto no existe", () => {
    const db = setup();
    expect(deleteContactCascade(db, "inexistente")).toBe("not_found");
  });

  it("no borra nada y devuelve has_deals si el contacto tiene deals", () => {
    const db = setup();
    seedContact(db, "c1");
    seedActivity(db, "a1", "c1");
    seedDeal(db, "d1", "c1");

    expect(deleteContactCascade(db, "c1")).toBe("has_deals");

    expect(db.select().from(schema.contacts).all()).toHaveLength(1);
    expect(db.select().from(schema.activities).all()).toHaveLength(1);
    expect(db.select().from(schema.deals).all()).toHaveLength(1);
  });
});
