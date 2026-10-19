"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import type { PipelineStageSummary } from "@/lib/dashboard";

export function PipelineChart({ data }: { data: PipelineStageSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Embudo del pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No hay etapas en el pipeline</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, data.length * 52)}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 24, bottom: 5, left: 8 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, _name, item) => [
                  `${formatCurrency(Number(value))} · ${item?.payload?.count ?? 0} deals`,
                  "Valor",
                ]}
                contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
