"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SOURCE_LABELS } from "@/lib/constants";

const PALETTE = ["#2563eb", "#16a34a", "#ea580c", "#8b5cf6", "#dc2626", "#0891b2", "#ca8a04", "#64748b"];

export function SourceMixChart({ data }: { data: Array<{ source: string; count: number }> }) {
  const chartData = data.map((d) => ({
    name: (SOURCE_LABELS as Record<string, string>)[d.source] ?? d.source,
    value: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fuentes de contactos</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin contactos todavía</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {chartData.map((entry, i) => (
                  <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--card)" }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
