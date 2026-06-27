"use client";

import { useState } from "react";

import { Badge, DataShell, DataTable, EmptyState, Surface } from "@/components/ui-kit";
import type { BackendAccessSession } from "@/lib/idnight-backend";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status: string) {
  if (status === "open") return "success" as const;
  if (status === "closed") return "neutral" as const;
  return "neutral" as const;
}

type Props = {
  initialSessions: BackendAccessSession[];
  initialError: string | null;
  events: Array<{ id: string; name: string }>;
};

export function AccessSessionsSection({ initialSessions, initialError, events }: Props) {
  const [sessions, setSessions] = useState<BackendAccessSession[]>(initialSessions);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [filterEventId, setFilterEventId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function applyFilters() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterEventId) params.set("eventId", filterEventId);
      if (filterStatus) params.set("status", filterStatus);
      const response = await fetch(`/api/venue/access-sessions?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message ?? "Could not load access sessions.");
        return;
      }
      setSessions(payload as BackendAccessSession[]);
    } catch {
      setError("Could not load access sessions.");
    } finally {
      setLoading(false);
    }
  }

  const selectClass =
    "w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-400/30";

  return (
    <div className="space-y-6">
      <Surface className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={selectClass}
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          {events.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Event</label>
              <select
                value={filterEventId}
                onChange={(e) => setFilterEventId(e.target.value)}
                className={selectClass}
              >
                <option value="">All events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-400/20 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Apply filters"}
          </button>
          <button
            onClick={() => {
              setFilterEventId("");
              setFilterStatus("");
            }}
            className="text-sm text-slate-400 transition hover:text-slate-200"
          >
            Clear
          </button>
        </div>
      </Surface>

      {error ? (
        <EmptyState title="Could not load access sessions" description={error} />
      ) : (
        <DataShell
          title="Access sessions"
          subtitle={`${sessions.length} record${sessions.length === 1 ? "" : "s"}`}
        >
          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-300">No sessions found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting filters or check back later.
              </p>
            </div>
          ) : (
            <DataTable
              columns={["Opened", "Closed", "Status", "Event", "Operator"]}
              rows={sessions.map((s) => (
                <tr key={s.id} className="align-top hover:bg-slate-950/20">
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {formatDate(s.openedAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {s.closedAt ? formatDate(s.closedAt) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <Badge label={s.status} tone={statusTone(s.status)} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {events.find((e) => e.id === s.eventId)?.name ?? s.eventId}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {s.operatorId}
                  </td>
                </tr>
              ))}
            />
          )}
        </DataShell>
      )}
    </div>
  );
}
