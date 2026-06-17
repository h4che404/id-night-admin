import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VenueEntryRulesForm } from "@/components/venue-entry-rules-form";

const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const initialRules = {
  active: true,
  minimumAge: 21,
  requireVerifiedAdult: true,
  requireIdentityVerification: false,
  requireValidTicket: true,
  allowManualReview: false,
  notes: "Derivar a supervisor si el caso requiere revisión adicional.",
};

function renderForm() {
  return render(<VenueEntryRulesForm initialRules={initialRules} />);
}

function getMinimumAgeInput() {
  return screen.getByPlaceholderText("18") as HTMLInputElement;
}

function getNotesInput() {
  return screen.getByPlaceholderText(
    "Ej.: derivar a supervisor si la verificación facial requiere revisión manual.",
  ) as HTMLTextAreaElement;
}

describe("VenueEntryRulesForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("renders the current rule values", () => {
    renderForm();

    expect(getMinimumAgeInput().value).toBe("21");
    expect(screen.getByRole("checkbox", { name: /regla activa/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /exigir mayoría de edad verificada/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /exigir verificación de identidad/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /exigir ticket o entrada válida/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /permitir revisión manual/i })).not.toBeChecked();
    expect(getNotesInput()).toHaveValue(initialRules.notes);
  });

  it("rejects a non-integer minimum age before submit", async () => {
    const user = userEvent.setup();

    renderForm();
    fireEvent.change(getMinimumAgeInput(), { target: { value: "18.5" } });

    await user.click(screen.getByRole("button", { name: /guardar requisitos/i }));

    expect(await screen.findByText("La edad mínima debe ser un número entero.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range minimum age before submit", async () => {
    const user = userEvent.setup();

    renderForm();
    fireEvent.change(getMinimumAgeInput(), { target: { value: "121" } });

    await user.click(screen.getByRole("button", { name: /guardar requisitos/i }));

    expect(await screen.findByText("La edad mínima debe estar entre 0 y 120 años.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a valid full payload to the venue entry-rules API", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    renderForm();

    fireEvent.change(getMinimumAgeInput(), { target: { value: "25" } });
    fireEvent.change(getNotesInput(), {
      target: { value: "Pedir revisión manual si hay inconsistencias en la verificación." },
    });
    await user.click(screen.getByRole("checkbox", { name: /exigir verificación de identidad/i }));
    await user.click(screen.getByRole("checkbox", { name: /permitir revisión manual/i }));
    await user.click(screen.getByRole("button", { name: /guardar requisitos/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/venue/entry-rules",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: true,
          minimumAge: 25,
          requireVerifiedAdult: true,
          requireIdentityVerification: true,
          requireValidTicket: true,
          allowManualReview: true,
          notes: "Pedir revisión manual si hay inconsistencias en la verificación.",
        }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Requisitos de ingreso guardados correctamente.")).toBeInTheDocument();
  });

  it("displays a backend save error", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "No se pudieron guardar los requisitos desde el backend." }),
    });

    renderForm();
    await user.click(screen.getByRole("button", { name: /guardar requisitos/i }));

    expect(
      await screen.findByText("No se pudieron guardar los requisitos desde el backend."),
    ).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
