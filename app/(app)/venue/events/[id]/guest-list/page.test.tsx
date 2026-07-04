import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireReadyPageAccess, fetchEventGuestList } = vi.hoisted(() => ({
  requireReadyPageAccess: vi.fn(),
  fetchEventGuestList: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  requireReadyPageAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  fetchEventGuestList,
}));

vi.mock("@/components/guest-list-section", () => ({
  GuestListSection: ({ initialEntriesError }: { initialEntriesError: string | null }) => (
    <div data-testid="guest-list-section">{initialEntriesError}</div>
  ),
}));

import EventGuestListPage from "@/app/(app)/venue/events/[id]/guest-list/page";

async function renderPage(eventId = "event-1") {
  const page = await EventGuestListPage({ params: Promise.resolve({ id: eventId }) });
  return render(page);
}

describe("EventGuestListPage", () => {
  beforeEach(() => {
    requireReadyPageAccess.mockReset();
    requireReadyPageAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
    });
    fetchEventGuestList.mockReset();
  });

  it("shows a translated fallback error when the guest list fails to load without a message", async () => {
    fetchEventGuestList.mockRejectedValue("not-an-error-instance");

    await renderPage();

    expect(screen.getByText("No se pudo cargar la lista de invitados.")).toBeInTheDocument();
  });
});
