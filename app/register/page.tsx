import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Surface } from "@/components/ui-kit";
import { RegisterForm } from "@/components/register-form";
import { resolveAdminSessionAccess } from "@/lib/admin-session-access";
import { canRecoverVenueSetup, readBackendSession } from "@/lib/auth-session";

export default async function RegisterPage() {
  const session = await readBackendSession();

  if (session) {
    const access = await resolveAdminSessionAccess(session.accessToken);

    if (access.state === "ready" || access.state === "degraded") {
      redirect("/venue");
    }

    if (access.state === "onboarding-needed") {
      redirect(canRecoverVenueSetup(access) ? "/venue" : "/owner-onboarding");
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
              <h1 className="text-2xl font-semibold text-slate-50">Crear cuenta</h1>
            </div>
          </div>

          <RegisterForm />

          <div className="mt-6 text-center text-sm text-slate-400">
            <Link href="/login" className="hover:text-sky-300 transition-colors">
              ¿Ya tenés cuenta? Iniciá sesión
            </Link>
          </div>
        </Surface>
      </div>
    </div>
  );
}
