import { NextResponse } from "next/server";

import { requireBackendSession } from "@/lib/auth-session";
import { BackendApiError, fetchVenueIncidents } from "@/lib/idnight-backend";

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 400;
  const message = error instanceof Error ? error.message : fallbackMessage;

  return NextResponse.json({ message }, { status });
}

export async function GET() {
  const session = await requireBackendSession();

  try {
    const data = await fetchVenueIncidents(session.accessToken);
    return NextResponse.json(data);
  } catch (error) {
    return routeErrorResponse(error, "No se pudieron obtener los incidentes.");
  }
}
