import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VenueEventForm } from "@/components/venue-event-form";

const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

describe("VenueEventForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("submits the minimum event payload", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<VenueEventForm />);

    await user.click(screen.getByRole("button", { name: /crear evento/i }));

    fireEvent.change(screen.getByLabelText(/nombre del evento/i), {
      target: { value: "Friday Opening" },
    });
    fireEvent.change(screen.getByLabelText(/inicio \(utc\)/i), {
      target: { value: "2026-06-20T23:00" },
    });
    fireEvent.change(screen.getByLabelText(/fin \(utc\)/i), {
      target: { value: "2026-06-21T05:00" },
    });
    fireEvent.change(screen.getByLabelText(/capacidad máxima/i), {
      target: { value: "500" },
    });

    await user.click(screen.getByRole("button", { name: /^crear evento$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venue/events",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          maxCapacity: 500,
          allowManualDniCheck: true,
          requireGuestList: false,
        }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Evento creado correctamente.")).toBeInTheDocument();
    expect(screen.getByText(/guarda la fecha y hora exactas que ingreses en utc/i)).toBeInTheDocument();
  });

  it("shows the backend error message", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Venue events are not available yet." }),
    });

    render(<VenueEventForm />);

    await user.click(screen.getByRole("button", { name: /crear evento/i }));

    fireEvent.change(screen.getByLabelText(/nombre del evento/i), {
      target: { value: "Friday Opening" },
    });
    fireEvent.change(screen.getByLabelText(/inicio \(utc\)/i), {
      target: { value: "2026-06-20T23:00" },
    });
    fireEvent.change(screen.getByLabelText(/fin \(utc\)/i), {
      target: { value: "2026-06-21T05:00" },
    });

    await user.click(screen.getByRole("button", { name: /^crear evento$/i }));

    expect(await screen.findByText("Venue events are not available yet.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("does not submit when an invalid datetime-local value leaves the required UTC schedule blank", async () => {
    const user = userEvent.setup();

    render(<VenueEventForm />);

    await user.click(screen.getByRole("button", { name: /crear evento/i }));

    fireEvent.change(screen.getByLabelText(/nombre del evento/i), {
      target: { value: "Friday Opening" },
    });
    const startsAtInput = screen.getByLabelText(/inicio \(utc\)/i);

    fireEvent.change(startsAtInput, {
      target: { value: "2026-02-30T23:00" },
    });
    fireEvent.change(screen.getByLabelText(/fin \(utc\)/i), {
      target: { value: "2026-03-01T05:00" },
    });

    expect(startsAtInput).toHaveValue("");

    const submitButton = screen.getByRole("button", { name: /^crear evento$/i });

    await user.click(submitButton);

    const form = submitButton.closest("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText("El inicio y el fin deben ser fechas y horas válidas."),
    ).toBeInTheDocument();
  });

  it("round-trips edit-mode UTC schedule values through the PATCH payload", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(
      <VenueEventForm
        event={{
          id: "event-1",
          name: "Friday Opening",
          status: "UPCOMING",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          maxCapacity: 500,
          minAge: 18,
          allowManualDniCheck: false,
          requireGuestList: true,
        }}
        onClose={onClose}
      />,
    );

    expect(screen.getByLabelText(/inicio \(utc\)/i)).toHaveValue("2026-06-20T23:00");
    expect(screen.getByLabelText(/fin \(utc\)/i)).toHaveValue("2026-06-21T05:00");

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venue/events/event-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          maxCapacity: 500,
          minAge: 18,
          allowManualDniCheck: false,
          requireGuestList: true,
        }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("lets edit mode clear max capacity and disable guest list in the PATCH payload", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(
      <VenueEventForm
        event={{
          id: "event-1",
          name: "Friday Opening",
          status: "UPCOMING",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          maxCapacity: 500,
          minAge: 18,
          allowManualDniCheck: true,
          requireGuestList: true,
        }}
        onClose={onClose}
      />,
    );

    await user.clear(screen.getByLabelText(/capacidad máxima/i));
    await user.click(screen.getByLabelText(/requiere lista de invitados/i));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venue/events/event-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          maxCapacity: null,
          minAge: 18,
          allowManualDniCheck: true,
          requireGuestList: false,
        }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a safe generic message for unexpected request failures", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new Error("socket hang up"));

    render(<VenueEventForm />);

    await user.click(screen.getByRole("button", { name: /crear evento/i }));

    fireEvent.change(screen.getByLabelText(/nombre del evento/i), {
      target: { value: "Friday Opening" },
    });
    fireEvent.change(screen.getByLabelText(/inicio \(utc\)/i), {
      target: { value: "2026-06-20T23:00" },
    });
    fireEvent.change(screen.getByLabelText(/fin \(utc\)/i), {
      target: { value: "2026-06-21T05:00" },
    });

    await user.click(screen.getByRole("button", { name: /^crear evento$/i }));

    expect(await screen.findByText("No se pudo crear el evento. Intentá de nuevo.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("renders the access policy section with maxAge, allowedFrom, and allowedUntil fields", async () => {
    const user = userEvent.setup();
    render(<VenueEventForm />);

    await user.click(screen.getByRole("button", { name: /crear evento/i }));

    expect(screen.getByLabelText(/edad máxima/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ventana de ingreso desde/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ventana de ingreso hasta/i)).toBeInTheDocument();
  });

  it("includes access policy fields in the submit body when filled", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    render(<VenueEventForm />);

    await user.click(screen.getByRole("button", { name: /crear evento/i }));

    fireEvent.change(screen.getByLabelText(/nombre del evento/i), { target: { value: "Friday Opening" } });
    fireEvent.change(screen.getByLabelText(/inicio \(utc\)/i), { target: { value: "2026-06-20T23:00" } });
    fireEvent.change(screen.getByLabelText(/fin \(utc\)/i), { target: { value: "2026-06-21T05:00" } });
    fireEvent.change(screen.getByLabelText(/edad máxima/i), { target: { value: "25" } });
    fireEvent.change(screen.getByLabelText(/ventana de ingreso desde/i), { target: { value: "22:00" } });
    fireEvent.change(screen.getByLabelText(/ventana de ingreso hasta/i), { target: { value: "02:00" } });

    await user.click(screen.getByRole("button", { name: /^crear evento$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venue/events",
      expect.objectContaining({
        body: JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          maxCapacity: null,
          allowManualDniCheck: true,
          requireGuestList: false,
          maxAge: 25,
          allowedFrom: "22:00",
          allowedUntil: "02:00",
        }),
      }),
    );
  });

  it("rejects when minAge exceeds maxAge", async () => {
    const user = userEvent.setup();
    render(<VenueEventForm />);

    await user.click(screen.getByRole("button", { name: /crear evento/i }));

    fireEvent.change(screen.getByLabelText(/nombre del evento/i), { target: { value: "Friday Opening" } });
    fireEvent.change(screen.getByLabelText(/inicio \(utc\)/i), { target: { value: "2026-06-20T23:00" } });
    fireEvent.change(screen.getByLabelText(/fin \(utc\)/i), { target: { value: "2026-06-21T05:00" } });
    fireEvent.change(screen.getByLabelText(/edad mínima/i), { target: { value: "25" } });
    fireEvent.change(screen.getByLabelText(/edad máxima/i), { target: { value: "20" } });

    await user.click(screen.getByRole("button", { name: /^crear evento$/i }));

    expect(await screen.findByText(/la edad mínima no puede superar la edad máxima/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when only allowedFrom is set without allowedUntil", async () => {
    const user = userEvent.setup();
    render(<VenueEventForm />);

    await user.click(screen.getByRole("button", { name: /crear evento/i }));

    fireEvent.change(screen.getByLabelText(/nombre del evento/i), { target: { value: "Friday Opening" } });
    fireEvent.change(screen.getByLabelText(/inicio \(utc\)/i), { target: { value: "2026-06-20T23:00" } });
    fireEvent.change(screen.getByLabelText(/fin \(utc\)/i), { target: { value: "2026-06-21T05:00" } });
    fireEvent.change(screen.getByLabelText(/ventana de ingreso desde/i), { target: { value: "22:00" } });

    await user.click(screen.getByRole("button", { name: /^crear evento$/i }));

    expect(await screen.findByText(/el inicio y el fin de la ventana de ingreso deben completarse juntos/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("pre-fills access policy fields from the event prop in edit mode", () => {
    render(
      <VenueEventForm
        event={{
          id: "event-1",
          name: "Friday Opening",
          status: "UPCOMING",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          maxCapacity: 500,
          minAge: 18,
          allowManualDniCheck: false,
          requireGuestList: true,
          maxAge: 30,
          allowedFrom: "22:00",
          allowedUntil: "02:00",
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/edad máxima/i)).toHaveValue(30);
    expect(screen.getByLabelText(/ventana de ingreso desde/i)).toHaveValue("22:00");
    expect(screen.getByLabelText(/ventana de ingreso hasta/i)).toHaveValue("02:00");
  });
});
