// Agregados del dashboard. Funciones puras: reciben filas ya cargadas y devuelven KPIs, series e insights.
// Importes en céntimos.

export interface DashboardStage {
  id: string;
  name: string;
  color: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
}

export interface DashboardDeal {
  id: string;
  value: number;
  stageId: string;
  createdAt: Date;
}

export interface DashboardInput {
  stages: DashboardStage[];
  deals: DashboardDeal[];
  contacts: Array<{ source: string; temperature: string }>;
  activities: Array<{ scheduledAt: Date | null; completedAt: Date | null }>;
  now: Date;
}

export interface MonthlySales {
  month: string; // YYYY-MM
  won: number;
  count: number;
}

export interface PipelineStageSummary {
  name: string;
  color: string;
  count: number;
  value: number;
}

export interface Insight {
  level: "info" | "success" | "warning";
  text: string;
}

export interface DashboardData {
  kpis: {
    totalContacts: number;
    hotLeads: number;
    activeDeals: number;
    pipelineValue: number;
    wonValue: number;
    wonValueThisMonth: number;
    wonValuePrevMonth: number;
    trendPct: number | null;
    averageTicket: number;
    conversionRate: number;
    lossRate: number;
    overdueActivities: number;
  };
  monthlySales: MonthlySales[];
  pipeline: PipelineStageSummary[];
  sourceMix: Array<{ source: string; count: number }>;
  insights: Insight[];
  referenceMonth: string;
}

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function monthKey(year: number, monthIndex: number): string {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function buildDashboard(input: DashboardInput): DashboardData {
  const { stages, deals, contacts, activities, now } = input;

  const stageById = new Map(stages.map((s) => [s.id, s]));
  const wonDeals = deals.filter((d) => stageById.get(d.stageId)?.isWon);
  const lostDeals = deals.filter((d) => stageById.get(d.stageId)?.isLost);
  const activeDealList = deals.filter((d) => {
    const stage = stageById.get(d.stageId);
    return stage && !stage.isWon && !stage.isLost;
  });

  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const pipelineValue = activeDealList.reduce((sum, d) => sum + d.value, 0);
  const closed = wonDeals.length + lostDeals.length;

  // Mes de referencia: el último con deals, para no comparar contra meses vacíos.
  const latest = deals.reduce<Date | null>(
    (max, d) => (!max || d.createdAt > max ? d.createdAt : max),
    null
  );
  const reference = latest ?? now;
  const refYear = reference.getUTCFullYear();
  const refMonth = reference.getUTCMonth();
  const refKey = monthKey(refYear, refMonth);
  const prevKey = monthKey(refYear, refMonth - 1);

  const wonByMonth = new Map<string, { won: number; count: number }>();
  for (const d of wonDeals) {
    const key = monthKey(d.createdAt.getUTCFullYear(), d.createdAt.getUTCMonth());
    const entry = wonByMonth.get(key) ?? { won: 0, count: 0 };
    entry.won += d.value;
    entry.count += 1;
    wonByMonth.set(key, entry);
  }

  const monthlySales: MonthlySales[] = [];
  for (let i = 11; i >= 0; i--) {
    const key = monthKey(refYear, refMonth - i);
    const entry = wonByMonth.get(key);
    monthlySales.push({ month: key, won: entry?.won ?? 0, count: entry?.count ?? 0 });
  }

  const wonValueThisMonth = wonByMonth.get(refKey)?.won ?? 0;
  const wonValuePrevMonth = wonByMonth.get(prevKey)?.won ?? 0;
  const trendPct =
    wonValuePrevMonth > 0
      ? Math.round(((wonValueThisMonth - wonValuePrevMonth) / wonValuePrevMonth) * 100)
      : null;

  const overdueActivities = activities.filter(
    (a) => a.scheduledAt !== null && a.scheduledAt < now && a.completedAt === null
  ).length;

  const kpis = {
    totalContacts: contacts.length,
    hotLeads: contacts.filter((c) => c.temperature === "hot").length,
    activeDeals: activeDealList.length,
    pipelineValue,
    wonValue,
    wonValueThisMonth,
    wonValuePrevMonth,
    trendPct,
    averageTicket: wonDeals.length > 0 ? Math.round(wonValue / wonDeals.length) : 0,
    conversionRate: percent(wonDeals.length, closed),
    lossRate: percent(lostDeals.length, closed),
    overdueActivities,
  };

  const pipeline: PipelineStageSummary[] = stages
    .filter((s) => !s.isLost)
    .sort((a, b) => a.order - b.order)
    .map((stage) => {
      const inStage = deals.filter((d) => d.stageId === stage.id);
      return {
        name: stage.name,
        color: stage.color,
        count: inStage.length,
        value: inStage.reduce((sum, d) => sum + d.value, 0),
      };
    });

  const sourceCounts = new Map<string, number>();
  for (const c of contacts) {
    sourceCounts.set(c.source, (sourceCounts.get(c.source) ?? 0) + 1);
  }
  const sourceMix = [...sourceCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));

  return {
    kpis,
    monthlySales,
    pipeline,
    sourceMix,
    insights: buildInsights({ kpis, wonDeals, monthlySales, refKey }),
    referenceMonth: refKey,
  };
}

function buildInsights(args: {
  kpis: DashboardData["kpis"];
  wonDeals: DashboardDeal[];
  monthlySales: MonthlySales[];
  refKey: string;
}): Insight[] {
  const { kpis, wonDeals, refKey } = args;
  const insights: Insight[] = [];

  if (kpis.totalContacts === 0 && kpis.activeDeals === 0 && wonDeals.length === 0) {
    return [{ level: "info", text: "Sin datos suficientes todavía" }];
  }

  if (kpis.trendPct !== null && kpis.trendPct <= -10) {
    insights.push({
      level: "warning",
      text: `Las ventas de ${monthLabel(refKey)} bajaron ${Math.abs(kpis.trendPct)}% frente al mes anterior`,
    });
  } else if (kpis.trendPct !== null && kpis.trendPct >= 10) {
    insights.push({
      level: "success",
      text: `Las ventas de ${monthLabel(refKey)} suben ${kpis.trendPct}% frente al mes anterior`,
    });
  }

  if (kpis.wonValue > 0 && wonDeals.length > 0) {
    const top10 = [...wonDeals]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .reduce((sum, d) => sum + d.value, 0);
    const share = percent(top10, kpis.wonValue);
    if (share > 30) {
      insights.push({
        level: "warning",
        text: `Los 10 deals más grandes concentran ${share}% del valor ganado`,
      });
    }
  }

  if (kpis.lossRate > 10) {
    insights.push({
      level: "warning",
      text: `${kpis.lossRate}% de los deals cerrados se perdieron`,
    });
  }

  if (kpis.overdueActivities > 0) {
    const n = kpis.overdueActivities;
    insights.push({
      level: "warning",
      text: `${n} ${n === 1 ? "seguimiento vencido" : "seguimientos vencidos"}`,
    });
  }

  if (insights.length === 0) {
    insights.push({ level: "info", text: "Sin alertas por ahora" });
  }
  return insights;
}
