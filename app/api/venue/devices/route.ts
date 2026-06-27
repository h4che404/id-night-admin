import { NextResponse } from "next/server";

import { readReadyVenueApiAccess } from "@/lib/auth-session";
import {
  BackendApiError,
  createVenueDevice,
  toggleVenueDeviceStatus,
  updateVenueDevice,
} from "@/lib/idnight-backend";

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
  const status = error instanceof BackendApiError ? error.status : 400;
  const message = error instanceof Error ? error.message : fallbackMessage;

  return NextResponse.json({ message }, { status });
}

export async function POST(request: Request) {
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const payload = await parseJson(request);

    if (!payload) {
      return errorResponse("El cuerpo debe ser JSON valido.");
    }

    const name = typeof payload.name === "string" ? payload.name : "";
    const deviceKey = typeof payload.deviceKey === "string" ? payload.deviceKey : "";

    if (!name.trim() || !deviceKey.trim()) {
      return errorResponse("El nombre y la clave del dispositivo son obligatorios.");
    }

    await createVenueDevice(session.accessToken, { name, deviceKey });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeErrorResponse(error, "No se pudo registrar el dispositivo.");
  }
}

export async function PUT(request: Request) {
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const payload = await parseJson(request);

    if (!payload) {
      return errorResponse("El cuerpo debe ser JSON valido.");
    }

    const id = typeof payload.id === "string" ? payload.id : "";
    const name = typeof payload.name === "string" ? payload.name : "";
    const deviceKey = typeof payload.deviceKey === "string" ? payload.deviceKey : "";

    if (!id.trim() || !name.trim() || !deviceKey.trim()) {
      return errorResponse("Faltan campos obligatorios del dispositivo.");
    }

    await updateVenueDevice(session.accessToken, id, { name, deviceKey });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeErrorResponse(error, "No se pudo actualizar el dispositivo.");
  }
}

export async function PATCH(request: Request) {
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const payload = await parseJson(request);

    if (!payload) {
      return errorResponse("El cuerpo debe ser JSON valido.");
    }

    const id = typeof payload.id === "string" ? payload.id : "";
    const active = payload.active;

    if (!id.trim() || typeof active !== "boolean") {
      return errorResponse("Faltan campos obligatorios para el estado del dispositivo.");
    }

    await toggleVenueDeviceStatus(session.accessToken, id, active);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeErrorResponse(error, "No se pudo actualizar el estado del dispositivo.");
  }
}
