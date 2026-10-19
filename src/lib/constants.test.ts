import { describe, expect, it } from "vitest";
import { formatCurrency } from "./constants";

describe("formatCurrency", () => {
  it("formatea céntimos como euros", () => {
    expect(formatCurrency(1999)).toMatch(/^19,99\s€$/);
  });

  it("usa formato español (coma decimal)", () => {
    expect(formatCurrency(123450)).toMatch(/^1\.?234,50\s€$/);
  });
});
