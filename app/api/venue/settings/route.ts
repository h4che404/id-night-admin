import { NextResponse } from "next/server";

import { requireBackendSession } from "@/lib/auth-session";
import { updateVenue } from "@/lib/idnight-backend";

export async function PUT(request: Request) {
  try {
    const session = await requireBackendSession();

    const { name, address, city } = (await request.json()) as {
      name?: string;
      address?: string;
      city?: string;
    };

    if (!name) {
      return NextResponse.json(
        { message: "El nombre del boliche es obligatorio." },
        { status: 400 },
      );
    }

    await updateVenue(session.accessToken, { name, address, city });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
