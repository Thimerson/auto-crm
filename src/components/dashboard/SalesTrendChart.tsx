"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import type { MonthlySales } from "@/lib/dashboard";

const SHORT_MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function shortLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${SHORT_MONTHS[month - 1]} ${String(year).slice(2)}`;
}

export function SalesTrendChart({ data }: { data: MonthlySales[] }) {
  const chartData = data.map((m) => ({ label: shortLabel(m.month), euros: m.won / 100, count: m.count }));
  const hasSales = data.some((m) => m.won > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ventas ganadas por mes</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasSales ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay ventas ganadas</p>
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
