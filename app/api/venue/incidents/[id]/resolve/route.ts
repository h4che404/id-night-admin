import { NextResponse } from "next/server";

import { readReadyVenueApiAccess } from "@/lib/auth-session";
import { BackendApiError, resolveIncident } from "@/lib/idnight-backend";

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 400;
  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ message }, { status });
}

/** No step-up required (owner decision, task 5.6). */
export async function POST(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session, profile } = auth;

  if (!profile.venueId) {
    return NextResponse.json({ message: "No venue is associated with this account." }, { status: 403 });
  }

  try {
    const result = await resolveIncident(session.accessToken, profile.venueId, params.id);
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error, "No se pudo resolver el incidente.");
  }
}
