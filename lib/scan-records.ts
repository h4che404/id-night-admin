import type { StatusTone } from "@/lib/data";

/* PRD §8 product language: backend scan outcomes → Spanish UI labels. */

export type ScanOutcomeUi = {
  label: string;
  filterLabel: string;
  tone: StatusTone;
};

export const SCAN_OUTCOME_UI: Record<string, ScanOutcomeUi> = {
  Allow: { label: "Permitido", filterLabel: "Permitido", tone: "verified" },
  Warning: { label: "Advertencia operativa", filterLabel: "Advertencia", tone: "warning" },
  ManualReview: { label: "Requiere revisión", filterLabel: "Revisión", tone: "manual" },
  Deny: { label: "Rechazado", filterLabel: "Rechazado", tone: "rejected" },
  NotFound: { label: "No encontrado en ID-Night", filterLabel: "No encontrado", tone: "neutral" },
};

export const SCAN_OUTCOME_VALUES = Object.keys(SCAN_OUTCOME_UI);

export function scanOutcomeUi(outcome: string): ScanOutcomeUi {
  return SCAN_OUTCOME_UI[outcome] ?? { label: outcome, filterLabel: outcome, tone: "neutral" };
}

export const GUARD_DECISION_LABELS: Record<string, string> = {
  Accepted: "Aceptado",
  Rejected: "Rechazado",
  ManualReview: "Revisión",
};

export function guardDecisionLabel(decision: string | null | undefined): string | null {
  if (!decision) {
    return null;
  }
  return GUARD_DECISION_LABELS[decision] ?? decision;
}

export function normalizeScanOutcomeFilter(value: string | undefined): string | undefined {
  return value && SCAN_OUTCOME_VALUES.includes(value) ? value : undefined;
}

/*
 * PRD §8 result vocabulary (ALLOWED / ALLOWED_WITH_WARNING / REJECTED). This
 * is the mapped, backend-computed result (ADR-4) — coarser than the internal
 * `outcome` enum. Reuses the same Spanish labels/tones as SCAN_OUTCOME_UI so
 * the badge look stays consistent whichever field the record carries.
 */
export const RESULT_UI: Record<string, ScanOutcomeUi> = {
  ALLOWED: { label: "Permitido", filterLabel: "Permitido", tone: "verified" },
  ALLOWED_WITH_WARNING: {
    label: "Advertencia operativa",
    filterLabel: "Advertencia",
    tone: "warning",
  },
  REJECTED: { label: "Rechazado", filterLabel: "Rechazado", tone: "rejected" },
};

/*
 * Prefers the backend-computed `result` (single source of truth once
 * present) over the client-side `outcome` mapping. Falls back to `outcome`
 * for records predating the backend deploy, or when `result` is an
 * unrecognized token.
 */
export function resolveScanResultUi(record: {
  outcome: string;
  result?: string | null;
}): ScanOutcomeUi {
  if (record.result && RESULT_UI[record.result]) {
    return RESULT_UI[record.result];
  }
  return scanOutcomeUi(record.outcome);
}

/* PRD §8 door-entry method vocabulary → approved Spanish product labels. */

export type MethodUi = {
  label: string;
  tone: StatusTone;
};

export const METHOD_UI: Record<string, MethodUi> = {
  IDNIGHT_VERIFIED: { label: "Ingreso verificado por ID-Night", tone: "verified" },
  MANUAL_DNI_CHECK: { label: "Ingreso manual con DNI físico", tone: "manual" },
  GUEST_LIST_DNI_CHECK: { label: "Ingreso por lista de invitados", tone: "info" },
};

export function methodUi(method: string | null | undefined): MethodUi | null {
  if (!method) {
    return null;
  }
  return METHOD_UI[method] ?? null;
}

/* ── Formatting ────────────────────────────────────────────────── */

export function formatScanTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

export function formatScanScore(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return "—";
  }
  return score.toFixed(2);
}

export function formatScanLatency(latencyMs: number) {
  return `${Math.round(latencyMs)} ms`;
}
