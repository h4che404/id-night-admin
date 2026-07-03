"use client";

import { Users } from "lucide-react";
import { useState } from "react";

import {
  Badge,
  DataShell,
  DataTable,
  EmptyState,
  PrimaryButton,
  Surface,
} from "@/components/ui-kit";
import { guestListStatusTone, maskDni } from "@/lib/guest-list";
import type { BackendGuestListEntry, BackendGuestListImportResult } from "@/lib/idnight-backend";

type Props = {
  eventId: string;
  initialEntries: BackendGuestListEntry[];
  initialEntriesError: string | null;
};

export function GuestListSection({
  eventId,
  initialEntries,
  initialEntriesError,
}: Props) {
  const [entries, setEntries] = useState<BackendGuestListEntry[]>(initialEntries);
  const [entriesError, setEntriesError] = useState<string | null>(initialEntriesError);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BackendGuestListImportResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/venue/events/${eventId}/guest-list`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        setUploadError(payload.message ?? "Could not import the guest list.");
        return;
      }
      setUploadResult(payload as BackendGuestListImportResult);
      setFile(null);
      const listResponse = await fetch(`/api/venue/events/${eventId}/guest-list`);
      if (listResponse.ok) {
        setEntries(await listResponse.json());
        setEntriesError(null);
      }
    } catch {
      setUploadError("Could not import the guest list.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCancel(entryId: string) {
    setCancellingId(entryId);
    setCancelError(null);
    try {
      const response = await fetch(`/api/venue/events/${eventId}/guest-list/${entryId}`, {
        method: "PATCH",
      });
      const payload = await response.json();
      if (!response.ok) {
        setCancelError(payload.message ?? "Could not cancel the entry.");
        return;
      }
      setEntries((prev) =>
        prev.map((entry) => (entry.id === entryId ? (payload as BackendGuestListEntry) : entry)),
      );
    } catch {
      setCancelError("Could not cancel the entry.");
    } finally {
      setCancellingId(null);
    }
  }

  const filtered = entries.filter((entry) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      entry.firstName.toLowerCase().includes(q) ||
      entry.lastName.toLowerCase().includes(q) ||
      entry.dni.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <Surface className="p-6 md:p-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Import guest list</h3>
            <p className="mt-1 text-sm text-slate-400">
              Upload a CSV or XLSX file with columns: dni, nombre, apellido, categoria (optional).
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">File</label>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-400/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-sky-200 file:transition hover:file:bg-sky-400/20"
              />
            </div>
            <PrimaryButton loading={uploading} disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </PrimaryButton>
          </form>

          {uploadResult && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-sm font-medium text-emerald-200">
                Imported: {uploadResult.imported} · Duplicates: {uploadResult.duplicates} ·
                Invalid: {uploadResult.invalid}
              </p>
              {uploadResult.errors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {uploadResult.errors.map((err, i) => (
                    <li key={i} className="text-xs text-rose-300">
                      Row {err.row} — {err.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {uploadError && (
            <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
              {uploadError}
            </p>
          )}
        </div>
      </Surface>

      {entriesError ? (
        <EmptyState
          title="Could not load guest list"
          description={entriesError}
          icon={<Users className="h-5 w-5 text-sky-300" />}
        />
      ) : (
        <DataShell
          title="Guest list"
          subtitle={`${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}
          action={
            entries.length > 0 ? (
              <input
                type="search"
                placeholder="Search by name or DNI suffix..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:border-sky-400/30 focus:outline-none"
              />
            ) : undefined
          }
        >
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">
                {entries.length === 0
                  ? "No entries yet. Upload a file to add guests."
                  : "No entries match your search."}
              </p>
            </div>
          ) : (
            <DataTable
              columns={["Name", "DNI", "Category", "Status", "Imported at", "Actions"]}
              rows={filtered.map((entry) => (
                <tr key={entry.id} className="align-top hover:bg-slate-950/20">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-100">
                      {entry.firstName} {entry.lastName}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-slate-300">
                    {maskDni(entry.dni)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {entry.category ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <Badge label={entry.status} tone={guestListStatusTone(entry.status)} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {new Date(entry.importedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.status === "active" && (
                        <button
                          onClick={() => handleCancel(entry.id)}
                          disabled={cancellingId === entry.id}
                          className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-50"
                        >
                          {cancellingId === entry.id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            />
          )}
        </DataShell>
      )}

      {cancelError && cancellingId === null && (
        <p className="text-xs text-rose-300">{cancelError}</p>
      )}
    </div>
  );
}
