import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, PROFILE_COOKIE } from "@/lib/auth-session";
import { registerWithSupabase } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = (await request.json()) as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
    };

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ message: "Email, contraseña, nombre y apellido son obligatorios." }, { status: 400 });
    }

    const session = await registerWithSupabase(email, password, { firstName, lastName });

    if (!session || !session.access_token) {
      return NextResponse.json({ ok: true, requiresEmailConfirmation: true });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.delete(PROFILE_COOKIE);

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
    let message = error instanceof Error ? error.message : "No pudimos crear la cuenta.";

    if (message.includes("<!DOCTYPE") || message.length > 200) {
      message = "No se pudo registrar la cuenta. Por favor intentá más tarde.";
    }

    const alreadyRegistered =
      message.toLowerCase().includes("already registered") ||
      message.toLowerCase().includes("already been registered") ||
      message.toLowerCase().includes("email already");

    if (alreadyRegistered) {
      return NextResponse.json(
        { message: "Este email ya tiene una cuenta. Iniciá sesión.", alreadyRegistered: true },
        { status: 409 },
      );
    }

    return NextResponse.json({ message }, { status: 400 });
  }
}
