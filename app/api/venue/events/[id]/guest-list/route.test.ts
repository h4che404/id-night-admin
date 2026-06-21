// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, requireBackendSession, fetchEventGuestList, uploadEventGuestList } =
  vi.hoisted(() => {
    class MockBackendApiError extends Error {
      status: number;

      constructor(message: string, status: number) {
        super(message);
        this.name = "BackendApiError";
        this.status = status;
      }
    }

    return {
      MockBackendApiError,
      requireBackendSession: vi.fn(),
      fetchEventGuestList: vi.fn(),
      uploadEventGuestList: vi.fn(),
    };
  });

vi.mock("@/lib/auth-session", () => ({
  requireBackendSession,
}));

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  fetchEventGuestList,
  uploadEventGuestList,
}));

import { GET, POST } from "@/app/api/venue/events/[id]/guest-list/route";

function createUploadRequest(file: File, id: string) {
  const formData = new FormData();
  formData.append("file", file);
  return new Request(`http://localhost/api/venue/events/${id}/guest-list`, {
    method: "POST",
    body: formData,
  });
}

function createGetRequest(id: string) {
  return new Request(`http://localhost/api/venue/events/${id}/guest-list`);
}

function createRedirectError() {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/login;307;",
  });
}

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/venue/events/[id]/guest-list POST", () => {
  beforeEach(() => {
    requireBackendSession.mockReset();
    requireBackendSession.mockResolvedValue({ accessToken: "admin-token", refreshToken: null });
    uploadEventGuestList.mockReset();
  });

  it("rejects missing file field", async () => {
    const formData = new FormData();
    const request = new Request("http://localhost/api/venue/events/evt-1/guest-list", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request, mockParams("evt-1"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "A file is required." });
    expect(uploadEventGuestList).not.toHaveBeenCalled();
  });

  it("rejects unsupported file type", async () => {
    const file = new File(["data"], "guests.pdf", { type: "application/pdf" });
    const response = await POST(createUploadRequest(file, "evt-1"), mockParams("evt-1"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Only CSV and XLSX files are supported.",
    });
    expect(uploadEventGuestList).not.toHaveBeenCalled();
  });

  it("rejects empty file", async () => {
    const file = new File([], "guests.csv", { type: "text/csv" });
    const response = await POST(createUploadRequest(file, "evt-1"), mockParams("evt-1"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "The file is empty." });
    expect(uploadEventGuestList).not.toHaveBeenCalled();
  });

  it("forwards valid CSV upload and returns import result", async () => {
    const importResult = { imported: 10, duplicates: 2, invalid: 1, errors: [] };
    uploadEventGuestList.mockResolvedValue(importResult);

    const file = new File(["dni,nombre,apellido\n12345678,Juan,Perez"], "guests.csv", {
      type: "text/csv",
    });
    const response = await POST(createUploadRequest(file, "evt-1"), mockParams("evt-1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(importResult);
    expect(uploadEventGuestList).toHaveBeenCalledWith("admin-token", "evt-1", expect.any(FormData));
  });

  it("preserves backend 4xx error on upload", async () => {
    uploadEventGuestList.mockRejectedValue(
      new MockBackendApiError("File format is invalid.", 422),
    );

    const file = new File(["bad content"], "guests.csv", { type: "text/csv" });
    const response = await POST(createUploadRequest(file, "evt-1"), mockParams("evt-1"));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ message: "File format is invalid." });
  });

  it("returns safe fallback for backend 5xx", async () => {
    uploadEventGuestList.mockRejectedValue(new MockBackendApiError("DB exploded", 503));

    const file = new File(["data"], "guests.csv", { type: "text/csv" });
    const response = await POST(createUploadRequest(file, "evt-1"), mockParams("evt-1"));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Could not import the guest list." });
  });

  it("returns generic 500 for unexpected errors", async () => {
    uploadEventGuestList.mockRejectedValue(new Error("network timeout"));

    const file = new File(["data"], "guests.csv", { type: "text/csv" });
    const response = await POST(createUploadRequest(file, "evt-1"), mockParams("evt-1"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Could not import the guest list." });
  });

  it("rethrows auth redirects", async () => {
    const redirectError = createRedirectError();
    requireBackendSession.mockRejectedValue(redirectError);

    const file = new File(["data"], "guests.csv", { type: "text/csv" });
    await expect(POST(createUploadRequest(file, "evt-1"), mockParams("evt-1"))).rejects.toBe(
      redirectError,
    );
  });
});

describe("/api/venue/events/[id]/guest-list GET", () => {
  beforeEach(() => {
    requireBackendSession.mockReset();
    requireBackendSession.mockResolvedValue({ accessToken: "admin-token", refreshToken: null });
    fetchEventGuestList.mockReset();
  });

  it("returns guest list entries", async () => {
    const entries = [
      {
        id: "entry-1",
        status: "ACTIVE",
        firstName: "Juan",
        lastName: "Perez",
        dniSuffix: "5678",
        category: null,
        importedAt: "2026-06-21T00:00:00.000Z",
      },
    ];
    fetchEventGuestList.mockResolvedValue(entries);

    const response = await GET(createGetRequest("evt-1"), mockParams("evt-1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(entries);
    expect(fetchEventGuestList).toHaveBeenCalledWith("admin-token", "evt-1");
  });

  it("preserves backend 4xx error", async () => {
    fetchEventGuestList.mockRejectedValue(
      new MockBackendApiError("Event not found.", 404),
    );

    const response = await GET(createGetRequest("evt-1"), mockParams("evt-1"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Event not found." });
  });

  it("returns safe fallback for backend 5xx", async () => {
    fetchEventGuestList.mockRejectedValue(new MockBackendApiError("DB error", 500));

    const response = await GET(createGetRequest("evt-1"), mockParams("evt-1"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Could not load the guest list." });
  });
});
