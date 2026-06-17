import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegisterForm } from "@/components/register-form";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    pushMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("submits a valid registration payload and redirects", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/nombre/i), "Juan");
    await user.type(screen.getByLabelText(/apellido/i), "Perez");
    await user.type(screen.getByLabelText(/email/i), "juan@example.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");

    await user.click(screen.getByRole("button", { name: /^registrarse$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "juan@example.com",
          password: "password123",
          firstName: "Juan",
          lastName: "Perez",
        }),
      }),
    );
    expect(pushMock).toHaveBeenCalledWith("/owner-onboarding");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("shows email confirmation message if requiresEmailConfirmation is true", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, requiresEmailConfirmation: true }),
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/nombre/i), "Juan");
    await user.type(screen.getByLabelText(/apellido/i), "Perez");
    await user.type(screen.getByLabelText(/email/i), "juan@example.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");

    await user.click(screen.getByRole("button", { name: /^registrarse$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText("Revisá tu email para activar la cuenta")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("shows the backend registration error", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "El usuario ya existe." }),
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/nombre/i), "Juan");
    await user.type(screen.getByLabelText(/apellido/i), "Perez");
    await user.type(screen.getByLabelText(/email/i), "juan@example.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");

    await user.click(screen.getByRole("button", { name: /^registrarse$/i }));

    expect(await screen.findByText("El usuario ya existe.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows a fallback error when response parsing fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("SyntaxError: Unexpected token < in JSON at position 0");
      },
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/nombre/i), "Juan");
    await user.type(screen.getByLabelText(/apellido/i), "Perez");
    await user.type(screen.getByLabelText(/email/i), "juan@example.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");

    await user.click(screen.getByRole("button", { name: /^registrarse$/i }));

    expect(await screen.findByText("Ocurrió un error inesperado al registrar la cuenta.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not submit when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: /^registrarse$/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
