import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IncidentEvidence } from "@/components/incident-evidence";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const aClip = {
  id: "media-1",
  incidentId: "inc_123",
  contentType: "video/mp4",
  sizeBytes: 2048,
  uploadedAt: "2026-08-27T02:00:00Z",
};

describe("IncidentEvidence", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    refreshMock.mockClear();
  });

  it("plays back what is already attached", () => {
    render(<IncidentEvidence incidentId="inc_123" media={[aClip]} />);

    // The bytes come through the panel's own route, never a blob URL and never with a bearer
    // token in the browser — the same shape the entry-photo gallery uses.
    const player = screen.getByTestId("incident-media-media-1");
    expect(player).toHaveAttribute(
      "src",
      "/api/venue/incidents/inc_123/media/media-1/content",
    );
  });

  it("says so plainly when there is nothing attached", () => {
    render(<IncidentEvidence incidentId="inc_123" media={[]} />);

    expect(screen.getByText(/sin evidencia adjunta/i)).toBeInTheDocument();
  });

  it("uploads the chosen file and refreshes so it appears", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(aClip), { status: 200 }));

    render(<IncidentEvidence incidentId="inc_123" media={[]} />);

    const file = new File([new Uint8Array([1, 2, 3])], "clip.mp4", { type: "video/mp4" });
    await userEvent.upload(screen.getByLabelText(/adjuntar evidencia/i), file);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/venue/incidents/inc_123/media");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBeInstanceOf(FormData);

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it("keeps the failure on screen instead of pretending the upload worked", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "El archivo supera el tamaño permitido." }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<IncidentEvidence incidentId="inc_123" media={[]} />);

    const file = new File([new Uint8Array([1])], "huge.mp4", { type: "video/mp4" });
    await userEvent.upload(screen.getByLabelText(/adjuntar evidencia/i), file);

    expect(await screen.findByText(/supera el tamaño permitido/i)).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
