import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parsea cabecera y filas", () => {
    expect(parseCsv("name,email\nAna,ana@example.com\nLuis,luis@example.com")).toEqual([
      { name: "Ana", email: "ana@example.com" },
      { name: "Luis", email: "luis@example.com" },
    ]);
  });

  it("respeta comas y comillas dentro de campos", () => {
    const text = 'product-name,quantity\n"Taza, grande",1\n"Dice ""hola""",2';
    expect(parseCsv(text)).toEqual([
      { "product-name": "Taza, grande", quantity: "1" },
      { "product-name": 'Dice "hola"', quantity: "2" },
    ]);
  });

  it("acepta CRLF, BOM y líneas vacías al final", () => {
    const text = "﻿name,email\r\nAna,ana@example.com\r\n\r\n";
    expect(parseCsv(text)).toEqual([{ name: "Ana", email: "ana@example.com" }]);
  });

  it("devuelve lista vacía si no hay filas de datos", () => {
    expect(parseCsv("name,email")).toEqual([]);
    expect(parseCsv("")).toEqual([]);
  });
});
