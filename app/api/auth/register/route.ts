import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    { message: "Las cuentas administrativas y operativas se provisionan solo por invitación." },
    { status: 403 },
  );
}
