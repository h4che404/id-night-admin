export const ACCESS_SESSION_METHODS = {
  IDNIGHT_VERIFIED: "ID Night verified",
  MANUAL_DNI_CHECK: "Manual DNI check",
  GUEST_LIST_DNI_CHECK: "Guest list DNI check",
} as const;

export const ACCESS_SESSION_RESULTS = {
  ALLOWED: "Allowed",
  ALLOWED_WITH_WARNING: "Allowed with warning",
  REJECTED: "Rejected",
} as const;

export type AccessSessionMethod = keyof typeof ACCESS_SESSION_METHODS;
export type AccessSessionResult = keyof typeof ACCESS_SESSION_RESULTS;

export function accessSessionResultTone(result: string) {
  if (result === "ALLOWED") return "success" as const;
  if (result === "ALLOWED_WITH_WARNING") return "warning" as const;
  if (result === "REJECTED") return "danger" as const;
  return "neutral" as const;
}

export function accessSessionMethodLabel(method: string): string {
  return ACCESS_SESSION_METHODS[method as AccessSessionMethod] ?? method;
}

export function formatAccessSessionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
