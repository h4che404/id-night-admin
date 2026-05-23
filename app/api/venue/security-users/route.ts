import { NextResponse } from "next/server";

import { requireBackendSession } from "@/lib/auth-session";
import { createSecurityUser, toggleSecurityUserStatus } from "@/lib/idnight-backend";

export async function POST(request: Request) {
  try {
    const session = await requireBackendSession();

    const { firstName, lastName, email } = (await request.json()) as {
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

    const user = await createSecurityUser(session.accessToken, {
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

export async function PATCH(request: Request) {
  try {
    const session = await requireBackendSession();

    const { id, active } = (await request.json()) as {
      id?: string;
      active?: boolean;
    };

    if (!id || active === undefined) {
      return NextResponse.json(
        { message: "Faltan campos obligatorios." },
        { status: 400 },
      );
    }

    await toggleSecurityUserStatus(session.accessToken, id, active);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el usuario.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
