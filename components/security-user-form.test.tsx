import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecurityUserForm } from "@/components/security-user-form";

const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

async function openAndFillForm(
  user: ReturnType<typeof userEvent.setup>,
  opts: { password?: string; confirmPassword?: string } = {},
) {
  await user.click(screen.getByRole("button", { name: /crear usuario de seguridad/i }));

  await user.type(screen.getByLabelText(/nombre/i), "Juan");
  await user.type(screen.getByLabelText(/apellido/i), "Perez");
  await user.type(screen.getByLabelText(/email/i), "juan@example.com");
  await user.type(screen.getByLabelText(/contraseña inicial/i), opts.password ?? "Password123");
  await user.type(screen.getByLabelText(/confirmar contraseña/i), opts.confirmPassword ?? "Password123");
}

describe("SecurityUserForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("submits a valid security user payload", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<SecurityUserForm />);

    await openAndFillForm(user);

    await user.click(screen.getByRole("button", { name: /^crear usuario$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venue/security-users",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Juan",
          lastName: "Perez",
          email: "juan@example.com",
          password: "Password123",
        }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Invitación enviada correctamente.")).toBeInTheDocument();
  });

  it("shows the backend registration error", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "El usuario ya existe." }),
    });

    render(<SecurityUserForm />);

    await openAndFillForm(user);

    await user.click(screen.getByRole("button", { name: /^crear usuario$/i }));

    expect(await screen.findByText("El usuario ya existe.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("does not submit when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<SecurityUserForm />);

    await user.click(screen.getByRole("button", { name: /crear usuario de seguridad/i }));
    await user.click(screen.getByRole("button", { name: /^crear usuario$/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    // HTML5 validation prevents submission, so no refresh or fetch should occur.
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<SecurityUserForm />);

    await openAndFillForm(user, { password: "Password123", confirmPassword: "Different1" });

    await user.click(screen.getByRole("button", { name: /^crear usuario$/i }));

    expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows validation error when password is too short", async () => {
    const user = userEvent.setup();
    render(<SecurityUserForm />);

    await openAndFillForm(user, { password: "short", confirmPassword: "short" });

    await user.click(screen.getByRole("button", { name: /^crear usuario$/i }));

    expect(await screen.findByText("La contraseña debe tener al menos 8 caracteres.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
