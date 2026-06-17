import "server-only";

type SupabaseSessionResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user?: {
    id: string;
    email?: string | null;
    email_confirmed_at?: string | null;
    user_metadata?: Record<string, unknown> | null;
  } | null;
};

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

function requireConfig() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Falta configurar SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY para el panel admin.",
    );
  }
}

async function supabaseRequest<T>(path: string, options: RequestInit = {}) {
  requireConfig();

  const response = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_PUBLISHABLE_KEY,
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Supabase request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { msg?: string; message?: string; error_description?: string };
      message =
        payload.message ??
        payload.error_description ??
        payload.msg ??
        message;
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function loginWithSupabase(email: string, password: string) {
  return supabaseRequest<SupabaseSessionResponse>("/token?grant_type=password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ email, password }),
  });
}

export async function registerWithSupabase(
  email: string,
  password: string,
  data: { firstName: string; lastName: string }
) {
  return supabaseRequest<SupabaseSessionResponse>("/signup", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ email, password, data }),
  });
}

export async function refreshSupabaseSession(refreshToken: string) {
  return supabaseRequest<SupabaseSessionResponse>("/token?grant_type=refresh_token", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function logoutFromSupabase(accessToken: string) {
  await supabaseRequest("/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function resendSupabaseVerification(email: string) {
  await supabaseRequest("/resend", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ type: "signup", email }),
  });
}
