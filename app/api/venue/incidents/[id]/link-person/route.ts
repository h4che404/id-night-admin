import { NextResponse } from "next/server";

import { readReadyVenueApiAccess } from "@/lib/auth-session";
import { BackendApiError, linkIncidentPerson } from "@/lib/idnight-backend";

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 400;
  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ message }, { status });
}

/** IL-01/IL-02: the step-up proof was already redeemed via `/api/venue/step-up/otp` first. */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
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
    const payload = (await request.json()) as { documentLookupKey?: unknown; blocking?: unknown };

    if (typeof payload.documentLookupKey !== "string" || !payload.documentLookupKey.trim()) {
      return NextResponse.json({ message: "documentLookupKey es requerido." }, { status: 400 });
    }

    const result = await linkIncidentPerson(session.accessToken, profile.venueId, params.id, {
      documentLookupKey: payload.documentLookupKey,
      blocking: payload.blocking === true,
    });

    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error, "No se pudo vincular a la persona.");
  }
}
