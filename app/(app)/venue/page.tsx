import { Building2, Shield, Settings2 } from "lucide-react";
import Link from "next/link";

import { requireBackendSession } from "@/lib/auth-session";
import { fetchAdminProfile, fetchMyVenue, BackendApiError } from "@/lib/idnight-backend";
import { Badge, EmptyState, SectionHeader, Surface } from "@/components/ui-kit";
import { VenueCreateForm } from "@/components/venue-create-form";

export default async function VenuePage() {
  const session = await requireBackendSession();
  const profile = await fetchAdminProfile(session.accessToken);

  let venue = null;
  try {
    venue = await fetchMyVenue(session.accessToken);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      venue = null;
    } else {
      // For other errors (backend not supporting this endpoint yet), show create form
      venue = null;
    }
  }

  /* ── No venue yet → onboarding ──────────────────────────────── */
  if (!venue) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow={`Hola, ${profile.firstName}`}
          title="Creá tu boliche"
          description="Para empezar a operar, necesitás crear tu boliche. Una vez creado, vas a poder agregar usuarios de seguridad que usarán la app mobile. Si hacés el onboarding de propietario desde cero, ese flujo ya crea automáticamente tu primera organización y boliche."
        />

        <Surface className="p-6 md:p-8">
          <VenueCreateForm />
        </Surface>
      </div>
    );
  }

  /* ── Has venue → dashboard panel ────────────────────────────── */
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Mi boliche"
        title={venue.name}
        description={[venue.address, venue.city].filter(Boolean).join(", ") || "Sin dirección configurada"}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Surface className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Estado</p>
            <Badge label={venue.active ? "Activo" : "Inactivo"} tone={venue.active ? "success" : "warning"} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Tu boliche está {venue.active ? "operativo y visible para los usuarios de seguridad." : "desactivado temporalmente."}
          </p>
        </Surface>

        <Link
          href="/venue/security"
          className="group panel rounded-2xl p-5 transition hover:border-sky-400/30"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-2.5 transition group-hover:border-sky-400/20 group-hover:bg-sky-400/10">
              <Shield className="h-4 w-4 text-slate-400 transition group-hover:text-sky-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">Usuarios de seguridad</p>
              <p className="mt-1 text-xs text-slate-500">Gestionar personal</p>
            </div>
          </div>
        </Link>

        <Link
          href="/venue/settings"
          className="group panel rounded-2xl p-5 transition hover:border-sky-400/30"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-2.5 transition group-hover:border-sky-400/20 group-hover:bg-sky-400/10">
              <Settings2 className="h-4 w-4 text-slate-400 transition group-hover:text-sky-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">Configuración</p>
              <p className="mt-1 text-xs text-slate-500">Editar datos y requisitos de ingreso</p>
            </div>
          </div>
        </Link>
      </div>

      <Surface className="p-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-100">Próximos pasos</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Creá usuarios de seguridad para que tu equipo pueda operar el escaneo y control de accesos desde la app mobile de ID-Night.
            </p>
          </div>
        </div>
      </Surface>
    </div>
  );
}
