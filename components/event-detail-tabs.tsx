"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { segment: "", label: "Resumen" },
  { segment: "entries", label: "Ingresos" },
  { segment: "entry-photos", label: "Fotos de ingreso" },
  { segment: "guest-list", label: "Lista de invitados" },
  { segment: "incidents", label: "Incidentes" },
  { segment: "operators", label: "Operadores" },
  { segment: "report", label: "Reporte" },
] as const;

export function EventDetailTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const basePath = `/venue/events/${eventId}`;

  return (
    <nav aria-label="Secciones del evento" className="border-b border-border">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;
          const active = tab.segment
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === basePath;

          return (
            <li key={tab.label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-200 ease-out",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
