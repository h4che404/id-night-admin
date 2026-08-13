import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EntryPhotoGallery, EntryPhotoReadinessBanner } from "@/components/entry-photo-gallery";
import type { BackendEntryPhotoCard } from "@/lib/idnight-backend";

describe("EntryPhotoGallery", () => {
  it("renders a photoless card for a manual-DNI entry without inventing a name or document", () => {
    const cards: BackendEntryPhotoCard[] = [
      {
        entryPhotoId: null,
        correlationId: "corr-manual",
        method: "ManualDniCheck",
        outcome: "Allow",
        occurredAt: "2026-08-11T22:00:00Z",
        documentLookupKey: null,
        hasPhoto: false,
      },
    ];

    render(<EntryPhotoGallery cards={cards} />);

    expect(screen.getByText("Sin foto")).toBeInTheDocument();
    expect(screen.getByText("DNI manual")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders a photo card as an image sourced from the streaming proxy, never a raw blob URL", () => {
    const cards: BackendEntryPhotoCard[] = [
      {
        entryPhotoId: "photo-1",
        correlationId: "corr-1",
        method: "ID_NIGHT_VERIFIED",
        outcome: "Captured",
        occurredAt: "2026-08-11T22:00:00Z",
        documentLookupKey: "DOC123",
        hasPhoto: true,
      },
    ];

    render(<EntryPhotoGallery cards={cards} />);

    const img = screen.getByRole("img", { name: /foto de ingreso/i });
    expect(img).toHaveAttribute("src", "/api/venue/entry-photos/photo-1/content");
  });

  it("shows an empty state when there are no entries", () => {
    render(<EntryPhotoGallery cards={[]} />);

    expect(screen.getByText(/sin ingresos/i)).toBeInTheDocument();
  });
});

describe("EntryPhotoReadinessBanner", () => {
  it("renders a placeholder banner, not a claim of enforcement it cannot back yet", () => {
    render(<EntryPhotoReadinessBanner />);

    expect(screen.getByText(/próximamente/i)).toBeInTheDocument();
  });
});
