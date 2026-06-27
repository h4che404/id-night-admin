import { NextResponse } from "next/server";

import { readReadyVenueApiAccess } from "@/lib/auth-session";
import { BackendApiError, fetchAccessSessions } from "@/lib/idnight-backend";

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 500;
  const message =
    error instanceof BackendApiError && error.status >= 400 && error.status < 500
      ? error.message
      : fallbackMessage;
  return NextResponse.json({ message }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const params = {
    eventId: searchParams.get("eventId") ?? undefined,
    operatorId: searchParams.get("operatorId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  };

  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const sessions = await fetchAccessSessions(session.accessToken, params);
    return NextResponse.json(sessions);
  } catch (error) {
    return routeErrorResponse(error, "Could not load access sessions.");
  }
}
