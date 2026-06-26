import { NextResponse } from "next/server";

import { requireBackendProfile } from "@/lib/auth-session";
import { toggleSecurityUserStatus, updateSecurityUser } from "@/lib/idnight-backend";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, profile } = await requireBackendProfile();
  const venueId = profile.venueId;

  if (!venueId) {
    return NextResponse.json({ message: "No venue associated." }, { status: 404 });
  }

  try {
    
    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Formato de solicitud inválido." },
        { status: 400 },
      );
    }

    const { active } = body as { active?: boolean };

    if (active === undefined) {
      return NextResponse.json(
        { message: "Faltan campos obligatorios." },
        { status: 400 },
      );
    }

    await toggleSecurityUserStatus(session.accessToken, venueId, id, active);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el estado del usuario.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, profile } = await requireBackendProfile();
  const venueId = profile.venueId;

  if (!venueId) {
    return NextResponse.json({ message: "No venue associated." }, { status: 404 });
  }

  try {

    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Formato de solicitud inválido." },
        { status: 400 },
      );
    }

    const { firstName, lastName, email } = body as {
      firstName?: string;
      lastName?: string;
      email?: string;
    };

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios." },
        { status: 400 },
      );
    }

    const user = await updateSecurityUser(session.accessToken, venueId, id, {
      firstName,
      lastName,
      email,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el usuario.";
    return NextResponse.json({ message }, { status: 400 });
  }
}