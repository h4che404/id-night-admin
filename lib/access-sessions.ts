/*
 * Access-session status vocabulary (design ADR-4). The backend emits the
 * session status as a raw lowercase token ("open" | "closed" — see
 * BackendAccessSession in lib/idnight-backend.ts); this module owns the
 * Spanish label + Badge tone mapping so no raw token is ever rendered.
 */

function normalizeAccessSessionStatus(status: string): string {
  return status.trim().toLowerCase();
}

/*
 * Unknown-token fallback is a visible humanized token (ADR-5), not a
 * dash — hiding an unmapped status would erase audit info.
 */
function humanizeStatus(status: string): string {
  return status
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

export function accessSessionStatusLabel(status: string): string {
  const normalized = normalizeAccessSessionStatus(status);
  if (normalized === "open") return "Abierta";
  if (normalized === "closed") return "Cerrada";
  return humanizeStatus(status);
}

export function accessSessionStatusTone(status: string) {
  const normalized = normalizeAccessSessionStatus(status);
  if (normalized === "open") return "success" as const;
  return "neutral" as const;
}
