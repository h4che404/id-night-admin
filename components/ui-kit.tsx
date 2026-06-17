import { type ReactNode, useId } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/data";

/* ── Tone styles ───────────────────────────────────────────────── */

const toneStyles: Record<StatusTone, string> = {
  neutral: "border-slate-700/60 bg-slate-900/60 text-slate-200",
  info: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  danger: "border-rose-400/20 bg-rose-400/10 text-rose-200",
};

/* ── Badge ─────────────────────────────────────────────────────── */

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

/* ── Surface ───────────────────────────────────────────────────── */

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("panel rounded-2xl", className)}>{children}</section>;
}

/* ── Section header ────────────────────────────────────────────── */

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

/* ── Data table ────────────────────────────────────────────────── */

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

/* ── Data shell (table wrapper) ────────────────────────────────── */

export function DataShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
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
          {action ? <div>{action}</div> : null}
        </div>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </Surface>
  );
}

/* ── Empty state ───────────────────────────────────────────────── */

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="panel-soft rounded-2xl p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/30">
        {icon ?? <CheckCircle2 className="h-5 w-5 text-sky-300" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ── Loading skeleton ──────────────────────────────────────────── */

export function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="panel h-32 animate-pulse rounded-2xl bg-slate-900/70" />
      <div className="panel h-64 animate-pulse rounded-2xl bg-slate-900/70" />
    </div>
  );
}

/* ── Error panel ───────────────────────────────────────────────── */

export function ErrorPanel({ message }: { message?: string }) {
  return (
    <Surface className="p-8">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3">
          <XCircle className="h-5 w-5 text-rose-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">No se pudo cargar la vista</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            {message ?? "Ocurrió un error inesperado. Por favor intentá de nuevo."}
          </p>
        </div>
      </div>
    </Surface>
  );
}

/* ── Form field ────────────────────────────────────────────────── */

export function FormField({
  label,
  icon,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
  disabled = false,
}: {
  label: string;
  icon?: ReactNode;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3.5 text-slate-400 focus-within:border-sky-400/30 transition">
        {icon}
        <input
          id={inputId}
          className="w-full border-0 bg-transparent p-0 text-slate-100 outline-none placeholder:text-slate-600"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          required={required}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/* ── Primary button ────────────────────────────────────────────── */

export function PrimaryButton({
  children,
  loading,
  type = "submit",
  onClick,
  disabled,
}: {
  children: ReactNode;
  loading?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className="inline-flex w-full items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-400/12 px-4 py-3.5 text-sm font-medium text-sky-50 transition hover:bg-sky-400/18 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

/* ── Secondary / ghost button ──────────────────────────────────── */

export function SecondaryButton({
  children,
  onClick,
  disabled,
  tone = "neutral",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        tone === "danger"
          ? "border-rose-400/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/18"
          : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
