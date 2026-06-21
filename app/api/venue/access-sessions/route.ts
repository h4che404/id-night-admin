import { NextResponse } from "next/server";

import { requireBackendSession } from "@/lib/auth-session";
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
  const session = await requireBackendSession();
  const { searchParams } = new URL(request.url);

  const params = {
    eventId: searchParams.get("eventId") ?? undefined,
    method: searchParams.get("method") ?? undefined,
    result: searchParams.get("result") ?? undefined,
    fromDate: searchParams.get("fromDate") ?? undefined,
    toDate: searchParams.get("toDate") ?? undefined,
  };

  try {
    const sessions = await fetchAccessSessions(session.accessToken, params);
    return NextResponse.json(sessions);
  } catch (error) {
    return routeErrorResponse(error, "Could not load access sessions.");
  }
}
