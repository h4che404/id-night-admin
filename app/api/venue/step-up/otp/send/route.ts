import { NextResponse } from "next/server";

import { readReadyVenueApiAccess } from "@/lib/auth-session";
import { BackendApiError, sendStepUpOtp } from "@/lib/idnight-backend";

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 400;
  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ message }, { status });
}

/** Sends the step-up email OTP (no passkey support in this admin client) for one action+resource. */
export async function POST(request: Request) {
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const payload = (await request.json()) as { action?: unknown; resource?: unknown };

    if (typeof payload.action !== "string" || typeof payload.resource !== "string") {
      return NextResponse.json({ message: "action y resource son requeridos." }, { status: 400 });
    }

    const result = await sendStepUpOtp(session.accessToken, payload.action, payload.resource);
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error, "No se pudo enviar el código de verificación.");
  }
}
