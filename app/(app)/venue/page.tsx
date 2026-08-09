import { Suspense, type ReactNode } from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  Settings2,
  Shield,
  ShieldAlert,
  Smartphone,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { canRecoverVenueSetup, requireAdminAccess } from "@/lib/auth-session";
import {
  fetchDashboardMetrics,
  BackendDashboardMetrics,
} from "@/lib/idnight-backend";
import { Badge, EmptyState, LoadingSkeleton, SectionHeader, Surface } from "@/components/ui-kit";
import { fetchEnrolmentFunnel, fetchStuckEmbeddingJobs } from "@/lib/idnight-backend";
import { VenueCreateForm } from "@/components/venue-create-form";

function MetricCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "info" | "success" | "warning" | "danger" | "neutral";
  icon?: ReactNode;
}) {
  const toneClass = {
    info: "text-indigo-400",
    success: "text-verified",
    warning: "text-warning",
    danger: "text-rejected",
    neutral: "text-foreground",
  }[tone];

  return (
    <Surface className="p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="label-sm text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground/70">{icon}</span> : null}
      </div>
      <p className={`mt-3 text-3xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </Surface>
  );
}

async function DashboardMetrics({ token }: { token: string }) {
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
    metrics = await fetchDashboardMetrics(token);
  } catch {
    metricsError = "Métricas no disponibles — el backend todavía no está conectado.";
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <MetricCard
          label="Eventos totales"
          value={metrics.totalEvents}
          tone="neutral"
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <MetricCard
          label="Activos ahora"
          value={metrics.activeEvents}
          tone="info"
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="Ingresos hoy"
          value={metrics.admissionsToday}
          tone="neutral"
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          label="Dispositivos activos"
          value={metrics.activeDevices}
          tone="info"
          icon={<Smartphone className="h-4 w-4" />}
        />
        <MetricCard
          label="Operadores"
          value={metrics.totalOperators}
          tone="neutral"
          icon={<Shield className="h-4 w-4" />}
        />
        <MetricCard
          label="Incidentes abiertos"
          value={metrics.openIncidents}
          tone="warning"
          icon={<ShieldAlert className="h-4 w-4" />}
        />
      </div>
      {metricsError && (
        <p className="text-xs text-muted-foreground">{metricsError}</p>
      )}
    </>
  );
}

/**
 * The enrolments that stopped, shown where somebody will actually see them.
 *
 * A failure that is recorded and unread is not much better than one that was never recorded.
 * Six verified people sat in this state for two days, each of them believing they could walk
 * in, and nothing anywhere said otherwise.
 */
async function StalledEnrolments({ token }: { token: string }) {
  let stuck: Awaited<ReturnType<typeof fetchStuckEmbeddingJobs>> = [];
  try {
    stuck = await fetchStuckEmbeddingJobs(token);
  } catch {
    // Silence beats a scary empty panel: not being able to ask is not the same as nothing
    // being wrong, but it is also not something this screen can act on.
    return null;
  }

  if (stuck.length === 0) return null;

  const longest = Math.max(...stuck.map((job) => job.waitingDays));

  return (
    <Surface className="border-amber-500/40">
      <SectionHeader
        title="Enrolamientos detenidos"
        description="Estas personas verificaron su identidad y todavía no pueden ingresar con reconocimiento facial."
      />
      <p className="text-sm">
        <strong>{stuck.length}</strong> {stuck.length === 1 ? "persona" : "personas"} en espera
        {longest > 0 && <> — la más antigua hace <strong>{longest}</strong> {longest === 1 ? "día" : "días"}</>}.
      </p>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        {stuck.slice(0, 5).map((job, at) => (
          <li key={`${job.approvedAt}-${at}`}>
            {job.state} · {job.lastErrorCode ?? "sin código"} · {job.attemptCount}{" "}
            {job.attemptCount === 1 ? "intento" : "intentos"} · {job.waitingDays}d
          </li>
        ))}
      </ul>
      {stuck.length > 5 && (
        <p className="mt-1 text-xs text-muted-foreground">y {stuck.length - 5} más.</p>
      )}
    </Surface>
  );
}

/**
 * Where people stop between verifying and being able to walk in.
 *
 * The stalled panel above can never show somebody who never consented: no job is created for
 * them, so the queue is behaving correctly and the person is simply invisible. Two in a hundred
 * is ordinary. Sixty means the consent screen is frightening people — and until this existed,
 * nothing anywhere would have said so.
 */
async function EnrolmentFunnel({ token }: { token: string }) {
  let funnel: Awaited<ReturnType<typeof fetchEnrolmentFunnel>>;
  try {
    funnel = await fetchEnrolmentFunnel(token);
  } catch {
    return null;
  }

  if (funnel.verified === 0) return null;

  const share = Math.round((funnel.awaitingConsent / funnel.verified) * 100);
  // A quarter is where a rate stops being a handful of people who got distracted.
  const worrying = share >= 25;

  return (
    <Surface className={worrying ? "border-amber-500/40" : undefined}>
      <SectionHeader
        title="Del alta al ingreso"
        description="Cuánta gente llega a poder entrar con reconocimiento facial."
      />
      <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Verificados</dt>
          <dd className="text-lg font-semibold">{funnel.verified}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Consintieron</dt>
          <dd className="text-lg font-semibold">{funnel.consented}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Enrolados</dt>
          <dd className="text-lg font-semibold">{funnel.enrolled}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sin consentir</dt>
          <dd className="text-lg font-semibold">{funnel.awaitingConsent}</dd>
        </div>
      </dl>
      {worrying && (
        <p className="text-sm">
          <strong>{share}%</strong> de quienes verificaron su identidad no aceptaron el uso de su
          rostro. Vale revisar qué dice esa pantalla.
        </p>
      )}
    </Surface>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-card" />
      ))}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-border bg-card p-5 transition-colors duration-200 ease-out hover:border-primary/40"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-md border border-border bg-surface p-2.5 transition-colors duration-200 ease-out group-hover:border-primary/30 group-hover:bg-primary/10">
          <span className="text-muted-foreground transition-colors duration-200 ease-out group-hover:text-primary">
            {icon}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </Link>
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

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Mi boliche"
        title={venue.name}
        description={[venue.address, venue.city].filter(Boolean).join(", ") || "Sin dirección configurada"}
      />

      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics token={session.accessToken} />
      </Suspense>

      {/* Above the fold on purpose. Somebody who cannot get in is more urgent than a count. */}
      <Suspense fallback={null}>
        <StalledEnrolments token={session.accessToken} />
      </Suspense>

      <Suspense fallback={null}>
        <EnrolmentFunnel token={session.accessToken} />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-3">
        <Surface className="p-5">
          <div className="flex items-center justify-between">
            <p className="label-sm text-muted-foreground">Estado</p>
            <Badge label={venue.active ? "Activo" : "Inactivo"} tone={venue.active ? "success" : "warning"} />
          </div>
          <p className="mt-4 text-sm leading-6 text-foreground/80">
            Tu boliche está {venue.active ? "operativo y visible para los usuarios de seguridad." : "desactivado temporalmente."}
          </p>
        </Surface>

        <QuickLink
          href="/venue/security"
          icon={<Shield className="h-4 w-4" />}
          title="Usuarios de seguridad"
          subtitle="Gestionar personal"
        />

        <QuickLink
          href="/venue/settings"
          icon={<Settings2 className="h-4 w-4" />}
          title="Configuración"
          subtitle="Editar datos y requisitos de ingreso"
        />

        <QuickLink
          href="/venue/devices"
          icon={<Smartphone className="h-4 w-4" />}
          title="Dispositivos autorizados"
          subtitle="Controlar tablets y teléfonos habilitados"
        />
      </div>

      <Surface className="p-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Próximos pasos</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Definí usuarios de seguridad y autorizá los dispositivos que tu equipo va a usar en la puerta para operar el control de accesos desde la app mobile de ID-Night.
            </p>
          </div>
        </div>
      </Surface>
    </div>
  );
}
