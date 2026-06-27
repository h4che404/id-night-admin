import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VenueIncidentForm } from "@/components/venue-incident-form";

const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const mockIncident = {
  id: "inc_123",
  venueId: "venue-1",
  title: "Altercado menor",
  description: "Se le pidió a la persona que se retire.",
  status: "open" as const,
  createdAt: "2024-05-01T12:00:00Z",
  resolvedAt: null,
  resolution: null,
};

describe("VenueIncidentForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("submits the updated incident payload", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<VenueIncidentForm incident={mockIncident} />);

    // Change status
    fireEvent.change(screen.getByLabelText(/estado/i), {
      target: { value: "closed" },
    });
    // Change description
    fireEvent.change(screen.getByLabelText(/descripción/i), {
      target: { value: "El usuario se retiró pacíficamente." },
    });
    // Change resolution
    fireEvent.change(screen.getByLabelText(/resolución/i), {
      target: { value: "Incidente resuelto sin intervención policial." },
    });

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venue/incidents/inc_123",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Altercado menor",
          status: "closed",
          description: "El usuario se retiró pacíficamente.",
          resolution: "Incidente resuelto sin intervención policial.",
        }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("shows an error message on failed update", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "No se pudo actualizar la severidad." }),
    });

    render(<VenueIncidentForm incident={mockIncident} />);

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(await screen.findByText("No se pudo actualizar la severidad.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
