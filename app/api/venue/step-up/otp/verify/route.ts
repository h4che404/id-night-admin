import { NextResponse } from "next/server";

import { readReadyVenueApiAccess } from "@/lib/auth-session";
import { BackendApiError, verifyStepUpOtp } from "@/lib/idnight-backend";

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 400;
  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ message }, { status });
}

/** Verifies the step-up email OTP and spends it into a proof record on the backend. */
export async function POST(request: Request) {
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const payload = (await request.json()) as { action?: unknown; resource?: unknown; code?: unknown };

    if (
      typeof payload.action !== "string" ||
      typeof payload.resource !== "string" ||
      typeof payload.code !== "string"
    ) {
      return NextResponse.json({ message: "action, resource y code son requeridos." }, { status: 400 });
    }

    await verifyStepUpOtp(session.accessToken, payload.action, payload.resource, payload.code);
    return NextResponse.json({ verified: true });
  } catch (error) {
    return routeErrorResponse(error, "El código no es válido.");
  }
}
