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

    expect(screen.getAllByRole("button", { name: "Cancelar" })).toHaveLength(1);
  });

  it("renders the imported date in Argentina local time, deterministically regardless of runtime TZ", () => {
    render(
      <GuestListSection
        eventId="event-1"
        initialEntries={[
          // 2026-07-01T00:00:00Z is 2026-06-30 21:00 in America/Argentina/Buenos_Aires
          // (UTC-03:00) — a cross-midnight instant that would have exposed the old
          // runtime-TZ-dependent `toLocaleDateString()` bug.
          createEntry({ id: "e1", importedAt: "2026-07-01T00:00:00.000Z" }),
        ]}
        initialEntriesError={null}
      />,
    );

    const row = screen.getByText("Ana Pérez").closest("tr");
    expect(row).not.toBeNull();
    expect(row!.cells[4].textContent).toBe("30 jun 2026");
  });

  it("renders every column header, the section title, and the actions column in Spanish", () => {
    render(
      <GuestListSection
        eventId="event-1"
        initialEntries={[createEntry()]}
        initialEntriesError={null}
      />,
    );

    expect(screen.getByText("Lista de invitados")).toBeInTheDocument();
    expect(screen.getByText("1 entrada")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "DNI" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Categoría" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Estado" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Importado el" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Acciones" })).toBeInTheDocument();
  });

  it("pluralizes the entry-count subtitle correctly", () => {
    render(
      <GuestListSection
        eventId="event-1"
        initialEntries={[createEntry({ id: "e1" }), createEntry({ id: "e2" })]}
        initialEntriesError={null}
      />,
    );

    expect(screen.getByText("2 entradas")).toBeInTheDocument();
  });

  it("renders the import panel, search box, and empty state copy in Spanish", () => {
    render(
      <GuestListSection eventId="event-1" initialEntries={[]} initialEntriesError={null} />,
    );

    expect(screen.getByText("Importar lista de invitados")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Subí un archivo CSV o XLSX con las columnas: dni, nombre, apellido, categoria (opcional).",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Archivo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir" })).toBeInTheDocument();
    expect(
      screen.getByText("Todavía no hay invitados. Subí un archivo para agregarlos."),
    ).toBeInTheDocument();
  });

  it("shows the Spanish search placeholder and no-match copy when entries exist", () => {
    render(
      <GuestListSection
        eventId="event-1"
        initialEntries={[createEntry()]}
        initialEntriesError={null}
      />,
    );

    expect(
      screen.getByPlaceholderText("Buscar por nombre o sufijo de DNI..."),
    ).toBeInTheDocument();
  });

  it("shows the Spanish error panel copy when the guest list fails to load", () => {
    render(
      <GuestListSection
        eventId="event-1"
        initialEntries={[]}
        initialEntriesError="backend unavailable"
      />,
    );

    expect(screen.getByText("No se pudo cargar la lista de invitados")).toBeInTheDocument();
    expect(screen.getByText("backend unavailable")).toBeInTheDocument();
  });
});
