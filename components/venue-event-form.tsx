"use client";

import { CalendarDays, Clock3, Plus, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField, PrimaryButton, Surface } from "@/components/ui-kit";
import type { BackendVenueEvent } from "@/lib/idnight-backend";
import { utcDateTimeInputToIso } from "@/lib/venue-events";

const GENERIC_CREATE_ERROR = "Could not create the event. Please try again.";
const GENERIC_EDIT_ERROR = "Could not update the event. Please try again.";
const UTC_SCHEDULE_HELP_TEXT =
  "This slice stores the exact date and time you enter as UTC. Use UTC values for both schedule fields.";

function isoToUtcDateTimeInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

type VenueEventFormProps = {
  event?: BackendVenueEvent;
  onClose?: () => void;
};

export function VenueEventForm({ event, onClose }: VenueEventFormProps = {}) {
  const router = useRouter();
  const isEditMode = Boolean(event);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(event?.name ?? "");
  const [startsAt, setStartsAt] = useState(event ? isoToUtcDateTimeInput(event.startsAt) : "");
  const [endsAt, setEndsAt] = useState(event ? isoToUtcDateTimeInput(event.endsAt ?? "") : "");
  const [maxCapacity, setMaxCapacity] = useState(
    event?.maxCapacity != null ? String(event.maxCapacity) : "",
  );
  const [minAge, setMinAge] = useState(event?.minAge != null ? String(event.minAge) : "0");
  const [allowManualDniCheck, setAllowManualDniCheck] = useState(
    event?.allowManualDniCheck ?? true,
  );
  const [requireGuestList, setRequireGuestList] = useState(event?.requireGuestList ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isControlledByParent = isEditMode || Boolean(onClose);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const parsedMaxCapacity = maxCapacity.trim() ? Number(maxCapacity) : null;
    const parsedMinAge = minAge.trim() ? Number(minAge) : 0;

    if (!Number.isInteger(parsedMinAge) || parsedMinAge < 0 || parsedMinAge > 120) {
      setError("Minimum age must be between 0 and 120.");
      setLoading(false);
      return;
    }

    const normalizedStartsAt = utcDateTimeInputToIso(startsAt);
    const normalizedEndsAt = utcDateTimeInputToIso(endsAt);

    if (!normalizedStartsAt || !normalizedEndsAt) {
      setError("Start and end must be valid date and time values.");
      setLoading(false);
      return;
    }

    const url = isEditMode ? `/api/venue/events/${event!.id}` : "/api/venue/events";
    const method = isEditMode ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startsAt: normalizedStartsAt,
          endsAt: normalizedEndsAt,
          maxCapacity: parsedMaxCapacity,
          minAge: parsedMinAge,
          allowManualDniCheck,
          requireGuestList,
        }),
      });

      let payload: { ok?: boolean; message?: string } = {};
      try {
        payload = (await response.json()) as { ok?: boolean; message?: string };
      } catch {
        payload = {};
      }

      if (!response.ok) {
        setError(payload.message ?? (isEditMode ? GENERIC_EDIT_ERROR : GENERIC_CREATE_ERROR));
        return;
      }

      setSuccess(true);
      router.refresh();

      if (isEditMode) {
        onClose?.();
      } else if (isControlledByParent) {
        setName("");
        setStartsAt("");
        setEndsAt("");
        setMaxCapacity("");
        setMinAge("0");
        setAllowManualDniCheck(true);
        setRequireGuestList(false);
        setTimeout(() => {
          setSuccess(false);
          onClose?.();
        }, 2000);
      } else {
        setName("");
        setStartsAt("");
        setEndsAt("");
        setMaxCapacity("");
        setMinAge("0");
        setAllowManualDniCheck(true);
        setRequireGuestList(false);
        setTimeout(() => {
          setSuccess(false);
          setOpen(false);
        }, 2000);
      }
    } catch {
      setError(isEditMode ? GENERIC_EDIT_ERROR : GENERIC_CREATE_ERROR);
    } finally {
      setLoading(false);
    }
  }

  if (!isControlledByParent && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-400/12 px-4 py-3 text-sm font-medium text-sky-50 transition hover:bg-sky-400/18"
      >
        <Plus className="h-4 w-4" />
        Create event
      </button>
    );
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {isEditMode ? "Edit event" : "New event"}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Capture the minimum scheduling data needed for a credible MVP event flow.
          </p>
        </div>
        <button
          onClick={() => (isControlledByParent ? onClose?.() : setOpen(false))}
          className="rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm text-slate-400 transition hover:text-slate-200"
        >
          Cancel
        </button>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Event name"
            icon={<CalendarDays className="h-4 w-4" />}
            value={name}
            onChange={setName}
            placeholder="Friday Opening"
          />
          <FormField
            label="Max capacity"
            icon={<Plus className="h-4 w-4" />}
            value={maxCapacity}
            onChange={setMaxCapacity}
            placeholder="500"
            type="number"
            required={false}
          />
          <FormField
            label="Starts at (UTC)"
            icon={<Clock3 className="h-4 w-4" />}
            value={startsAt}
            onChange={setStartsAt}
            type="datetime-local"
          />
          <FormField
            label="Ends at (UTC)"
            icon={<Clock3 className="h-4 w-4" />}
            value={endsAt}
            onChange={setEndsAt}
            type="datetime-local"
          />
        </div>

        <FormField
          label="Minimum age"
          icon={<Shield className="h-4 w-4" />}
          value={minAge}
          onChange={setMinAge}
          placeholder="0"
          type="number"
          required={false}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 transition hover:border-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-300"
              checked={allowManualDniCheck}
              onChange={(e) => setAllowManualDniCheck(e.target.checked)}
            />
            <span className="text-sm text-slate-200">Allow manual DNI check</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 transition hover:border-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-300"
              checked={requireGuestList}
              onChange={(e) => setRequireGuestList(e.target.checked)}
            />
            <span className="text-sm text-slate-200">Require guest list</span>
          </label>
        </div>

        <p className="text-xs leading-5 text-slate-400">{UTC_SCHEDULE_HELP_TEXT}</p>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {isEditMode ? "Event updated successfully." : "Event created successfully."}
          </div>
        ) : null}

        <div className="max-w-xs">
          <PrimaryButton loading={loading}>
            {loading
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save changes"
                : "Create event"}
          </PrimaryButton>
        </div>
      </form>
    </Surface>
  );
}
