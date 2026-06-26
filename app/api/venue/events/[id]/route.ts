import { NextResponse } from "next/server";

import { requireBackendProfile } from "@/lib/auth-session";
import { BackendApiError, updateVenueEvent } from "@/lib/idnight-backend";
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
  const message =
    error instanceof BackendApiError && error.status >= 400 && error.status < 500
      ? error.message
      : fallbackMessage;

  return NextResponse.json({ message }, { status });
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

    const data: { name?: string; startsAt?: string; endsAt?: string; maxCapacity?: number | null } =
      {};

    if (payload.name !== undefined) {
      if (typeof payload.name !== "string" || !payload.name.trim()) {
        return errorResponse("Event name must not be blank.");
      }
      data.name = payload.name.trim();
    }

    if (payload.startsAt !== undefined) {
      if (typeof payload.startsAt !== "string") {
        return errorResponse("Event start must be a valid ISO datetime with a timezone.");
      }
      const normalized = normalizeEventInstant(payload.startsAt.trim());
      if (!normalized) {
        return errorResponse("Event start must be a valid ISO datetime with a timezone.");
      }
      data.startsAt = normalized;
    }

    if (payload.endsAt !== undefined) {
      if (typeof payload.endsAt !== "string") {
        return errorResponse("Event end must be a valid ISO datetime with a timezone.");
      }
      const normalized = normalizeEventInstant(payload.endsAt.trim());
      if (!normalized) {
        return errorResponse("Event end must be a valid ISO datetime with a timezone.");
      }
      data.endsAt = normalized;
    }

    if (data.startsAt && data.endsAt) {
      if (new Date(data.endsAt).getTime() <= new Date(data.startsAt).getTime()) {
        return errorResponse("Event end must be after the start.");
      }
    }

    if (payload.maxCapacity !== undefined && payload.maxCapacity !== null) {
      if (!Number.isInteger(payload.maxCapacity) || (payload.maxCapacity as number) <= 0) {
        return errorResponse("Max capacity must be a positive whole number.");
      }
      data.maxCapacity = payload.maxCapacity as number;
    } else if (payload.maxCapacity === null) {
      data.maxCapacity = null;
    }

    let minAge: number | undefined;
    if (payload.minAge !== undefined) {
      if (
        typeof payload.minAge !== "number" ||
        !Number.isInteger(payload.minAge) ||
        payload.minAge < 0 ||
        payload.minAge > 120
      ) {
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

    if (
      Object.keys(data).length === 0 &&
      minAge === undefined &&
      allowManualDniCheck === undefined &&
      requireGuestList === undefined
    ) {
      return errorResponse("At least one field must be provided.");
    }

    await updateVenueEvent(session.accessToken, venueId, params.id, {
      ...data,
      ...(minAge !== undefined ? { minAge } : {}),
      ...(allowManualDniCheck !== undefined ? { allowManualDniCheck } : {}),
      ...(requireGuestList !== undefined ? { requireGuestList } : {}),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeErrorResponse(error, "Could not update the event.");
  }
}
