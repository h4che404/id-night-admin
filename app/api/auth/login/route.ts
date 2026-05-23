import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-session";
import { loginWithSupabase } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ message: "Email y contrasena son obligatorios." }, { status: 400 });
    }

    const session = await loginWithSupabase(email, password);
    const response = NextResponse.json({ ok: true });

    const secure = process.env.NODE_ENV === "production";
    response.cookies.set(ACCESS_COOKIE, session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: session.expires_in,
    });
    response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos iniciar sesion.";
    return NextResponse.json({ message }, { status: 401 });
  }
}
