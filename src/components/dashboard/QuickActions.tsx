import Link from "next/link";
import { Briefcase, Columns3, ListChecks, Plus, Settings, Users } from "lucide-react";

const ACTIONS = [
  { href: "/contacts", label: "Contactos", icon: Users },
  { href: "/deals", label: "Nuevo deal", icon: Plus },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/activities", label: "Actividades", icon: ListChecks },
  { href: "/deals", label: "Deals", icon: Briefcase },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

// Botones en pastilla oscura con borde y brillo azul, inspirados en los botones de Uiverse.
const BUTTON =
  "inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white ring-1 ring-blue-500/40 shadow-[0_0_14px_-3px_rgba(59,130,246,0.7)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_22px_-3px_rgba(59,130,246,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:bg-slate-800";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <Link key={action.label} href={action.href} className={BUTTON}>
          <action.icon className="mr-1.5 h-4 w-4" />
          {action.label}
        </Link>
      ))}
    </div>
  );
}
