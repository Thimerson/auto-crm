"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import { sliceSales, type MonthlySales } from "@/lib/dashboard";

const SHORT_MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const RANGES: Array<{ label: string; months: number | null }> = [
  { label: "6 meses", months: 6 },
  { label: "12 meses", months: 12 },
  { label: "24 meses", months: 24 },
  { label: "Todo", months: null },
];

function shortLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${SHORT_MONTHS[month - 1]} ${String(year).slice(2)}`;
}

interface SalesTrendChartProps {
  series: MonthlySales[];
  referenceMonth: string;
}

export function SalesTrendChart({ series, referenceMonth }: SalesTrendChartProps) {
  const [months, setMonths] = useState<number | null>(12);
  const [endMonth, setEndMonth] = useState<string>(referenceMonth);

  const data = useMemo(() => sliceSales(series, endMonth, months), [series, endMonth, months]);
  const chartData = data.map((m) => ({ label: shortLabel(m.month), euros: m.won / 100 }));
  const hasSales = data.some((m) => m.won > 0);
  const total = data.reduce((sum, m) => sum + m.won, 0);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Ventas ganadas por mes</CardTitle>
          {series.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {RANGES.map((range) => (
                <Button
                  key={range.label}
                  size="sm"
                  variant={months === range.months ? "default" : "outline"}
                  aria-pressed={months === range.months}
                  onClick={() => setMonths(range.months)}
                >
                  {range.label}
                </Button>
              ))}
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Hasta
                <select
                  className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                >
                  {series
                    .slice()
                    .reverse()
                    .map((m) => (
                      <option key={m.month} value={m.month}>
                        {shortLabel(m.month)}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          )}
        </div>
        {hasSales && (
          <p className="text-sm text-muted-foreground">
            Total del periodo: <span className="font-medium text-foreground">{formatCurrency(total)}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        {series.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay ventas ganadas</p>
        ) : !hasSales ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin ventas en este periodo</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k €`}
                width={56}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value) * 100), "Ventas"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
              />
              <Area type="monotone" dataKey="euros" stroke="#16a34a" strokeWidth={2} fill="url(#salesFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
