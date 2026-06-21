const UTC_INPUT_DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const ISO_DATETIME_WITH_TIMEZONE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|([+-])(\d{2}):(\d{2}))$/;

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

type ErrorWithStatus = Error & { status: number };

function isBackendApiError(error: unknown): error is ErrorWithStatus {
  return error instanceof Error && typeof (error as { status?: unknown }).status === "number";
}

function parseMilliseconds(value?: string) {
  return Number((value ?? "").padEnd(3, "0") || "0");
}

function hasMatchingDateParts(
  date: Date,
  parts: DateParts,
  mode: "local" | "utc",
) {
  const getYear = mode === "local" ? date.getFullYear() : date.getUTCFullYear();
  const getMonth = (mode === "local" ? date.getMonth() : date.getUTCMonth()) + 1;
  const getDay = mode === "local" ? date.getDate() : date.getUTCDate();
  const getHour = mode === "local" ? date.getHours() : date.getUTCHours();
  const getMinute = mode === "local" ? date.getMinutes() : date.getUTCMinutes();
  const getSecond = mode === "local" ? date.getSeconds() : date.getUTCSeconds();
  const getMillisecond = mode === "local" ? date.getMilliseconds() : date.getUTCMilliseconds();

  return (
    getYear === parts.year &&
    getMonth === parts.month &&
    getDay === parts.day &&
    getHour === parts.hour &&
    getMinute === parts.minute &&
    getSecond === parts.second &&
    getMillisecond === parts.millisecond
  );
}

export function utcDateTimeInputToIso(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(UTC_INPUT_DATETIME_PATTERN);

  if (!match) {
    return null;
  }

  const parts: DateParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: 0,
    millisecond: 0,
  };

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));

  if (Number.isNaN(date.getTime()) || !hasMatchingDateParts(date, parts, "utc")) {
    return null;
  }

  return date.toISOString();
}

export const localDateTimeToUtcIso = utcDateTimeInputToIso;

export function normalizeEventInstant(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(ISO_DATETIME_WITH_TIMEZONE_PATTERN);

  if (!match) {
    return null;
  }

  const parts: DateParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? "0"),
    millisecond: parseMilliseconds(match[7]),
  };
  const timeZoneDesignator = match[8];
  const offsetSign = match[9];
  const offsetHour = Number(match[10] ?? "0");
  const offsetMinute = Number(match[11] ?? "0");
  const offsetMinutes =
    timeZoneDesignator === "Z"
      ? 0
      : (offsetHour * 60 + offsetMinute) * (offsetSign === "+" ? 1 : -1);
  const timestamp =
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond,
    ) -
    offsetMinutes * 60_000;
  const date = new Date(timestamp);
  const shiftedDate = new Date(timestamp + offsetMinutes * 60_000);

  if (Number.isNaN(date.getTime()) || !hasMatchingDateParts(shiftedDate, parts, "utc")) {
    return null;
  }

  return date.toISOString();
}

export function formatEventDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Schedule unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

export function formatEventSchedule(startsAt: string, endsAt: string) {
  return `${formatEventDateTime(startsAt)} → ${formatEventDateTime(endsAt)}`;
}

export function getSafeEventErrorMessage(error: unknown, fallbackMessage: string) {
  if (isBackendApiError(error) && error.status >= 400 && error.status < 500) {
    return error.message;
  }

  return fallbackMessage;
}

export function isVenueMissingError(error: unknown) {
  return isBackendApiError(error) && error.status === 404;
}
