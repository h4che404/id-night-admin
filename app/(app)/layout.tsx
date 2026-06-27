import { AppShell } from "@/components/app-shell";
import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth-session";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { access } = await requireAdminAccess();

  if (access.state === "onboarding-needed") {
    redirect("/owner-onboarding");
  }

  if (access.state === "unauthorized") {
    redirect("/login");
  }

  if (access.state === "degraded") {
    return (
      <AppShell
        userName={access.identity?.fullName ?? "Authenticated admin"}
        userEmail={access.identity?.email ?? "Session available"}
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6 text-slate-100">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">Degraded access</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-50">Authenticated, but admin context is temporarily unavailable</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              We kept your session active so you can sign out safely, but venue data is unavailable right now. Please retry in a moment.
            </p>
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
