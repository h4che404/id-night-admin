import { type ReactNode, useId } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/data";

/* ── Tone styles ───────────────────────────────────────────────── */

const toneStyles: Record<StatusTone, string> = {
  neutral: "border-border bg-accent/50 text-foreground/80",
  info: "border-primary/25 bg-primary/10 text-indigo-400",
  success: "border-verified/20 bg-verified/10 text-verified",
  verified: "border-verified/20 bg-verified/10 text-verified",
  manual: "border-manual/20 bg-manual/10 text-manual",
  warning: "border-warning/20 bg-warning/10 text-warning",
  danger: "border-rejected/20 bg-rejected/10 text-rejected",
  rejected: "border-rejected/20 bg-rejected/10 text-rejected",
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
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium tracking-[0.02em]",
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
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {children}
    </section>
  );
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
        {eyebrow ? <p className="label-sm text-indigo-400">{eyebrow}</p> : null}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex items-center gap-3">{action}</div> : null}
    </div>
  );
}

/* ── Data table ────────────────────────────────────────────────── */

export type DataTableColumn = string | { label: string; ariaLabel?: string };

function columnKey(column: DataTableColumn): string {
  return typeof column === "string" ? column : column.label;
}

export function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: DataTableColumn[];
  rows: ReactNode;
  /** Persistent, once-per-table note (e.g. clarifying a displayed timezone). */
  caption?: string;
}) {
  return (
    <table className="min-w-full border-collapse text-left">
      {caption ? (
        <caption className="caption-bottom px-5 pt-2 text-left text-xs text-muted-foreground">
          {caption}
        </caption>
      ) : null}
      <thead>
        <tr className="border-b border-border">
          {columns.map((column) => {
            const label = typeof column === "string" ? column : column.label;
            const ariaLabel = typeof column === "string" ? undefined : column.ariaLabel;
            return (
              <th
                key={columnKey(column)}
                aria-label={ariaLabel}
                className="label-sm px-5 py-3 text-muted-foreground"
              >
                {label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody
        className={cn(
          "divide-y divide-border",
          // Dense rows (2.5rem target) + subtle 1px hover lift per DESIGN.md motion spec.
          "[&_td]:py-2.5",
          "[&_tr]:transition-[transform,background-color] [&_tr]:duration-200 [&_tr]:ease-out",
          "[&_tr:hover]:-translate-y-px",
        )}
      >
        {rows}
      </tbody>
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
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
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
    <div className="rounded-lg border border-border bg-surface p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card">
        {icon ?? <CheckCircle2 className="h-5 w-5 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ── Loading skeleton ──────────────────────────────────────────── */

export function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

/* ── Error panel ───────────────────────────────────────────────── */

export function ErrorPanel({ message }: { message?: string }) {
  return (
    <Surface className="p-8">
      <div className="flex items-start gap-4">
        <div className="rounded-md border border-rejected/20 bg-rejected/10 p-3">
          <XCircle className="h-5 w-5 text-rejected" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">No se pudo cargar la vista</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
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
      <Label htmlFor={inputId} className="mb-2 text-sm font-medium text-foreground/90">
        {label}
      </Label>
      <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2.5 text-muted-foreground transition-[border-color,box-shadow] duration-200 ease-out focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        {icon}
        <input
          id={inputId}
          className="w-full border-0 bg-transparent p-0 text-foreground outline-none placeholder:text-muted-foreground/60"
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
    <Button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className="w-full"
      size="lg"
    >
      {children}
    </Button>
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
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        tone === "danger" &&
          "border-rejected/25 bg-rejected/10 text-rejected hover:bg-rejected/15 hover:text-rejected",
      )}
    >
      {children}
    </Button>
  );
}

/* ── Pagination bar ────────────────────────────────────────────── */

export function PaginationBar({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams?: Record<string, string>;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  function buildHref(targetPage: number) {
    const params = new URLSearchParams({ ...searchParams, page: String(targetPage) });
    return `${basePath}?${params.toString()}`;
  }

  const linkClass =
    "rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-200 ease-out hover:border-accent hover:text-foreground";
  const disabledClass =
    "cursor-not-allowed rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground/50";

  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <p className="font-mono text-xs text-muted-foreground">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <a href={buildHref(page - 1)} className={linkClass}>
            ← Previous
          </a>
        ) : (
          <span className={disabledClass}>← Previous</span>
        )}
        {page < totalPages ? (
          <a href={buildHref(page + 1)} className={linkClass}>
            Next →
          </a>
        ) : (
          <span className={disabledClass}>Next →</span>
        )}
      </div>
    </div>
  );
}
