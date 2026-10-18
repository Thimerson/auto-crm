export const MAX_IMPORT_CONTACTS = 1000;
export const VALID_TEMPERATURES = ["cold", "warm", "hot"] as const;

export type ImportTemperature = (typeof VALID_TEMPERATURES)[number];

export interface ImportContact {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  temperature: ImportTemperature;
  score: number;
  notes: string | null;
}

export type NormalizeImportResult =
  | { ok: true; value: ImportContact }
  | { ok: false; error: string };

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

export function normalizeImportContact(raw: unknown): NormalizeImportResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Entrada invalida: se esperaba un objeto" };
  }

  const input = raw as Record<string, unknown>;

  if (typeof input.name !== "string" || !input.name.trim()) {
    return { ok: false, error: `Contacto sin nombre: ${JSON.stringify(raw)}` };
  }

  const temperature = VALID_TEMPERATURES.includes(
    input.temperature as ImportTemperature
  )
    ? (input.temperature as ImportTemperature)
    : "cold";

  const score = Number.isInteger(input.score)
    ? Math.min(100, Math.max(0, input.score as number))
    : 0;

  return {
    ok: true,
    value: {
      name: input.name.trim(),
      email: optionalString(input.email),
      phone: optionalString(input.phone),
      company: optionalString(input.company),
      source: optionalString(input.source) ?? "import",
      temperature,
      score,
      notes: optionalString(input.notes),
    },
  };
}
