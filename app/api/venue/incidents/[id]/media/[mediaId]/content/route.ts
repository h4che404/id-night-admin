import { NextResponse } from "next/server";

import { readReadyVenueApiAccess } from "@/lib/auth-session";
import { IDNIGHT_API_BASE, IDNIGHT_CLIENT_HEADERS } from "@/lib/idnight-backend";

/**
 * Streaming proxy for incident evidence, mirroring the entry-photo one: the browser never
 * receives a blob URL or a bearer token, and the bytes pass through unchanged.
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string; mediaId: string }> },
) {
  const { id, mediaId } = await props.params;
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session, profile } = auth;

  if (!profile.venueId) {
    return NextResponse.json({ message: "No venue is associated with this account." }, { status: 403 });
  }

  const upstream = await fetch(
    `${IDNIGHT_API_BASE}/admin/venues/${profile.venueId}/incidents/${id}/media/${mediaId}/content`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}`, ...IDNIGHT_CLIENT_HEADERS },
      cache: "no-store",
    },
  );

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { message: "Evidence not found." },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
    },
  });
}
