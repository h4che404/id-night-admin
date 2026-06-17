import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { Surface } from "@/components/ui-kit";
import { resolveAdminSessionAccess } from "@/lib/admin-session-access";
import { readBackendSession } from "@/lib/auth-session";

export default async function RegisterPage() {
  const session = await readBackendSession();

  if (session) {
    const access = await resolveAdminSessionAccess(session.accessToken);

    if (access.kind === "admin") {
      redirect("/venue");
    }

    if (access.kind === "onboarding") {
      redirect("/owner-onboarding");
    }
  }

  return (
    <div className="status-grid flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Surface className="p-8 md:p-10">
          <div className="flex items-center gap-3">
            <div className="glow-ring flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10">
              <ShieldAlert className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">ID-Night</p>
              <h1 className="text-2xl font-semibold text-slate-50">Acceso por invitación</h1>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/40 px-5 py-4 text-sm text-slate-300">
            Las cuentas del panel se provisionan desde la operación interna. Si todavía no recibiste tu invitación, pedile a un administrador activo que te agregue como operador o supervisor.
          </div>
        </Surface>
      </div>
    </div>
  );
}
