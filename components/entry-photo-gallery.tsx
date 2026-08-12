import Image from "next/image";

import { Badge, EmptyState, Surface } from "@/components/ui-kit";
import type { BackendEntryPhotoCard } from "@/lib/idnight-backend";

const METHOD_LABELS: Record<string, string> = {
  ID_NIGHT_VERIFIED: "Verificado con ID-NIGHT",
  ManualDniCheck: "DNI manual",
  GuestListDniCheck: "Lista de invitados",
};

function methodLabel(method: string) {
  return METHOD_LABELS[method] ?? method;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha inválida";
  }
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

/**
 * One card per entry. Manual-DNI and guest-list entries never gain a face photo or a document
 * (owner decision #913, ADR-3/ADR-5) — the card shows that gap plainly instead of hiding the
 * entry or inventing a name/document for it (spec EP-12).
 */
function EntryPhotoCardView({ card }: { card: BackendEntryPhotoCard }) {
  return (
    <Surface className="space-y-2 p-3">
      {card.hasPhoto && card.entryPhotoId ? (
        <div className="relative h-40 w-full overflow-hidden rounded">
          {/* unoptimized: this route requires the caller's own session cookie (spec design.md —
              streamed, never a public/SAS URL), which Next's built-in image optimizer cannot
              forward when it re-fetches the source server-side. */}
          <Image
            src={`/api/venue/entry-photos/${card.entryPhotoId}/content`}
            alt="Foto de ingreso"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground">
          Sin foto
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <Badge label={methodLabel(card.method)} tone="neutral" />
        <span className="text-xs text-muted-foreground">{formatDateTime(card.occurredAt)}</span>
      </div>
      {card.documentLookupKey ? (
        <p className="font-mono text-xs text-muted-foreground">{card.documentLookupKey}</p>
      ) : null}
    </Surface>
  );
}

export function EntryPhotoGallery({
  cards,
  onSelectCard,
}: {
  cards: BackendEntryPhotoCard[];
  /**
   * Optional (S5b, task 5.12): when provided, every card able to identify someone becomes
   * clickable — "pointing at a face" is how an operator links a person to an incident. A card
   * with no `documentLookupKey` (nothing to link) stays visible but disabled, never hidden.
   */
  onSelectCard?: (card: BackendEntryPhotoCard) => void;
}) {
  if (cards.length === 0) {
    return (
      <EmptyState
        title="Sin ingresos"
        description="Todavía no hay ingresos registrados para este evento."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) =>
        onSelectCard ? (
          <button
            key={card.correlationId}
            type="button"
            disabled={!card.documentLookupKey}
            onClick={() => onSelectCard(card)}
            aria-label={`Vincular ingreso ${card.documentLookupKey ?? card.correlationId}`}
            className="text-left disabled:cursor-not-allowed disabled:opacity-50"
          >
            <EntryPhotoCardView card={card} />
          </button>
        ) : (
          <EntryPhotoCardView key={card.correlationId} card={card} />
        ),
      )}
    </div>
  );
}

/**
 * Placeholder only: offline-pack readiness (whether a device is actually enforcing the
 * organization's denylist) ships in a later slice (S7a). This banner exists so the screen never
 * silently implies protection it cannot yet confirm.
 */
export function EntryPhotoReadinessBanner() {
  return (
    <Surface className="p-3 text-xs text-muted-foreground">
      Estado de aplicación offline: próximamente.
    </Surface>
  );
}
