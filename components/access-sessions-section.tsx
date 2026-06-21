"use client";

import { useState } from "react";

import { Badge, DataShell, DataTable, EmptyState, Surface } from "@/components/ui-kit";
import {
  accessSessionMethodLabel,
  accessSessionResultTone,
  formatAccessSessionDate,
} from "@/lib/access-sessions";
import type { BackendAccessSession } from "@/lib/idnight-backend";

type Props = {
  initialSessions: BackendAccessSession[];
  initialError: string | null;
  events: Array<{ id: string; name: string }>;
};

export function AccessSessionsSection({ initialSessions, initialError, events }: Props) {
  const [sessions, setSessions] = useState<BackendAccessSession[]>(initialSessions);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [filterMethod, setFilterMethod] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [filterEventId, setFilterEventId] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  async function applyFilters() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterMethod) params.set("method", filterMethod);
      if (filterResult) params.set("result", filterResult);
      if (filterEventId) params.set("eventId", filterEventId);
      if (filterFromDate) params.set("fromDate", filterFromDate);
      if (filterToDate) params.set("toDate", filterToDate);
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
            <label className="mb-1 block text-xs font-medium text-slate-400">Method</label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className={selectClass}
            >
              <option value="">All methods</option>
              <option value="IDNIGHT_VERIFIED">ID Night verified</option>
              <option value="MANUAL_DNI_CHECK">Manual DNI check</option>
              <option value="GUEST_LIST_DNI_CHECK">Guest list DNI check</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Result</label>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className={selectClass}
            >
              <option value="">All results</option>
              <option value="ALLOWED">Allowed</option>
              <option value="ALLOWED_WITH_WARNING">Allowed with warning</option>
              <option value="REJECTED">Rejected</option>
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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">From</label>
            <input
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              className={selectClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">To</label>
            <input
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              className={selectClass}
            />
          </div>
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
              setFilterMethod("");
              setFilterResult("");
              setFilterEventId("");
              setFilterFromDate("");
              setFilterToDate("");
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
              <p className="text-sm font-medium text-slate-300">No entries found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting filters or check back later.
              </p>
            </div>
          ) : (
            <DataTable
              columns={["Time", "Method", "Result", "Warning", "Operator", "Device", "Event"]}
              rows={sessions.map((session) => (
                <tr key={session.id} className="align-top hover:bg-slate-950/20">
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {formatAccessSessionDate(session.occurredAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {accessSessionMethodLabel(session.method)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      label={session.result}
                      tone={accessSessionResultTone(session.result)}
                    />
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {session.warningType ? (
                      <span className="text-slate-300">{session.warningType}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {session.operatorName ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {session.deviceName ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {session.eventName ?? session.eventId}
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
