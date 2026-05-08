import { redirect } from "next/navigation";
import { ShieldAlert, Waypoints } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { Badge, Surface } from "@/components/ui-kit";
import { readBackendSession } from "@/lib/auth-session";

export default async function LoginPage() {
  const session = await readBackendSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="status-grid flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-6xl gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
        <Surface className="p-8 md:p-10">
          <div className="flex items-center gap-3">
            <div className="glow-ring flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10">
              <ShieldAlert className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">ID-Night</p>
              <h1 className="text-2xl font-semibold text-slate-50">Admin Access</h1>
            </div>
          </div>

          <LoginForm />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Conexion Azure</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                La app entra por proxy server-side para evitar el bloqueo CORS del backend actual.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cobertura real</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Auth admin, venues, operadores, dispositivos, accesos, incidentes, alertas y auditoria ya salen del backend publicado.
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="overflow-hidden p-0">
          <div className="border-b border-slate-800/80 px-8 py-8">
            <Badge label="Consola operativa premium" tone="info" />
            <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-slate-50">
              Control serio, claro y trazable para la operacion nocturna.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              Disenada para supervisar accesos, revisar incidentes, gestionar operadores y sostener una decision
              operativa profesional en boliches, bares masivos y eventos.
            </p>
          </div>

          <div className="grid gap-5 p-8 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Centro de comando</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-50">Vista operacional en tiempo real</p>
                </div>
                <Waypoints className="h-5 w-5 text-slate-500" />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  ["Incidentes abiertos", "7", "danger"],
                  ["Alertas activas", "19", "warning"],
                  ["Operadores conectados", "23", "success"],
                  ["Accesos hoy", "1.284", "info"],
                ].map(([label, value, tone]) => (
                  <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <Badge label={label} tone={tone as "danger" | "warning" | "success" | "info"} />
                    <p className="mt-6 text-3xl font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/30 p-6">
                <p className="text-sm font-medium text-slate-50">Cola prioritaria de supervision</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
                    <p className="text-sm font-medium text-rose-100">Incidente critico en Sala Prisma</p>
                    <p className="mt-2 text-sm leading-6 text-rose-100/80">Requiere cierre de supervisor antes del siguiente acceso asociado.</p>
                  </div>
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                    <p className="text-sm font-medium text-amber-100">Acceso solo para operadores admin o supervisor</p>
                    <p className="mt-2 text-sm leading-6 text-amber-100/80">Los operadores guardia no pueden entrar al panel web administrativo.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/30 p-6">
                <p className="text-sm font-medium text-slate-50">Trazabilidad visible</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Cada cambio relevante queda ligado a una entidad, un responsable y un contexto de operacion.
                </p>
              </div>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
