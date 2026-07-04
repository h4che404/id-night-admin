import { AppShell } from "@/components/app-shell";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";

import { requireAdminAccess, canRecoverVenueSetup } from "@/lib/auth-session";
import { reactivateOperator, BackendApiError } from "@/lib/idnight-backend";
import { ACCESS_COOKIE } from "@/lib/auth-session";
import { getAdminSessionCacheTag } from "@/lib/admin-session-access";

function extractJwtSub(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return (JSON.parse(json) as { sub?: string }).sub ?? null;
  } catch {
    return null;
  }
}

async function reactivateOperatorAction() {
  "use server";
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) redirect("/login");
  try {
    await reactivateOperator(token);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 409) {
      // already active — just go to venue
    } else {
      throw error;
    }
  }
  const sub = extractJwtSub(token);
  if (sub) updateTag(getAdminSessionCacheTag(sub));
  redirect("/venue");
}

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { access } = await requireAdminAccess();

  if (access.state === "onboarding-needed") {
    if (!canRecoverVenueSetup(access)) {
      redirect("/owner-onboarding");
    }

    return (
      <AppShell
        userName={access.onboarding.organizationName ?? "Administrador autenticado"}
        userEmail="Sesión disponible"
        organizationName={access.onboarding.organizationName ?? undefined}
        membershipRole={access.onboarding.operatorRole}
      >
        {children}
      </AppShell>
    );
  }

  if (access.state === "unauthorized") {
    redirect("/login");
  }

  if (access.state === "degraded") {
    const isOperatorInactive = access.reason === "operator-inactive";

    return (
      <AppShell
        userName={access.identity?.fullName ?? "Administrador autenticado"}
        userEmail={access.identity?.email ?? "Sesión disponible"}
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6 text-slate-100">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">Acceso degradado</p>
            {isOperatorInactive ? (
              <>
                <h1 className="mt-3 text-2xl font-semibold text-slate-50">Tu cuenta de operador fue desactivada</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Tu perfil de acceso fue desactivado. Si sos el dueño del boliche, podés reactivarlo abajo.
                </p>
                <form action={reactivateOperatorAction} className="mt-5">
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-300 transition"
                  >
                    Reactivar acceso
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="mt-3 text-2xl font-semibold text-slate-50">Autenticado, pero el contexto de administración no está disponible por el momento</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Mantuvimos tu sesión activa para que puedas cerrarla de forma segura, pero los datos del boliche no están disponibles en este momento. Reintentá en unos instantes.
                </p>
              </>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      userName={access.profile.fullName}
      userEmail={access.profile.email}
      organizationName={access.profile.organizationName}
      membershipRole={access.profile.membershipRole}
    >
      {children}
    </AppShell>
  );
}
