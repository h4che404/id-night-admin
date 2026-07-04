export const ACCEPTED_GUEST_LIST_EXTENSIONS = [".csv", ".xlsx"] as const;

const ACCEPTED_MIME_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export function isValidGuestListFile(file: File): boolean {
  const ext = file.name.toLowerCase();
  const hasValidExt = ACCEPTED_GUEST_LIST_EXTENSIONS.some((e) => ext.endsWith(e));
  const hasValidMime = ACCEPTED_MIME_TYPES.includes(file.type);
  return (hasValidExt || hasValidMime) && file.size > 0;
}

export function maskDni(dni: string): string {
  return `****${dni.slice(-4)}`;
}

/**
 * The backend emits the guest-entry status via enum `ToString()`, i.e.
 * PascalCase ("Active" | "Used" | "Cancelled"). Normalize here so callers
 * never need to worry about casing (see sdd/backend-audit-trail ADR-7).
 */
function normalizeGuestListStatus(status: string): string {
  return status.trim().toLowerCase();
}

export function isActiveGuestListStatus(status: string): boolean {
  return normalizeGuestListStatus(status) === "active";
}

export function guestListStatusTone(status: string) {
  const normalized = normalizeGuestListStatus(status);
  if (normalized === "active") return "success" as const;
  if (normalized === "used") return "manual" as const;
  if (normalized === "cancelled") return "danger" as const;
  return "info" as const;
}

export function guestListStatusLabel(status: string): string {
  const normalized = normalizeGuestListStatus(status);
  if (normalized === "active") return "Activa";
  if (normalized === "used") return "Utilizada";
  if (normalized === "cancelled") return "Cancelada";
  return status;
}
