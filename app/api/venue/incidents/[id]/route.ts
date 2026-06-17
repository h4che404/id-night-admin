import { NextResponse } from "next/server";

import { requireBackendSession } from "@/lib/auth-session";
import { BackendApiError, fetchVenueIncident, updateVenueIncident } from "@/lib/idnight-backend";

async function parseJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 400;
  const message = error instanceof Error ? error.message : fallbackMessage;

  return NextResponse.json({ message }, { status });
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await requireBackendSession();

  try {
    const data = await fetchVenueIncident(session.accessToken, params.id);
    return NextResponse.json(data);
  } catch (error) {
    return routeErrorResponse(error, "No se pudo obtener el incidente.");
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await requireBackendSession();

  try {
    const payload = await parseJson(request);

    if (!payload) {
      return NextResponse.json({ message: "El cuerpo debe ser JSON valido." }, { status: 400 });
    }

    const data: { severity?: string; status?: string; description?: string | null } = {};
    if (typeof payload.severity === "string") data.severity = payload.severity;
    if (typeof payload.status === "string") data.status = payload.status;
    if (typeof payload.description === "string" || payload.description === null) {
      data.description = payload.description;
    }

    const result = await updateVenueIncident(session.accessToken, params.id, data);
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error, "No se pudo actualizar el incidente.");
  }
}
