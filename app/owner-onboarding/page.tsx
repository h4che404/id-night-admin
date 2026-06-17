import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";

import { OwnerOnboardingForm } from "@/components/owner-onboarding-form";
import { SectionHeader, Surface } from "@/components/ui-kit";
import { resolveAdminSessionAccess } from "@/lib/admin-session-access";
import { requireBackendSession } from "@/lib/auth-session";

export default async function OwnerOnboardingPage() {
  const session = await requireBackendSession();
  const access = await resolveAdminSessionAccess(session.accessToken);

  if (access.kind === "admin") {
    redirect("/venue");
  }

  if (access.kind === "login") {
    redirect("/login");
  }

  return (
    <div className="status-grid flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <SectionHeader
          eyebrow="Panel admin"
          title="Creá tu organización"
          description="Configurá tu organización y tu primer boliche para empezar a operar con el panel administrativo."
        />

        <Surface className="p-8 md:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="glow-ring flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10">
              <Building2 className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">Alta inicial</p>
              <p className="mt-1 text-sm text-slate-400">
                Esta cuenta todavía no tiene acceso administrativo. Completá este paso una sola vez.
              </p>
            </div>
          </div>

          <OwnerOnboardingForm />
        </Surface>
      </div>
    </div>
  );
}
