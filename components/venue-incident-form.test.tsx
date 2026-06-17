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
  createdAt: "2024-05-01T12:00:00Z",
  severity: "LOW",
  status: "OPEN",
  venueName: "Test Venue",
  operatorName: "Juan",
  profileName: "Carlos",
  summary: "Altercado menor",
  description: "Se le pidió a la persona que se retire.",
  followUp: null,
  evidence: null,
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

    // Change severity
    fireEvent.change(screen.getByLabelText(/severidad/i), {
      target: { value: "MEDIUM" },
    });
    // Change status
    fireEvent.change(screen.getByLabelText(/estado/i), {
      target: { value: "CLOSED" },
    });
    // Change description
    fireEvent.change(screen.getByLabelText(/descripción detallada/i), {
      target: { value: "El usuario se retiró pacíficamente." },
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
          severity: "MEDIUM",
          status: "CLOSED",
          description: "El usuario se retiró pacíficamente.",
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