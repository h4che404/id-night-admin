import { NextResponse } from "next/server";

import { requireBackendProfile } from "@/lib/auth-session";
import { BackendApiError, fetchEventReport } from "@/lib/idnight-backend";

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 500;
  const message =
    error instanceof BackendApiError && error.status >= 400 && error.status < 500
      ? error.message
      : fallbackMessage;
  return NextResponse.json({ message }, { status });
}

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { session, profile } = await requireBackendProfile();
  const venueId = profile.venueId;

  if (!venueId) {
    return NextResponse.json({ message: "No venue associated." }, { status: 404 });
  }

  try {
    const report = await fetchEventReport(session.accessToken, venueId, params.id);
    return NextResponse.json(report);
  } catch (error) {
    return routeErrorResponse(error, "Could not load the event report.");
  }
}

