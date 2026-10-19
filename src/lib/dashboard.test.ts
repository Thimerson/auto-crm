import { describe, expect, it } from "vitest";
import { buildDashboard, sliceSales, type DashboardInput } from "./dashboard";

const stages = [
  { id: "prospecto", name: "Prospecto", color: "#64748b", order: 1, isWon: false, isLost: false },
  { id: "negociacion", name: "Negociacion", color: "#ea580c", order: 4, isWon: false, isLost: false },
  { id: "ganado", name: "Cerrado Ganado", color: "#16a34a", order: 5, isWon: true, isLost: false },
  { id: "perdido", name: "Cerrado Perdido", color: "#dc2626", order: 6, isWon: false, isLost: true },
];

const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

function input(overrides: Partial<DashboardInput> = {}): DashboardInput {
  return {
    stages,
    deals: [
      { id: "d1", value: 10000, stageId: "ganado", createdAt: day(2025, 11, 5) },
      { id: "d2", value: 30000, stageId: "ganado", createdAt: day(2025, 12, 10) },
      { id: "d3", value: 20000, stageId: "ganado", createdAt: day(2025, 10, 1) },
      { id: "d4", value: 5000, stageId: "perdido", createdAt: day(2025, 12, 20) },
      { id: "d5", value: 7000, stageId: "prospecto", createdAt: day(2025, 12, 1) },
      { id: "d6", value: 3000, stageId: "negociacion", createdAt: day(2025, 12, 2) },
    ],
    contacts: [
      { source: "web", temperature: "hot" },
      { source: "web", temperature: "cold" },
      { source: "referido", temperature: "hot" },
    ],
    activities: [],
    now: day(2025, 12, 31),
    ...overrides,
  };
}

describe("buildDashboard KPIs", () => {
  it("calcula pipeline, ganado, ticket medio y tasas de cierre y pérdida", () => {
    const { kpis } = buildDashboard(input());

    expect(kpis.totalContacts).toBe(3);
    expect(kpis.hotLeads).toBe(2);
    expect(kpis.activeDeals).toBe(2);
    expect(kpis.pipelineValue).toBe(10000);
    expect(kpis.wonValue).toBe(60000);
    expect(kpis.averageTicket).toBe(20000);
    expect(kpis.conversionRate).toBe(75);
    expect(kpis.lossRate).toBe(25);
  });

  it("devuelve ceros sin datos", () => {
    const { kpis, monthlySales, insights } = buildDashboard(
      input({ deals: [], contacts: [], activities: [] })
    );
    expect(kpis.wonValue).toBe(0);
    expect(kpis.averageTicket).toBe(0);
    expect(kpis.conversionRate).toBe(0);
    expect(kpis.trendPct).toBeNull();
    expect(monthlySales).toHaveLength(12);
    expect(insights).toEqual([{ level: "info", text: "Sin datos suficientes todavía" }]);
  });
});

describe("buildDashboard monthly sales", () => {
  it("devuelve 12 meses terminando en el último mes con datos, con meses vacíos en cero", () => {
    const { monthlySales } = buildDashboard(input());

    expect(monthlySales).toHaveLength(12);
    expect(monthlySales[0].month).toBe("2025-01");
    expect(monthlySales[11].month).toBe("2025-12");
    expect(monthlySales.find((m) => m.month === "2025-12")).toMatchObject({ won: 30000, count: 1 });
    expect(monthlySales.find((m) => m.month === "2025-11")).toMatchObject({ won: 10000, count: 1 });
    expect(monthlySales.find((m) => m.month === "2025-01")).toMatchObject({ won: 0, count: 0 });
  });

  it("compara el último mes con datos contra el mes anterior", () => {
    const { kpis, insights } = buildDashboard(input());

    expect(kpis.wonValueThisMonth).toBe(30000);
    expect(kpis.wonValuePrevMonth).toBe(10000);
    expect(kpis.trendPct).toBe(200);
    expect(insights).toContainEqual(
      expect.objectContaining({ level: "success", text: expect.stringContaining("200%") })
    );
  });

  it("deja la tendencia en null si el mes anterior no tuvo ventas", () => {
    const { kpis } = buildDashboard(
      input({
        deals: [{ id: "x", value: 1000, stageId: "ganado", createdAt: day(2025, 12, 3) }],
      })
    );
    expect(kpis.trendPct).toBeNull();
  });
});

describe("buildDashboard pipeline and sources", () => {
  it("lista etapas abiertas y ganadas en orden, sin las perdidas", () => {
    const { pipeline } = buildDashboard(input());
    expect(pipeline.map((p) => p.name)).toEqual(["Prospecto", "Negociacion", "Cerrado Ganado"]);
    expect(pipeline.find((p) => p.name === "Prospecto")).toMatchObject({ count: 1, value: 7000 });
  });

  it("cuenta contactos por fuente de mayor a menor", () => {
    const { sourceMix } = buildDashboard(input());
    expect(sourceMix).toEqual([
      { source: "web", count: 2 },
      { source: "referido", count: 1 },
    ]);
  });
});

describe("buildDashboard insights", () => {
  it("avisa de caída de ventas frente al mes anterior", () => {
    const { insights } = buildDashboard(
      input({
        deals: [
          { id: "a", value: 10000, stageId: "ganado", createdAt: day(2025, 11, 3) },
          { id: "b", value: 8000, stageId: "ganado", createdAt: day(2025, 12, 3) },
        ],
      })
    );
    expect(insights).toContainEqual(
      expect.objectContaining({ level: "warning", text: expect.stringContaining("20%") })
    );
  });

  it("avisa cuando los 10 deals más grandes concentran más del 30% del valor ganado", () => {
    const { insights } = buildDashboard(input());
    expect(insights).toContainEqual(
      expect.objectContaining({ level: "warning", text: expect.stringContaining("concentran") })
    );
  });

  it("avisa cuando la tasa de pérdida supera el 10%", () => {
    const { insights } = buildDashboard(input());
    expect(insights).toContainEqual(
      expect.objectContaining({ level: "warning", text: expect.stringContaining("25%") })
    );
  });

  it("cuenta seguimientos vencidos: programados en el pasado y sin completar", () => {
    const { kpis, insights } = buildDashboard(
      input({
        activities: [
          { scheduledAt: day(2025, 12, 1), completedAt: null },
          { scheduledAt: day(2026, 1, 5), completedAt: null },
          { scheduledAt: day(2025, 12, 2), completedAt: day(2025, 12, 2) },
        ],
      })
    );
    expect(kpis.overdueActivities).toBe(1);
    expect(insights).toContainEqual(
      expect.objectContaining({ level: "warning", text: expect.stringContaining("1 seguimiento") })
    );
  });
});

describe("salesSeries and sliceSales", () => {
  it("serie completa desde el primer mes ganado hasta el mes de referencia, sin huecos", () => {
    const { salesSeries } = buildDashboard(input());
    expect(salesSeries.map((m) => m.month)).toEqual(["2025-10", "2025-11", "2025-12"]);
    expect(salesSeries[0]).toMatchObject({ won: 20000, count: 1 });
  });

  it("sliceSales recorta N meses hasta el mes final", () => {
    const series = [
      { month: "2025-01", won: 1, count: 1 },
      { month: "2025-02", won: 2, count: 1 },
      { month: "2025-03", won: 3, count: 1 },
      { month: "2025-04", won: 4, count: 1 },
    ];
    expect(sliceSales(series, "2025-04", 2).map((m) => m.month)).toEqual(["2025-03", "2025-04"]);
    expect(sliceSales(series, "2025-03", null).map((m) => m.month)).toEqual(["2025-01", "2025-02", "2025-03"]);
  });

  it("sliceSales ajusta el mes final si queda fuera del rango", () => {
    const series = [{ month: "2025-01", won: 1, count: 1 }, { month: "2025-02", won: 2, count: 1 }];
    expect(sliceSales(series, "2030-01", 6).map((m) => m.month)).toEqual(["2025-01", "2025-02"]);
  });
});
