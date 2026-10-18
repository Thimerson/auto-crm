import { describe, expect, it } from "vitest";
import { normalizeImportContact, MAX_IMPORT_CONTACTS } from "./import";

describe("normalizeImportContact", () => {
  it("acepta un contacto válido y conserva sus campos", () => {
    const result = normalizeImportContact({
      name: "  Ana López ",
      email: "ana@example.com",
      temperature: "hot",
      score: 80,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Ana López");
      expect(result.value.temperature).toBe("hot");
      expect(result.value.score).toBe(80);
    }
  });

  it("rechaza entradas que no son objetos", () => {
    expect(normalizeImportContact(null).ok).toBe(false);
    expect(normalizeImportContact("texto").ok).toBe(false);
    expect(normalizeImportContact(42).ok).toBe(false);
  });

  it("rechaza nombre vacío o ausente", () => {
    expect(normalizeImportContact({}).ok).toBe(false);
    expect(normalizeImportContact({ name: "   " }).ok).toBe(false);
    expect(normalizeImportContact({ name: 123 }).ok).toBe(false);
  });

  it("usa 'cold' cuando la temperatura no está en la lista permitida", () => {
    const result = normalizeImportContact({ name: "Luis", temperature: "boiling" });
    expect(result.ok && result.value.temperature).toBe("cold");
  });

  it("fija el score entre 0 y 100 y usa 0 si no es entero", () => {
    const high = normalizeImportContact({ name: "A", score: 500 });
    const low = normalizeImportContact({ name: "B", score: -20 });
    const text = normalizeImportContact({ name: "C", score: "alto" });
    expect(high.ok && high.value.score).toBe(100);
    expect(low.ok && low.value.score).toBe(0);
    expect(text.ok && text.value.score).toBe(0);
  });

  it("expone el límite máximo de importación", () => {
    expect(MAX_IMPORT_CONTACTS).toBe(1000);
  });
});
