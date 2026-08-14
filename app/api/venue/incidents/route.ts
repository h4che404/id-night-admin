import { NextResponse } from "next/server";

import { readReadyVenueApiAccess } from "@/lib/auth-session";
import { BackendApiError, createVenueIncident, fetchVenueIncidents } from "@/lib/idnight-backend";

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

export async function GET() {
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const data = await fetchVenueIncidents(session.accessToken);
    return NextResponse.json(data);
  } catch (error) {
    return routeErrorResponse(error, "No se pudieron obtener los incidentes.");
  }
}

/** No `venueId` accepted here either: the backend resolves it from the caller's own venue. */
export async function POST(request: Request) {
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const payload = await parseJson(request);

    if (!payload || typeof payload.title !== "string" || !payload.title.trim()) {
      return NextResponse.json({ message: "El título es requerido." }, { status: 400 });
    }

    const data: { title: string; description?: string; eventId?: string } = {
      title: payload.title,
    };
    if (typeof payload.description === "string" && payload.description.trim()) {
      data.description = payload.description;
    }
    if (typeof payload.eventId === "string" && payload.eventId.trim()) {
      data.eventId = payload.eventId;
    }

    const result = await createVenueIncident(session.accessToken, data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error, "No se pudo crear el incidente.");
  }
}
