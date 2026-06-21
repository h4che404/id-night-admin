import { NextResponse } from "next/server";

import { requireBackendSession } from "@/lib/auth-session";
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
  const session = await requireBackendSession();
  try {
    const metrics = await fetchDashboardMetrics(session.accessToken);
    return NextResponse.json(metrics);
  } catch (error) {
    return routeErrorResponse(error, "Could not load dashboard metrics.");
  }
}
