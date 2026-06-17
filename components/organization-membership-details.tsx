import { Badge } from "@/components/ui-kit";

const membershipRoleLabels: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
};

export function membershipRoleLabel(role: string | null) {
  if (!role) {
    return null;
  }

  return membershipRoleLabels[role] ?? role;
}

export function OrganizationMembershipDetails({
  organizationName,
  membershipRole,
  membershipActive,
}: {
  organizationName: string | null;
  membershipRole: string | null;
  membershipActive: boolean | null;
}) {
  const translatedRole = membershipRoleLabel(membershipRole);

  if (!organizationName && !translatedRole && membershipActive === null) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="organization-membership-details">
      {organizationName ? (
        <div>
          <p className="text-xs text-slate-500">Organización</p>
          <p className="mt-1 text-sm text-slate-200">{organizationName}</p>
        </div>
      ) : null}

      {translatedRole ? (
        <div>
          <p className="text-xs text-slate-500">Rol en la organización</p>
          <div className="mt-1">
            <Badge label={translatedRole} tone="info" />
          </div>
        </div>
      ) : null}

      {membershipActive !== null ? (
        <div>
          <p className="text-xs text-slate-500">Membresía</p>
          <div className="mt-1">
            <Badge
              label={membershipActive ? "Activa" : "Inactiva"}
              tone={membershipActive ? "success" : "warning"}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
