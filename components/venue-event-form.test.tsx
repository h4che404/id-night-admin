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

  it("shows the invalid-datetime error when the schedule input cannot produce a usable datetime", async () => {
    const user = userEvent.setup();

    render(<VenueEventForm />);

    await user.click(screen.getByRole("button", { name: /create event/i }));

    fireEvent.change(screen.getByLabelText(/event name/i), {
      target: { value: "Friday Opening" },
    });
    fireEvent.change(screen.getByLabelText(/ends at \(utc\)/i), {
      target: { value: "2026-03-01T05:00" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /^create event$/i }).closest("form")!);

    expect(await screen.findByText("Start and end must be valid date and time values.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
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
