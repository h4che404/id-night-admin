import { NextResponse } from "next/server";

import { readReadyVenueApiAccess } from "@/lib/auth-session";
import { IDNIGHT_API_BASE, IDNIGHT_CLIENT_HEADERS } from "@/lib/idnight-backend";

/**
 * Upload proxy. The file is streamed through with its multipart body intact rather than parsed
 * and rebuilt here — the backend is the side that decides which content types and what size it
 * accepts, and re-deciding that in two places is how the two answers drift apart.
 *
 * It cannot go through `backendRequest`: that function serialises JSON and reads the response
 * body, and this is neither.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = await readReadyVenueApiAccess();

  if ("response" in auth) {
    return auth.response;
  }

  const { session, profile } = auth;

  if (!profile.venueId) {
    return NextResponse.json({ message: "No venue is associated with this account." }, { status: 403 });
  }

  const upstream = await fetch(
    `${IDNIGHT_API_BASE}/admin/venues/${profile.venueId}/incidents/${id}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        // Content-Type is deliberately absent: fetch sets it from the body, including the
        // multipart boundary, which cannot be copied by hand.
        ...IDNIGHT_CLIENT_HEADERS,
      },
      body: request.body,
      // Required by undici whenever a stream is sent as the body.
      duplex: "half",
      cache: "no-store",
    } as RequestInit & { duplex: "half" },
  );

  const body = await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}
