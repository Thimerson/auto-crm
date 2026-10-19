import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Briefcase, Columns3, ListChecks, Plus, Settings, Users } from "lucide-react";

const ACTIONS = [
  { href: "/contacts", label: "Contactos", icon: Users },
  { href: "/deals", label: "Nuevo deal", icon: Plus },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/activities", label: "Actividades", icon: ListChecks },
  { href: "/deals", label: "Deals", icon: Briefcase },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <action.icon className="mr-1.5 h-4 w-4" />
          {action.label}
        </Link>
      ))}
    </div>
  );
}
