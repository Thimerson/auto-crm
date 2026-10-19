import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { MAX_IMPORT_CONTACTS, normalizeImportContact } from "@/lib/import";
import { isDuplicate } from "@/lib/dedupe";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }
  const { contacts: contactList } = body ?? {};

  if (!Array.isArray(contactList) || contactList.length === 0) {
    return NextResponse.json(
      { error: "Se requiere un array de contactos" },
      { status: 400 }
    );
  }

  if (contactList.length > MAX_IMPORT_CONTACTS) {
    return NextResponse.json(
      { error: `Maximo ${MAX_IMPORT_CONTACTS} contactos por importacion` },
      { status: 413 }
    );
  }

  const results = {
    imported: 0,
    duplicates: 0,
    failed: 0,
    errors: [] as string[],
  };

  const now = new Date();
  const existing = db
    .select({ email: contacts.email, phone: contacts.phone })
    .from(contacts)
    .all();

  for (const raw of contactList) {
    const normalized = normalizeImportContact(raw);
    if (!normalized.ok) {
      results.failed++;
      results.errors.push(normalized.error);
      continue;
    }

    const contact = normalized.value;

    if (isDuplicate({ email: contact.email, phone: contact.phone }, existing)) {
      results.duplicates++;
      continue;
    }

    try {
      db.insert(contacts)
        .values({
          ...contact,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      existing.push({ email: contact.email, phone: contact.phone });
      results.imported++;
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Error importando ${contact.name}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return NextResponse.json(results, {
    status: results.failed > 0 ? 207 : 201,
  });
}
