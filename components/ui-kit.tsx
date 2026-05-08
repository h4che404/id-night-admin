import Link from "next/link";
import { type ReactNode } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, ShieldAlert, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/data";

const toneStyles: Record<StatusTone, string> = {
  neutral: "border-slate-700/60 bg-slate-900/60 text-slate-200",
  info: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  danger: "border-rose-400/20 bg-rose-400/10 text-rose-200",
};

export function toneForLabel(label: string): StatusTone {
  const value = label.toLowerCase();
  if (
    value.includes("critica") ||
    value.includes("critico") ||
    value.includes("rechaz") ||
    value.includes("suspend") ||
    value.includes("offline") ||
    value.includes("caido")
  ) {
    return "danger";
  }

  if (
    value.includes("warning") ||
    value.includes("pendiente") ||
    value.includes("revision") ||
    value.includes("atencion") ||
    value.includes("inestable")
  ) {
    return "warning";
  }

  if (
    value.includes("operativo") ||
    value.includes("activo") ||
    value.includes("online") ||
    value.includes("permitido") ||
    value.includes("verificado")
  ) {
    return "success";
  }

  if (value.includes("informativa")) {
    return "info";
  }

  return "neutral";
}

export function Badge({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: StatusTone;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-[0.02em]",
        toneStyles[tone],
      )}
    >
      {icon}
      {label}
    </span>
  );
}

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("panel rounded-2xl", className)}>{children}</section>;
}

export function SectionHeader({
  title,
  eyebrow,
  description,
  action,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">{eyebrow}</p>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">{title}</h1>
          {description ? <p className="max-w-3xl text-sm leading-6 text-slate-400">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="flex items-center gap-3">{action}</div> : null}
    </div>
  );
}

export function ActionLink({
  href,
  label,
  subtle,
}: {
  href: string;
  label: string;
  subtle?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
        subtle
          ? "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:text-white"
          : "border-sky-400/20 bg-sky-400/10 text-sky-100 hover:border-sky-300/40 hover:bg-sky-400/14",
      )}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: StatusTone;
}) {
  return (
    <Surface className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">{value}</p>
        </div>
        <Badge
          label={delta}
          tone={tone}
          icon={
            tone === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : tone === "warning" ? (
              <Clock3 className="h-3.5 w-3.5" />
            ) : tone === "danger" ? (
              <ShieldAlert className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )
          }
        />
      </div>
    </Surface>
  );
}

export function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={cn(
        "rounded-full border px-3 py-2 text-sm transition",
        active
          ? "border-sky-300/40 bg-sky-400/10 text-sky-100"
          : "border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700 hover:text-slate-200",
      )}
    >
      {label}
    </button>
  );
}

export function DataShell({
  title,
  subtitle,
  filters,
  children,
}: {
  title: string;
  subtitle: string;
  filters?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Surface className="overflow-hidden">
      <div className="border-b border-slate-800/80 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          </div>
          {filters ? <div className="flex flex-wrap gap-2">{filters}</div> : null}
        </div>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </Surface>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode;
}) {
  return (
    <table className="min-w-full border-collapse text-left">
      <thead className="bg-slate-950/40">
        <tr>
          {columns.map((column) => (
            <th key={column} className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/80">{rows}</tbody>
    </table>
  );
}

export function ValuePair({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="text-sm text-slate-200">{value}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-soft rounded-2xl p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/30">
        <CheckCircle2 className="h-5 w-5 text-sky-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Timeline({
  items,
}: {
  items: Array<{
    title: string;
    description: string;
    meta: string;
    tone?: StatusTone;
  }>;
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={`${item.title}-${item.meta}`} className="flex gap-4">
          <div className="mt-1 flex w-5 justify-center">
            <span
              className={cn(
                "mt-1 h-2.5 w-2.5 rounded-full",
                item.tone === "danger"
                  ? "bg-rose-400"
                  : item.tone === "warning"
                    ? "bg-amber-400"
                    : item.tone === "success"
                      ? "bg-emerald-400"
                      : "bg-sky-400",
              )}
            />
          </div>
          <div className="flex-1 rounded-2xl border border-slate-800/80 bg-slate-950/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-slate-100">{item.title}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.meta}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
      <div className="panel h-64 animate-pulse rounded-2xl bg-slate-900/70" />
      <div className="panel h-64 animate-pulse rounded-2xl bg-slate-900/70" />
      <div className="panel h-72 animate-pulse rounded-2xl bg-slate-900/70 xl:col-span-2" />
    </div>
  );
}

export function ErrorPanel() {
  return (
    <Surface className="p-8">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3">
          <XCircle className="h-5 w-5 text-rose-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">No se pudo cargar la vista</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            El prototipo mantiene el estado visual del sistema y deja claro el punto de falla, para que la operacion
            no pierda contexto ni trazabilidad.
          </p>
        </div>
      </div>
    </Surface>
  );
}
