import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OwnerOnboardingForm } from "@/components/owner-onboarding-form";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

describe("OwnerOnboardingForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    pushMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("submits the onboarding payload and navigates to the venue page", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<OwnerOnboardingForm />);

    fireEvent.change(screen.getByPlaceholderText("Ej: Nocturna SA"), {
      target: { value: "Nocturna SA" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej: Club Prisma"), {
      target: { value: "Club Prisma" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej: Arístides 1200"), {
      target: { value: "Arístides 1200" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej: Mendoza"), {
      target: { value: "Mendoza" },
    });

    await user.click(screen.getByRole("button", { name: /crear organización/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/owner-onboarding",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: "Nocturna SA",
          venueName: "Club Prisma",
          address: "Arístides 1200",
          city: "Mendoza",
        }),
      }),
    );
    expect(pushMock).toHaveBeenCalledWith("/venue");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("shows the backend error message", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Ya existe una organización activa para esta cuenta." }),
    });

    render(<OwnerOnboardingForm />);

    fireEvent.change(screen.getByPlaceholderText("Ej: Nocturna SA"), {
      target: { value: "Nocturna SA" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej: Club Prisma"), {
      target: { value: "Club Prisma" },
    });

    await user.click(screen.getByRole("button", { name: /crear organización/i }));

    expect(
      await screen.findByText("Ya existe una organización activa para esta cuenta."),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
