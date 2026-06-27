import { NextResponse } from "next/server";

import { readReadyVenueApiAccess } from "@/lib/auth-session";
import { BackendApiError, fetchMyVenueEntryRules, updateMyVenueEntryRules } from "@/lib/idnight-backend";

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const status = error instanceof BackendApiError ? error.status : 400;

  return NextResponse.json({ message }, { status });
}

export async function GET() {
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const rules = await fetchMyVenueEntryRules(session.accessToken);
    return NextResponse.json(rules);
  } catch (error) {
    return routeErrorResponse(error, "No se pudieron cargar los requisitos de ingreso.");
  }
}

export async function PUT(request: Request) {
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  let body;

  try {
    body = (await request.json()) as {
      active?: boolean;
      minimumAge?: number;
      requireVerifiedAdult?: boolean;
      requireIdentityVerification?: boolean;
      requireValidTicket?: boolean;
      allowManualReview?: boolean;
      notes?: string;
    };
  } catch {
    return NextResponse.json({ message: "El cuerpo debe ser JSON valido." }, { status: 400 });
  }

  const requiredBooleanFields = [
    "active",
    "requireVerifiedAdult",
    "requireIdentityVerification",
    "requireValidTicket",
    "allowManualReview",
  ] as const;

  const invalidBooleanField = requiredBooleanFields.find((field) => typeof body[field] !== "boolean");

  if (invalidBooleanField) {
    return NextResponse.json(
      { message: `Falta el campo obligatorio: ${invalidBooleanField}.` },
      { status: 400 },
    );
  }

  if (typeof body.minimumAge !== "number" || Number.isNaN(body.minimumAge) || !Number.isInteger(body.minimumAge)) {
    return NextResponse.json(
      { message: "La edad mínima debe ser un entero entre 0 y 120." },
      { status: 400 },
    );
  }

  if (body.minimumAge < 0 || body.minimumAge > 120) {
    return NextResponse.json(
      { message: "La edad mínima debe estar entre 0 y 120." },
      { status: 400 },
    );
  }

  if (body.notes !== undefined && typeof body.notes !== "string") {
    return NextResponse.json(
      { message: "El campo notes debe ser texto." },
      { status: 400 },
    );
  }

  const payload = {
    active: body.active as boolean,
    minimumAge: body.minimumAge,
    requireVerifiedAdult: body.requireVerifiedAdult as boolean,
    requireIdentityVerification: body.requireIdentityVerification as boolean,
    requireValidTicket: body.requireValidTicket as boolean,
    allowManualReview: body.allowManualReview as boolean,
    notes: body.notes,
  };

  try {
    await updateMyVenueEntryRules(session.accessToken, payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeErrorResponse(error, "No se pudieron guardar los requisitos de ingreso.");
  }
}
