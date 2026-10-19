import { describe, expect, it } from "vitest";
import { isDuplicate, normalizeEmail, normalizePhone } from "./dedupe";

describe("normalizeEmail", () => {
  it("pasa a minúsculas y quita espacios", () => {
    expect(normalizeEmail("  Ana@Example.COM ")).toBe("ana@example.com");
  });

  it("devuelve null si está vacío", () => {
    expect(normalizeEmail("   ")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("normalizePhone", () => {
  it("deja solo dígitos", () => {
    expect(normalizePhone("+34 612-345-678")).toBe("34612345678");
  });

  it("devuelve null si quedan menos de 6 dígitos", () => {
    expect(normalizePhone("12-34")).toBeNull();
  });
});

describe("isDuplicate", () => {
  const existing = [
    { email: "ana@example.com", phone: "34612345678" },
    { email: null, phone: "34699999999" },
  ];

  it("detecta duplicado por email sin importar mayúsculas", () => {
    expect(isDuplicate({ email: "ANA@example.com", phone: null }, existing)).toBe(true);
  });

  it("detecta duplicado por teléfono aunque tenga otro formato", () => {
    expect(isDuplicate({ email: null, phone: "+34 699 999 999" }, existing)).toBe(true);
  });

  it("no marca duplicado si no coincide ningún dato", () => {
    expect(isDuplicate({ email: "otra@example.com", phone: "34611111111" }, existing)).toBe(false);
  });

  it("no marca duplicado si el candidato no tiene email ni teléfono", () => {
    expect(isDuplicate({ email: null, phone: null }, existing)).toBe(false);
  });
});
