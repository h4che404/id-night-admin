import { NextResponse } from "next/server";

import { requireBackendSession, PROFILE_COOKIE } from "@/lib/auth-session";
import { BackendApiError, createOwnerOnboarding } from "@/lib/idnight-backend";

export async function POST(request: Request) {
  try {
    const session = await requireBackendSession();

    const { organizationName, venueName, city, address } = (await request.json()) as {
      organizationName?: string;
      venueName?: string;
      city?: string;
      address?: string;
    };

    if (!organizationName || !venueName) {
      return NextResponse.json(
        { message: "El nombre de la organización y del boliche son obligatorios." },
        { status: 400 },
      );
    }

    await createOwnerOnboarding(session.accessToken, { organizationName, venueName, city, address });

    const response = NextResponse.json({ ok: true });
    response.cookies.delete(PROFILE_COOKIE);
    return response;
  } catch (error) {
    const status = error instanceof BackendApiError ? error.status : 400;
    const message = error instanceof Error ? error.message : "No se pudo crear la organización.";
    return NextResponse.json({ message }, { status });
  }
}
