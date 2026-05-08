import { AppShell } from "@/components/app-shell";
import { requireBackendProfile } from "@/lib/auth-session";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireBackendProfile();

  return (
    <AppShell
      userName={profile.fullName}
      userEmail={profile.email}
      verificationStatus={profile.role}
    >
      {children}
    </AppShell>
  );
}
