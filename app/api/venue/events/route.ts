import { NextResponse } from "next/server";

import { requireBackendProfile } from "@/lib/auth-session";
import { BackendApiError, createVenueEvent } from "@/lib/idnight-backend";
import { normalizeEventInstant } from "@/lib/venue-events";

async function parseJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 500;
  const message = error instanceof BackendApiError && error.status >= 400 && error.status < 500
    ? error.message
    : fallbackMessage;

  return NextResponse.json({ message }, { status });
}

export async function POST(request: Request) {
  const { session, profile } = await requireBackendProfile();
  const venueId = profile.venueId;

  if (!venueId) {
    return NextResponse.json({ message: "No venue associated." }, { status: 404 });
  }

  try {
    const payload = await parseJson(request);

    if (!payload) {
      return errorResponse("The request body must be valid JSON.");
    }

    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const startsAt = typeof payload.startsAt === "string" ? payload.startsAt.trim() : "";
    const endsAt = typeof payload.endsAt === "string" ? payload.endsAt.trim() : "";
    const maxCapacityValue = payload.maxCapacity;
    const normalizedStartsAt = normalizeEventInstant(startsAt);
    const normalizedEndsAt = normalizeEventInstant(endsAt);

    if (!name || !startsAt || !endsAt) {
      return errorResponse("Event name, start, and end are required.");
    }

    if (!normalizedStartsAt || !normalizedEndsAt) {
      return errorResponse("Event start and end must be valid ISO datetimes with a timezone.");
    }

    if (new Date(normalizedEndsAt).getTime() <= new Date(normalizedStartsAt).getTime()) {
      return errorResponse("Event end must be after the start.");
    }

    let maxCapacity: number | undefined;
    if (maxCapacityValue !== undefined && maxCapacityValue !== null && maxCapacityValue !== "") {
      if (typeof maxCapacityValue !== "number" || !Number.isInteger(maxCapacityValue) || maxCapacityValue <= 0) {
        return errorResponse("Max capacity must be a positive whole number.");
      }

      maxCapacity = maxCapacityValue;
    }

    let minAge: number | undefined;
    if (payload.minAge !== undefined) {
      if (typeof payload.minAge !== "number" || !Number.isInteger(payload.minAge) || payload.minAge < 0 || payload.minAge > 120) {
        return errorResponse("Minimum age must be an integer between 0 and 120.");
      }

      minAge = payload.minAge;
    }

    let allowManualDniCheck: boolean | undefined;
    if (payload.allowManualDniCheck !== undefined) {
      if (typeof payload.allowManualDniCheck !== "boolean") {
        return errorResponse("allowManualDniCheck must be a boolean.");
      }

      allowManualDniCheck = payload.allowManualDniCheck;
    }

    let requireGuestList: boolean | undefined;
    if (payload.requireGuestList !== undefined) {
      if (typeof payload.requireGuestList !== "boolean") {
        return errorResponse("requireGuestList must be a boolean.");
      }

      requireGuestList = payload.requireGuestList;
    }

    await createVenueEvent(session.accessToken, venueId, {
      name,
      startsAt: normalizedStartsAt,
      endsAt: normalizedEndsAt,
      ...(maxCapacity !== undefined ? { maxCapacity } : {}),
      ...(minAge !== undefined ? { minAge } : {}),
      ...(allowManualDniCheck !== undefined ? { allowManualDniCheck } : {}),
      ...(requireGuestList !== undefined ? { requireGuestList } : {}),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeErrorResponse(error, "Could not create the event.");
  }
}
