import { timingSafeEqual } from "node:crypto";

export type SecretCheck = "ok" | "invalid" | "not_configured";

// Compara en tiempo constante para no filtrar el secret por tiempos de respuesta
export function checkSecret(input: {
  provided: string | null | undefined;
  expected: string | null | undefined;
}): SecretCheck {
  const { provided, expected } = input;
  if (!expected) return "not_configured";
  if (!provided) return "invalid";

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return "invalid";

  return timingSafeEqual(a, b) ? "ok" : "invalid";
}
