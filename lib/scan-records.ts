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
