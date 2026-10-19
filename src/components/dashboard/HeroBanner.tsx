import { formatCurrency } from "@/lib/constants";
import type { ReactNode } from "react";

interface HeroBannerProps {
  wonValue: number;
  pipelineValue: number;
  activeDeals: number;
  referenceMonth: string;
  children?: ReactNode;
}

// Encabezado del dashboard: titular grande con un halo azul en la base, al estilo de las CTA de referencia.
export function HeroBanner({ wonValue, pipelineValue, activeDeals, referenceMonth, children }: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-blue-500/25 via-blue-400/10 to-transparent blur-2xl"
      />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          Dashboard · {referenceMonth}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-600 md:text-5xl">
          Tu pipeline, de un vistazo
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {formatCurrency(wonValue)} ganados · {formatCurrency(pipelineValue)} en {activeDeals} deals activos
        </p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
