import { NextResponse } from "next/server";

import { PROFILE_COOKIE, readVenueSetupApiAccess } from "@/lib/auth-session";
import { createVenue } from "@/lib/idnight-backend";

export async function POST(request: Request) {
  try {
    const auth = await readVenueSetupApiAccess();

    if ("response" in auth) {
      return auth.response;
    }

    const { session } = auth;

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

    await createVenue(session.accessToken, { name, address, city });

    const response = NextResponse.json({ ok: true });
    response.cookies.delete(PROFILE_COOKIE);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el boliche.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
