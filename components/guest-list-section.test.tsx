import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GuestListSection } from "@/components/guest-list-section";
import type { BackendGuestListEntry } from "@/lib/idnight-backend";

function createEntry(
  overrides: Partial<BackendGuestListEntry> = {},
): BackendGuestListEntry {
  return {
    id: "entry-1",
    eventId: "event-1",
    firstName: "Ana",
    lastName: "Pérez",
    dni: "30123456",
    category: null,
    status: "Active",
    importedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("GuestListSection", () => {
  it("renders the Spanish status label for every backend status, regardless of casing", () => {
    render(
      <GuestListSection
        eventId="event-1"
        initialEntries={[
          createEntry({ id: "e1", status: "Active" }),
          createEntry({ id: "e2", status: "Used" }),
          createEntry({ id: "e3", status: "Cancelled" }),
        ]}
        initialEntriesError={null}
      />,
    );

    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByText("Utilizada")).toBeInTheDocument();
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
  });

  it("renders the Spanish status label for lowercase statuses too", () => {
    render(
      <GuestListSection
        eventId="event-1"
        initialEntries={[
          // Lowercase on purpose: guards the case-insensitive normalization
          // against a future backend JSON casing-policy change.
          createEntry({ id: "e1", status: "active" as BackendGuestListEntry["status"] }),
          createEntry({ id: "e2", status: "used" as BackendGuestListEntry["status"] }),
          createEntry({ id: "e3", status: "cancelled" as BackendGuestListEntry["status"] }),
        ]}
        initialEntriesError={null}
      />,
    );

    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByText("Utilizada")).toBeInTheDocument();
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
  });

  it("renders the USED badge with a tone distinct from ACTIVE and CANCELLED", () => {
    render(
      <GuestListSection
        eventId="event-1"
        initialEntries={[
          createEntry({ id: "e1", status: "Active" }),
          createEntry({ id: "e2", status: "Used" }),
          createEntry({ id: "e3", status: "Cancelled" }),
        ]}
        initialEntriesError={null}
      />,
    );

    const activeBadge = screen.getByText("Activa");
    const usedBadge = screen.getByText("Utilizada");
    const cancelledBadge = screen.getByText("Cancelada");

    expect(usedBadge.className).not.toBe(activeBadge.className);
    expect(usedBadge.className).not.toBe(cancelledBadge.className);
  });

  it("only shows the Cancel action for active entries, regardless of casing", () => {
    render(
      <GuestListSection
        eventId="event-1"
        initialEntries={[
          createEntry({ id: "e1", status: "Active" }),
          createEntry({ id: "e2", status: "Used" }),
          createEntry({ id: "e3", status: "Cancelled" }),
        ]}
        initialEntriesError={null}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(1);
  });
});
