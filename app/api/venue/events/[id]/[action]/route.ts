import { NextResponse } from "next/server";

import { readReadyVenueApiAccess } from "@/lib/auth-session";
import {
  activateVenueEvent,
  BackendApiError,
  cancelVenueEvent,
  finishVenueEvent,
} from "@/lib/idnight-backend";

const VALID_ACTIONS = ["activate", "finish", "cancel"] as const;
type ValidAction = (typeof VALID_ACTIONS)[number];

const BACKEND_ACTION: Record<ValidAction, (token: string, id: string) => Promise<unknown>> = {
  activate: activateVenueEvent,
  finish: finishVenueEvent,
  cancel: cancelVenueEvent,
};

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 500;
  const message =
    error instanceof BackendApiError && error.status >= 400 && error.status < 500
      ? error.message
      : fallbackMessage;

  return NextResponse.json({ message }, { status });
}

export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string; action: string }> },
) {
  const params = await props.params;

  if (!(VALID_ACTIONS as readonly string[]).includes(params.action)) {
    return NextResponse.json({ message: `Invalid action: ${params.action}.` }, { status: 400 });
  }

  const action = params.action as ValidAction;

  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  try {
    await BACKEND_ACTION[action](session.accessToken, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeErrorResponse(error, `Could not ${action} the event.`);
  }
}
