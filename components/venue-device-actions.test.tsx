import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VenueDeviceActions } from "@/components/venue-device-actions";

const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

function renderActions(active = true) {
  return render(
    <VenueDeviceActions
      deviceId="device-1"
      initialName="Tablet puerta"
      initialDeviceKey="DOOR-01"
      active={active}
    />, 
  );
}

describe("VenueDeviceActions", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("forwards device status toggles", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    renderActions(true);

    await user.click(screen.getByRole("button", { name: /desactivar/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venue/devices",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "device-1", active: false }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("submits inline edits for the device", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    renderActions(false);

    await user.click(screen.getByRole("button", { name: /editar/i }));

    fireEvent.change(screen.getByLabelText(/^nombre$/i), {
      target: { value: "Tablet VIP" },
    });
    fireEvent.change(screen.getByLabelText(/^clave$/i), {
      target: { value: "vip-02" },
    });

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venue/devices",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "device-1", name: "Tablet VIP", deviceKey: "vip-02" }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("shows backend errors returned by the status endpoint", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "No se pudo actualizar el estado del dispositivo." }),
    });

    renderActions(true);

    await user.click(screen.getByRole("button", { name: /desactivar/i }));

    expect(
      await screen.findByText("No se pudo actualizar el estado del dispositivo."),
    ).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
