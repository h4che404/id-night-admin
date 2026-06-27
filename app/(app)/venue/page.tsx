import { Shield, Settings2, Smartphone, Building2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { canRecoverVenueSetup, requireAdminAccess } from "@/lib/auth-session";
import {
  fetchDashboardMetrics,
  BackendDashboardMetrics,
} from "@/lib/idnight-backend";
import { Badge, EmptyState, SectionHeader, Surface } from "@/components/ui-kit";
import { VenueCreateForm } from "@/components/venue-create-form";

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "info" | "success" | "warning" | "danger" | "neutral";
}) {
  const toneClass = {
    info: "text-sky-300",
    success: "text-emerald-300",
    warning: "text-amber-300",
    danger: "text-rose-300",
    neutral: "text-slate-300",
  }[tone];

  return (
    <Surface className="p-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </Surface>
  );
}

export default async function VenuePage() {
  const { session, access } = await requireAdminAccess();

  if (access.state === "onboarding-needed") {
    if (!canRecoverVenueSetup(access)) {
      redirect("/owner-onboarding");
    }

    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Último paso"
          title="Creá tu boliche"
          description="Para empezar a operar, necesitás crear tu boliche. Una vez creado, vas a poder agregar usuarios de seguridad que usarán la app mobile. Si hacés el onboarding de propietario desde cero, ese flujo ya crea automáticamente tu primera organización y boliche."
        />

        <Surface className="p-6 md:p-8">
          <VenueCreateForm />
        </Surface>
      </div>
    );
  }

  if (access.state === "unauthorized") {
    redirect("/login");
  }

  if (access.state === "degraded") {
    return null;
  }

  const venue = access.venueSummary;

  /* ── Fetch metrics with graceful fallback ────────────────────── */
  let metrics: BackendDashboardMetrics = {
    venueId: "",
    totalEvents: 0,
    upcomingEvents: 0,
    activeEvents: 0,
    totalOperators: 0,
    activeDevices: 0,
    openIncidents: 0,
    totalGuestEntriesAllEvents: 0,
    admissionsToday: 0,
  };
  let metricsError: string | null = null;
  try {
    metrics = await fetchDashboardMetrics(session.accessToken);
  } catch {
    metricsError = "Metrics unavailable — backend not connected yet.";
  }

  /* ── Has venue → dashboard panel ────────────────────────────── */
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Mi boliche"
        title={venue.name}
        description={[venue.address, venue.city].filter(Boolean).join(", ") || "Sin dirección configurada"}
      />

      {/* Operational metrics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <MetricCard label="Total events" value={metrics.totalEvents} tone="info" />
        <MetricCard label="Active now" value={metrics.activeEvents} tone="success" />
        <MetricCard label="Admissions today" value={metrics.admissionsToday} tone="success" />
        <MetricCard label="Active devices" value={metrics.activeDevices} tone="info" />
        <MetricCard label="Operators" value={metrics.totalOperators} tone="neutral" />
        <MetricCard label="Open incidents" value={metrics.openIncidents} tone="neutral" />
      </div>

      {metricsError && (
        <p className="text-xs text-slate-500">{metricsError}</p>
      )}

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

        <Link
          href="/venue/devices"
          className="group panel rounded-2xl p-5 transition hover:border-sky-400/30"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-2.5 transition group-hover:border-sky-400/20 group-hover:bg-sky-400/10">
              <Smartphone className="h-4 w-4 text-slate-400 transition group-hover:text-sky-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">Dispositivos autorizados</p>
              <p className="mt-1 text-xs text-slate-500">Controlar tablets y teléfonos habilitados</p>
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
              Definí usuarios de seguridad y autorizá los dispositivos que tu equipo va a usar en la puerta para operar el control de accesos desde la app mobile de ID-Night.
            </p>
          </div>
        </div>
      </Surface>
    </div>
  );
}
