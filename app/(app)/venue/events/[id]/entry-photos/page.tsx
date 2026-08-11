import { Suspense } from "react";

import { EntryPhotoGallery, EntryPhotoReadinessBanner } from "@/components/entry-photo-gallery";
import { ErrorPanel, LoadingSkeleton } from "@/components/ui-kit";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchEntryPhotoGallery } from "@/lib/idnight-backend";

async function EntryPhotoGalleryData({
  token,
  venueId,
  eventId,
}: {
  token: string;
  venueId: string;
  eventId: string;
}) {
  try {
    const cards = await fetchEntryPhotoGallery(token, venueId, eventId);
    return <EntryPhotoGallery cards={cards} />;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar las fotos de ingreso.";
    return <ErrorPanel message={message} />;
  }
}

export default async function EventEntryPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session, venueSummary } = readyAccess;

  return (
    <div className="space-y-4">
      <EntryPhotoReadinessBanner />

      <Suspense fallback={<LoadingSkeleton />}>
        <EntryPhotoGalleryData token={session.accessToken} venueId={venueSummary.id} eventId={eventId} />
      </Suspense>
    </div>
  );
}
