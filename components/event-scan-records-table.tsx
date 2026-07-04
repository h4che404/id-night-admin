import { ScanLine } from "lucide-react";
import Link from "next/link";

import { Badge, DataShell, DataTable, EmptyState, ErrorPanel } from "@/components/ui-kit";
import type { BackendScanRecord } from "@/lib/idnight-backend";
import {
  SCAN_OUTCOME_UI,
  formatScanLatency,
  formatScanScore,
  formatScanTime,
  guardDecisionLabel,
  methodUi,
  resolveScanResultUi,
} from "@/lib/scan-records";
import { cn } from "@/lib/utils";

/* ── Outcome filter bar ────────────────────────────────────────── */

export function ScanOutcomeFilterBar({
  eventId,
  activeOutcome,
}: {
  eventId: string;
  activeOutcome?: string;
}) {
  const basePath = `/venue/events/${eventId}/entries`;
  const filters = [
    { value: undefined, label: "Todos" },
    ...Object.entries(SCAN_OUTCOME_UI).map(([value, ui]) => ({
      value,
      label: ui.filterLabel,
    })),
  ];

  return (
    <nav aria-label="Filtrar por resultado" className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const active = filter.value === activeOutcome || (!filter.value && !activeOutcome);
        const href = filter.value
          ? `${basePath}?${new URLSearchParams({ outcome: filter.value }).toString()}`
          : basePath;

        return (
          <Link
            key={filter.label}
            href={href}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ease-out",
              active
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-accent hover:text-foreground",
            )}
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ── Scan records table ────────────────────────────────────────── */

export function EventScanRecordsTable({
  records,
  total,
  error,
}: {
  records: BackendScanRecord[];
  total: number;
  error: string | null;
}) {
  if (error) {
    return <ErrorPanel message={error} />;
  }

  if (records.length === 0) {
    return (
      <EmptyState
        title="Sin ingresos"
        description="Sin ingresos registrados para este evento."
        icon={<ScanLine className="h-5 w-5 text-muted-foreground" />}
      />
    );
  }

  return (
    <DataShell
      title="Registro de ingresos"
      subtitle={`${total} intento${total === 1 ? "" : "s"} de ingreso registrado${total === 1 ? "" : "s"}`}
    >
      <DataTable
        caption="Horarios en hora de Argentina (UTC-3)."
        columns={[
          { label: "Hora", ariaLabel: "Hora local de Argentina" },
          "Método",
          "Resultado",
          "Decisión del guardia",
          "Puntaje",
          "Latencia",
          "Anulación",
          "Operador",
        ]}
        rows={records.map((record) => {
          const outcome = resolveScanResultUi(record);
          const decision = guardDecisionLabel(record.guardDecision);
          const method = methodUi(record.method);

          return (
            <tr key={record.id}>
              <td className="px-5 font-mono text-sm text-foreground/80">
                {formatScanTime(record.validatedAt)}
              </td>
              <td className="px-5">
                {method ? (
                  <Badge label={method.label} tone={method.tone} />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-5">
                <Badge label={outcome.label} tone={outcome.tone} />
              </td>
              <td className="px-5" title={record.guardDecisionReason ?? undefined}>
                {decision ? (
                  <Badge
                    label={decision}
                    tone={
                      record.guardDecision === "Accepted"
                        ? "verified"
                        : record.guardDecision === "Rejected"
                          ? "rejected"
                          : "manual"
                    }
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-5 font-mono text-sm text-foreground/80">
                {formatScanScore(record.score)}
              </td>
              <td className="px-5 font-mono text-sm text-foreground/80">
                {formatScanLatency(record.latencyMs)}
              </td>
              <td className="px-5">
                {record.isOverride ? <Badge label="Anulación" tone="warning" /> : null}
              </td>
              <td className="px-5 text-sm text-muted-foreground">
                {record.operatorName ?? "—"}
              </td>
            </tr>
          );
        })}
      />
    </DataShell>
  );
}
