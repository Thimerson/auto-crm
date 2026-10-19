import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Insight } from "@/lib/dashboard";

const STYLES: Record<Insight["level"], { icon: typeof Info; box: string; text: string }> = {
  warning: { icon: AlertTriangle, box: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  success: { icon: CheckCircle2, box: "bg-green-50 border-green-200", text: "text-green-700" },
  info: { icon: Info, box: "bg-muted border-border", text: "text-muted-foreground" },
};

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lo que conviene revisar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((insight) => {
          const style = STYLES[insight.level];
          const Icon = style.icon;
          return (
            <div key={insight.text} className={`flex items-start gap-3 rounded-lg border p-3 ${style.box}`}>
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.text}`} />
              <p className="text-sm">{insight.text}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
