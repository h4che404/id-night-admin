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

    await user.click(screen.getByRole("button", { name: /create event/i }));

    fireEvent.change(screen.getByLabelText(/event name/i), {
      target: { value: "Friday Opening" },
    });
    fireEvent.change(screen.getByLabelText(/starts at \(utc\)/i), {
      target: { value: "2026-06-20T23:00" },
    });
    fireEvent.change(screen.getByLabelText(/ends at \(utc\)/i), {
      target: { value: "2026-06-21T05:00" },
    });
    fireEvent.change(screen.getByLabelText(/max capacity/i), {
      target: { value: "500" },
    });

    await user.click(screen.getByRole("button", { name: /^create event$/i }));

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
          minAge: 0,
          allowManualDniCheck: true,
          requireGuestList: false,
        }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Event created successfully.")).toBeInTheDocument();
    expect(screen.getByText(/stores the exact date and time you enter as utc/i)).toBeInTheDocument();
  });

  it("shows the backend error message", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Venue events are not available yet." }),
    });

    render(<VenueEventForm />);

    await user.click(screen.getByRole("button", { name: /create event/i }));

    fireEvent.change(screen.getByLabelText(/event name/i), {
      target: { value: "Friday Opening" },
    });
    fireEvent.change(screen.getByLabelText(/starts at \(utc\)/i), {
      target: { value: "2026-06-20T23:00" },
    });
    fireEvent.change(screen.getByLabelText(/ends at \(utc\)/i), {
      target: { value: "2026-06-21T05:00" },
    });

    await user.click(screen.getByRole("button", { name: /^create event$/i }));

    expect(await screen.findByText("Venue events are not available yet.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("does not submit when an invalid datetime-local value leaves the required UTC schedule blank", async () => {
    const user = userEvent.setup();

    render(<VenueEventForm />);

    await user.click(screen.getByRole("button", { name: /create event/i }));

    fireEvent.change(screen.getByLabelText(/event name/i), {
      target: { value: "Friday Opening" },
    });
    const startsAtInput = screen.getByLabelText(/starts at \(utc\)/i);

    fireEvent.change(startsAtInput, {
      target: { value: "2026-02-30T23:00" },
    });
    fireEvent.change(screen.getByLabelText(/ends at \(utc\)/i), {
      target: { value: "2026-03-01T05:00" },
    });

    expect(startsAtInput).toHaveValue("");

    const submitButton = screen.getByRole("button", { name: /^create event$/i });

    await user.click(submitButton);

    const form = submitButton.closest("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Start and end must be valid date and time values."),
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

    expect(screen.getByLabelText(/starts at \(utc\)/i)).toHaveValue("2026-06-20T23:00");
    expect(screen.getByLabelText(/ends at \(utc\)/i)).toHaveValue("2026-06-21T05:00");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

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

    await user.clear(screen.getByLabelText(/max capacity/i));
    await user.click(screen.getByLabelText(/require guest list/i));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

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

    await user.click(screen.getByRole("button", { name: /create event/i }));

    fireEvent.change(screen.getByLabelText(/event name/i), {
      target: { value: "Friday Opening" },
    });
    fireEvent.change(screen.getByLabelText(/starts at \(utc\)/i), {
      target: { value: "2026-06-20T23:00" },
    });
    fireEvent.change(screen.getByLabelText(/ends at \(utc\)/i), {
      target: { value: "2026-06-21T05:00" },
    });

    await user.click(screen.getByRole("button", { name: /^create event$/i }));

    expect(await screen.findByText("Could not create the event. Please try again.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
