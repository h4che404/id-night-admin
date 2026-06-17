import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VenueDeviceForm } from "@/components/venue-device-form";

const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

describe("VenueDeviceForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("submits a valid device registration payload", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<VenueDeviceForm />);

    await user.click(screen.getByRole("button", { name: /registrar dispositivo/i }));

    fireEvent.change(screen.getByLabelText(/nombre del dispositivo/i), {
      target: { value: "Tablet puerta" },
    });
    fireEvent.change(screen.getByLabelText(/clave o código/i), {
      target: { value: "door-01" },
    });

    await user.click(screen.getByRole("button", { name: /^registrar dispositivo$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venue/devices",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Tablet puerta", deviceKey: "door-01" }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Dispositivo registrado correctamente.")).toBeInTheDocument();
  });

  it("shows the backend registration error", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Ya existe un dispositivo con esa clave." }),
    });

    render(<VenueDeviceForm />);

    await user.click(screen.getByRole("button", { name: /registrar dispositivo/i }));

    fireEvent.change(screen.getByLabelText(/nombre del dispositivo/i), {
      target: { value: "Tablet puerta" },
    });
    fireEvent.change(screen.getByLabelText(/clave o código/i), {
      target: { value: "door-01" },
    });

    await user.click(screen.getByRole("button", { name: /^registrar dispositivo$/i }));

    expect(await screen.findByText("Ya existe un dispositivo con esa clave.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
