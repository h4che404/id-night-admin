import "server-only";

export const IDNIGHT_BACKEND_URL =
  process.env.IDNIGHT_BACKEND_URL ?? "https://backend-id-night.azurewebsites.net";

/* ── Types ─────────────────────────────────────────────────────── */

export type BackendAuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

export type BackendAdminMe = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  active: boolean;
  venueId: string | null;
  venueName: string | null;
};

export type BackendVenue = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  active: boolean;
};

export type BackendSecurityUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  venueId: string;
  createdAt: string;
};

/* ── API error ─────────────────────────────────────────────────── */

export class BackendApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
  }
}

/* ── Generic request helper ────────────────────────────────────── */

type RequestOptions = {
  token?: string;
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

async function backendRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${IDNIGHT_BACKEND_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Backend request failed (${response.status})`;

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }

    throw new BackendApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/* ── Auth endpoints ────────────────────────────────────────────── */

export function backendLogin(email: string, password: string) {
  return backendRequest<BackendAuthResponse>("/admin/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function backendRegister(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  return backendRequest<BackendAuthResponse>("/admin/auth/register", {
    method: "POST",
    body: data,
  });
}

export function backendRefresh(refreshToken: string) {
  return backendRequest<BackendAuthResponse>("/admin/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
}

/* ── Admin profile ─────────────────────────────────────────────── */

export function fetchAdminProfile(token: string) {
  return backendRequest<BackendAdminMe>("/admin/me", { token });
}

export function updateAdminProfile(
  token: string,
  data: { firstName: string; lastName: string },
) {
  return backendRequest<BackendAdminMe>("/admin/me", {
    token,
    method: "PUT",
    body: data,
  });
}

/* ── Venue ─────────────────────────────────────────────────────── */

export function fetchMyVenue(token: string) {
  return backendRequest<BackendVenue>("/admin/venues/mine", { token });
}

export function createVenue(
  token: string,
  data: { name: string; address?: string; city?: string },
) {
  return backendRequest<BackendVenue>("/admin/venues", {
    token,
    method: "POST",
    body: data,
  });
}

export function updateVenue(
  token: string,
  data: { name: string; address?: string; city?: string },
) {
  return backendRequest<BackendVenue>("/admin/venues/mine", {
    token,
    method: "PUT",
    body: data,
  });
}

/* ── Security users ────────────────────────────────────────────── */

export function fetchSecurityUsers(token: string) {
  return backendRequest<BackendSecurityUser[]>("/admin/venues/mine/security-users", { token });
}

export function createSecurityUser(
  token: string,
  data: { firstName: string; lastName: string; email: string; password: string },
) {
  return backendRequest<BackendSecurityUser>("/admin/venues/mine/security-users", {
    token,
    method: "POST",
    body: data,
  });
}

export function updateSecurityUser(
  token: string,
  id: string,
  data: { firstName: string; lastName: string; email: string },
) {
  return backendRequest<BackendSecurityUser>(`/admin/venues/mine/security-users/${id}`, {
    token,
    method: "PUT",
    body: data,
  });
}

export function toggleSecurityUserStatus(token: string, id: string, active: boolean) {
  return backendRequest<BackendSecurityUser>(`/admin/venues/mine/security-users/${id}/status`, {
    token,
    method: "PATCH",
    body: { active },
  });
}
