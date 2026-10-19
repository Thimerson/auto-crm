import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";

// Base de datos SQLite en memoria con el mismo esquema que src/db/index.ts. Solo para tests.
export function setupTestDb() {
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

export type TestDb = ReturnType<typeof setupTestDb>;
