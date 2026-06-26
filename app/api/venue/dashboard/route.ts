import { NextResponse } from "next/server";

import { requireBackendProfile } from "@/lib/auth-session";
import { BackendApiError, fetchDashboardMetrics } from "@/lib/idnight-backend";

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 500;
  const message =
    error instanceof BackendApiError && error.status >= 400 && error.status < 500
      ? error.message
      : fallbackMessage;
  return NextResponse.json({ message }, { status });
}

export async function GET() {
  const { session, profile } = await requireBackendProfile();
  const venueId = profile.venueId;

  if (!venueId) {
    return NextResponse.json({ message: "No venue associated." }, { status: 404 });
  }

  try {
    const metrics = await fetchDashboardMetrics(session.accessToken, venueId);
    return NextResponse.json(metrics);
  } catch (error) {
    return routeErrorResponse(error, "Could not load dashboard metrics.");
  }
}

