import { NextResponse } from "next/server";
import { readReadyVenueApiAccess } from "@/lib/auth-session";
import { BackendApiError, cancelGuestListEntry } from "@/lib/idnight-backend";

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 500;
  const message =
    error instanceof BackendApiError && error.status >= 400 && error.status < 500
      ? error.message
      : fallbackMessage;
  return NextResponse.json({ message }, { status });
}

export async function PATCH(
  _request: Request,
  props: { params: Promise<{ id: string; entryId: string }> },
) {
  const params = await props.params;
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const entry = await cancelGuestListEntry(session.accessToken, params.id, params.entryId);
    return NextResponse.json(entry);
  } catch (error) {
    return routeErrorResponse(error, "Could not cancel the guest list entry.");
  }
}
