export function normalizeEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase();
  return email ? email : null;
}

// Solo dígitos. Menos de 6 dígitos no sirve para identificar a alguien.
export function normalizePhone(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 6 ? digits : null;
}

export interface ContactKey {
  email: string | null;
  phone: string | null;
}

// Duplicado si coincide el email o el teléfono normalizados.
export function isDuplicate(candidate: ContactKey, existing: ContactKey[]): boolean {
  const email = normalizeEmail(candidate.email);
  const phone = normalizePhone(candidate.phone);

  return existing.some(
    (c) =>
      (email !== null && normalizeEmail(c.email) === email) ||
      (phone !== null && normalizePhone(c.phone) === phone)
  );
}
