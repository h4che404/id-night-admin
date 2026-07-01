import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { PROFILE_COOKIE, readVenueSetupApiAccess } from "@/lib/auth-session";
import { getAdminSessionCacheTag } from "@/lib/admin-session-access";
import { createVenue } from "@/lib/idnight-backend";

function extractJwtSub(token: string): string | null {
  try {
    const base64Url = token.split(".")[1];

    if (!base64Url) {
      return null;
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf8")) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

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

    const userId = extractJwtSub(session.accessToken);
    if (userId) {
      revalidateTag(getAdminSessionCacheTag(userId), {});
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.delete(PROFILE_COOKIE);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el boliche.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
