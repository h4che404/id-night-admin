import { NextResponse } from "next/server";

import { backendRegister } from "@/lib/idnight-backend";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-session";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password } = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
    };

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 },
      );
    }

    const session = await backendRegister({ firstName, lastName, email, password });
    const response = NextResponse.json({ ok: true });

    const secure = process.env.NODE_ENV === "production";
    response.cookies.set(ACCESS_COOKIE, session.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: session.expiresInSeconds,
    });
    response.cookies.set(REFRESH_COOKIE, session.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la cuenta.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
