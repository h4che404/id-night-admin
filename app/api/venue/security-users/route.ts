import { NextResponse } from "next/server";

import { requireBackendProfile } from "@/lib/auth-session";
import { createSecurityUser } from "@/lib/idnight-backend";

export async function POST(request: Request) {
  const { session, profile } = await requireBackendProfile();
  const venueId = profile.venueId;

  if (!venueId) {
    return NextResponse.json({ message: "No venue associated." }, { status: 404 });
  }

  try {
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

    const user = await createSecurityUser(session.accessToken, venueId, {
      firstName,
      lastName,
      email,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el usuario.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

