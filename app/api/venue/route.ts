import { NextResponse } from "next/server";

import { requireBackendProfile } from "@/lib/auth-session";
import { createVenue } from "@/lib/idnight-backend";

export async function POST(request: Request) {
  try {
    const { session, profile } = await requireBackendProfile();

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

    await createVenue(session.accessToken, profile.organizationId || "", { name, address, city });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el boliche.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
