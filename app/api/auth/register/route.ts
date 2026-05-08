import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    { message: "El panel administrativo no permite auto-registro. Usá un operador creado en backend." },
    { status: 410 },
  );
}
