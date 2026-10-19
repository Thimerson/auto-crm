import { db } from "@/db";
import { contacts, deals, activities, pipelineStages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { KPICards } from "@/components/dashboard/KPICards";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { SourceMixChart } from "@/components/dashboard/SourceMixChart";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { NotificationBanner } from "@/components/dashboard/NotificationBanner";
import { buildDashboard } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const data = buildDashboard({
    stages: db.select().from(pipelineStages).all(),
    deals: db
      .select({ id: deals.id, value: deals.value, stageId: deals.stageId, createdAt: deals.createdAt })
      .from(deals)
      .all(),
    contacts: db.select({ source: contacts.source, temperature: contacts.temperature }).from(contacts).all(),
    activities: db
      .select({ scheduledAt: activities.scheduledAt, completedAt: activities.completedAt })
      .from(activities)
      .all(),
    now: new Date(),
  });

  const recentActivities = db
    .select({
      id: activities.id,
      type: activities.type,
      description: activities.description,
      contactName: contacts.name,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .leftJoin(contacts, eq(activities.contactId, contacts.id))
    .orderBy(desc(activities.createdAt))
    .limit(5)
    .all();

  const isFirstRun = data.kpis.totalContacts === 0 && data.kpis.activeDeals === 0 && data.kpis.wonValue === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de tu pipeline de ventas · mes de referencia {data.referenceMonth}
          </p>
        </div>
        <QuickActions />
      </div>

      {isFirstRun && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
          <h2 className="mb-2 text-lg font-semibold">Bienvenido a Auto-CRM</h2>
          <p className="mb-4 text-sm text-muted-foreground">Tu CRM esta listo. Aqui tienes como comenzar:</p>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-3">
              <p className="font-medium">1. Personaliza tu CRM</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ejecuta <code className="rounded bg-muted px-1">/setup</code> en Claude Code
              </p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="font-medium">2. Agrega contactos</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ve a Contactos o usa <code className="rounded bg-muted px-1">/add-lead</code>
              </p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="font-medium">3. Carga datos demo</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ejecuta <code className="rounded bg-muted px-1">npm run seed</code> en terminal
              </p>
            </div>
          </div>
        </div>
      )}

      <NotificationBanner />

      <KPICards kpis={data.kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesTrendChart data={data.monthlySales} />
        </div>
        <InsightsPanel insights={data.insights} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PipelineChart data={data.pipeline} />
        </div>
        <SourceMixChart data={data.sourceMix} />
      </div>

      <RecentActivity
        activities={
          recentActivities as Array<{
            id: string;
            type: string;
            description: string;
            contactName: string | null;
            createdAt: number | Date;
          }>
        }
      />
    </div>
  );
}
