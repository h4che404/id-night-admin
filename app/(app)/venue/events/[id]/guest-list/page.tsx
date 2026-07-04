import { GuestListSection } from "@/components/guest-list-section";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchEventGuestList } from "@/lib/idnight-backend";

export default async function EventGuestListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session } = readyAccess;

  let initialEntries: Awaited<ReturnType<typeof fetchEventGuestList>> = [];
  let initialEntriesError: string | null = null;
  try {
    initialEntries = await fetchEventGuestList(session.accessToken, eventId);
  } catch (error) {
    initialEntriesError =
      error instanceof Error ? error.message : "No se pudo cargar la lista de invitados.";
  }

  return (
    <GuestListSection
      eventId={eventId}
      initialEntries={initialEntries}
      initialEntriesError={initialEntriesError}
    />
  );
}
