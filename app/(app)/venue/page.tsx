import { Shield, Settings2, Smartphone, Building2 } from "lucide-react";
import Link from "next/link";

import { requireBackendSession } from "@/lib/auth-session";
import {
  fetchAdminProfile,
  fetchMyVenue,
  fetchDashboardMetrics,
  BackendApiError,
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
  const session = await requireBackendSession();

  let profile = null;
  try {
    profile = await fetchAdminProfile(session.accessToken);
  } catch {
    // backend unreachable or user not authorized — show degraded state
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Mi boliche"
          title="Panel de administración"
          description="El servicio no está disponible en este momento. Intentá de nuevo en unos segundos."
        />
      </div>
    );
  }

  let venue = null;
  try {
    venue = await fetchMyVenue(session.accessToken);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      venue = null;
    } else {
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

  /* ── Fetch metrics with graceful fallback ────────────────────── */
  let metrics: BackendDashboardMetrics = {
    eventsToday: 0,
    activeEventsNow: 0,
    admissionsToday: 0,
    rejectionsToday: 0,
    warningsToday: 0,
    openIncidents: 0,
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
        <MetricCard label="Events today" value={metrics.eventsToday} tone="info" />
        <MetricCard label="Active now" value={metrics.activeEventsNow} tone="success" />
        <MetricCard label="Admissions today" value={metrics.admissionsToday} tone="success" />
        <MetricCard label="Rejections today" value={metrics.rejectionsToday} tone="danger" />
        <MetricCard label="Warnings today" value={metrics.warningsToday} tone="warning" />
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
