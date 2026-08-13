import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

import { EventDetailTabs } from "@/components/event-detail-tabs";

describe("EventDetailTabs", () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
    usePathnameMock.mockReturnValue("/venue/events/event-1");
  });

  it("renders the guest-list tab with the Spanish product label", () => {
    render(<EventDetailTabs eventId="event-1" />);

    expect(
      screen.getByRole("link", { name: "Lista de invitados" }),
    ).toHaveAttribute("href", "/venue/events/event-1/guest-list");
    expect(screen.queryByText("Guest list")).not.toBeInTheDocument();
  });

  it("renders the entry-photos tab with the Spanish product label", () => {
    render(<EventDetailTabs eventId="event-1" />);

    expect(
      screen.getByRole("link", { name: "Fotos de ingreso" }),
    ).toHaveAttribute("href", "/venue/events/event-1/entry-photos");
  });
});
