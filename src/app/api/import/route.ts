import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";

const MAX_IMPORT_CONTACTS = 1000;
const VALID_TEMPERATURES = ["cold", "warm", "hot"] as const;

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
    failed: 0,
    errors: [] as string[],
  };

  const now = new Date();

  for (const contact of contactList) {
    if (typeof contact !== "object" || contact === null) {
      results.failed++;
      results.errors.push("Entrada invalida: se esperaba un objeto");
      continue;
    }

    if (typeof contact.name !== "string" || !contact.name.trim()) {
      results.failed++;
      results.errors.push(`Contacto sin nombre: ${JSON.stringify(contact)}`);
      continue;
    }

    const temperature = VALID_TEMPERATURES.includes(contact.temperature)
      ? contact.temperature
      : "cold";
    const score = Number.isInteger(contact.score)
      ? Math.min(100, Math.max(0, contact.score))
      : 0;

    try {
      db.insert(contacts)
        .values({
          name: contact.name.trim(),
          email: contact.email || null,
          phone: contact.phone || null,
          company: contact.company || null,
          source: contact.source || "import",
          temperature,
          score,
          notes: contact.notes || null,
          createdAt: now,
          updatedAt: now,
        })
        .run();
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
