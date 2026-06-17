import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecurityUserActions } from "@/components/security-user-actions";

const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

function renderActions(active = true) {
  return render(
    <SecurityUserActions
      userId="user-1"
      active={active}
    />, 
  );
}

describe("SecurityUserActions", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("forwards user status toggles", async () => {
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
      "/api/venue/security-users/user-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("does not call router.refresh() on network or server failure", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ ok: false }),
    });

    renderActions(true);

    await user.click(screen.getByRole("button", { name: /desactivar/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(refreshMock).not.toHaveBeenCalled();
  });
});