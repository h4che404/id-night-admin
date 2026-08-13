import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VenueIncidentLifecyclePanel } from "@/components/venue-incident-lifecycle-panel";
import type { BackendEntryPhotoCard } from "@/lib/idnight-backend";

const fetchMock = vi.fn();

const cards: BackendEntryPhotoCard[] = [
  {
    entryPhotoId: "photo-1",
    correlationId: "corr-1",
    method: "ID_NIGHT_VERIFIED",
    outcome: "Captured",
    occurredAt: "2026-08-11T22:00:00Z",
    documentLookupKey: "DOC123",
    hasPhoto: true,
  },
];

function jsonResponse(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 400, json: async () => body };
}

describe("VenueIncidentLifecyclePanel", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("requires step-up verification before link-person is ever called (IL-02/IL-03)", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ expiresAt: "2026-08-12T00:00:00Z", maxAttempts: 5 })) // otp/send
      .mockResolvedValueOnce(jsonResponse({ verified: true })) // otp/verify
      .mockResolvedValueOnce(
        jsonResponse({ id: "inc-1", venueId: "venue-1", lifecycle: "PersonLinked", isBlocking: true, resolvedAt: null }),
      ); // link-person

    render(<VenueIncidentLifecyclePanel incidentId="inc-1" cards={cards} />);

    await user.click(screen.getByRole("button", { name: /DOC123/i }));
    await user.click(screen.getByRole("button", { name: /solicitar verificación/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/venue/step-up/otp/send",
      expect.objectContaining({ method: "POST" }),
    );

    await user.type(screen.getByLabelText(/código de verificación/i), "123456");
    await user.click(screen.getByRole("button", { name: /verificar y vincular/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/venue/step-up/otp/verify",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/venue/incidents/inc-1/link-person",
      expect.objectContaining({ method: "POST" }),
    );

    expect(await screen.findByText("Persona vinculada")).toBeInTheDocument();
  });

  it("resolves an incident without any step-up request (owner decision, task 5.6)", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: "inc-1", venueId: "venue-1", lifecycle: "Resolved", isBlocking: false, resolvedAt: "2026-08-12T00:00:00Z" }),
    );

    render(<VenueIncidentLifecyclePanel incidentId="inc-1" cards={cards} />);

    await user.click(screen.getByRole("button", { name: /resolver incidente/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venue/incidents/inc-1/resolve",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock.mock.calls.every(([url]) => !String(url).includes("step-up"))).toBe(true);
    expect(await screen.findByText("Resuelto")).toBeInTheDocument();
  });
});
