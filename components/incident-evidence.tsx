"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Surface } from "@/components/ui-kit";

export type IncidentMedia = {
  id: string;
  incidentId: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
};

/**
 * Evidence attached to an incident: what is there, and how to add to it.
 *
 * Bytes are fetched through this panel's own route rather than a blob URL, so the browser never
 * holds a storage link or a bearer token — the same shape the entry-photo gallery uses, and the
 * reason the backend streams instead of handing out a SAS URL.
 */
export function IncidentEvidence({
  incidentId,
  media,
}: {
  incidentId: string;
  media: IncidentMedia[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setError(null);
    setUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(`/api/venue/incidents/${incidentId}/media`, {
        method: "POST",
        body,
      });

      if (!response.ok) {
        // The backend's own words where it has them: it is the side that knows which types and
        // what size it accepts, and paraphrasing that here would go stale.
        const detail = await response.json().catch(() => null);
        setError(detail?.message ?? "No se pudo adjuntar el archivo.");
        return;
      }

      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Surface className="p-6">
      <h3 className="mb-4 text-lg font-medium text-white">Evidencia</h3>

      {media.length === 0 ? (
        <p className="text-sm text-slate-400">
          Sin evidencia adjunta. Podés subir una foto o un video de lo ocurrido.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {media.map((item) => (
            <li key={item.id} className="space-y-2">
              {item.contentType.startsWith("video/") ? (
                <video
                  data-testid={`incident-media-${item.id}`}
                  src={`/api/venue/incidents/${incidentId}/media/${item.id}/content`}
                  controls
                  preload="metadata"
                  className="w-full rounded-lg border border-white/10"
                />
              ) : (
                <img
                  data-testid={`incident-media-${item.id}`}
                  src={`/api/venue/incidents/${incidentId}/media/${item.id}/content`}
                  alt="Evidencia del incidente"
                  className="w-full rounded-lg border border-white/10"
                />
              )}
              <p className="text-xs text-slate-500">
                {formatDateTime(item.uploadedAt)} · {formatSize(item.sizeBytes)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <label
          htmlFor="incident-evidence-file"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Adjuntar evidencia
        </label>
        <input
          id="incident-evidence-file"
          type="file"
          accept="image/jpeg,image/png,video/mp4,video/quicktime,video/webm"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
          className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/20"
        />
        {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
      </div>
    </Surface>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
