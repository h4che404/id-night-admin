import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchAdminProfile } from "@/lib/idnight-backend";
import { OrganizationMembershipDetails } from "@/components/organization-membership-details";
import { Badge, SectionHeader, Surface } from "@/components/ui-kit";

export default async function AccountPage() {
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session } = readyAccess;
  const profile = await fetchAdminProfile(session.accessToken);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Mi cuenta"
        title={profile.fullName}
        description="Información de tu cuenta de administrador."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Surface className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Datos personales</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs text-slate-500">Nombre</p>
              <p className="mt-1 text-sm text-slate-200">{profile.firstName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Apellido</p>
              <p className="mt-1 text-sm text-slate-200">{profile.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="mt-1 text-sm text-slate-200">{profile.email}</p>
            </div>
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Estado de la cuenta</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs text-slate-500">Rol</p>
              <div className="mt-1">
                <Badge label={profile.role} tone="info" />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Estado</p>
              <div className="mt-1">
                <Badge
                  label={profile.active ? "Activa" : "Inactiva"}
                  tone={profile.active ? "success" : "warning"}
                />
              </div>
            </div>
            {profile.venueName ? (
              <div>
                <p className="text-xs text-slate-500">Boliche asociado</p>
                <p className="mt-1 text-sm text-slate-200">{profile.venueName}</p>
              </div>
            ) : null}
            <OrganizationMembershipDetails
              organizationName={profile.organizationName}
              membershipRole={profile.membershipRole}
              membershipActive={profile.membershipActive}
            />
          </div>
        </Surface>
      </div>
    </div>
  );
}
