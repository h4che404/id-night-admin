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

export function maskDni(dniSuffix: string): string {
  return `****${dniSuffix}`;
}

export function guestListStatusTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "USED") return "neutral" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "info" as const;
}
