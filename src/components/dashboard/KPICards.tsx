import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, DollarSign, Flame, Receipt, TrendingDown, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import type { DashboardData } from "@/lib/dashboard";

interface KPICardsProps {
  kpis: DashboardData["kpis"];
}

function TrendBadge({ trendPct }: { trendPct: number | null }) {
  if (trendPct === null) {
    return <p className="text-xs text-muted-foreground">Sin mes anterior para comparar</p>;
  }
  const up = trendPct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <p className={`flex items-center gap-1 text-xs font-medium ${up ? "text-green-600" : "text-red-600"}`}>
      <Icon className="h-3.5 w-3.5" />
      {up ? "+" : ""}
      {trendPct}% vs mes anterior
    </p>
  );
}

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ventas ganadas</CardTitle>
          <div className="rounded-lg bg-green-50 p-2"><DollarSign className="h-4 w-4 text-green-600" /></div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-bold">{formatCurrency(kpis.wonValue)}</div>
          <TrendBadge trendPct={kpis.trendPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Valor en pipeline</CardTitle>
          <div className="rounded-lg bg-purple-50 p-2"><Briefcase className="h-4 w-4 text-purple-600" /></div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-bold">{formatCurrency(kpis.pipelineValue)}</div>
          <p className="text-xs text-muted-foreground">{kpis.activeDeals} deals activos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ticket medio</CardTitle>
          <div className="rounded-lg bg-blue-50 p-2"><Receipt className="h-4 w-4 text-blue-600" /></div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-bold">{formatCurrency(kpis.averageTicket)}</div>
          <p className="text-xs text-muted-foreground">Tasa de cierre: {kpis.conversionRate}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de pérdida</CardTitle>
          <div className="rounded-lg bg-orange-50 p-2"><Target className="h-4 w-4 text-orange-600" /></div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-bold">{kpis.lossRate}%</div>
          <p className="text-xs text-muted-foreground">De los deals cerrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Leads calientes</CardTitle>
          <div className="rounded-lg bg-red-50 p-2"><Flame className="h-4 w-4 text-red-600" /></div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-bold">{kpis.hotLeads}</div>
          <p className="text-xs text-muted-foreground">de {kpis.totalContacts} contactos</p>
        </CardContent>
      </Card>

      <Link href="/activities" className="block">
        <Card className="h-full transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Seguimientos vencidos</CardTitle>
            <div className={`rounded-lg p-2 ${kpis.overdueActivities > 0 ? "bg-amber-50" : "bg-muted"}`}>
              <AlertTriangle className={`h-4 w-4 ${kpis.overdueActivities > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">{kpis.overdueActivities}</div>
            <p className="text-xs text-muted-foreground">Ver actividades</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
