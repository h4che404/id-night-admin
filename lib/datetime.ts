/*
 * Single shared owner of es-AR datetime rendering (design ADR-1). Every
 * formatter here always passes an explicit timeZone, so output is
 * deterministic regardless of the server/runner's local TZ (ADR-3/ADR-8).
 *
 * Argentina observes no DST (fixed UTC-3 since 2009), so a plain IANA zone
 * name is sufficient — no seasonal offset logic is needed.
 */

const LOCALE = "es-AR";
const TIME_ZONE = "America/Argentina/Buenos_Aires";

const INVALID_OUTPUT = "—";

type DateTimeInput = string | number | Date | null | undefined;

function toValidDate(value: DateTimeInput): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/*
 * es-AR's Intl output inserts locale connector words ("de") between date
 * components, e.g. "4 de jul de 2026". The product convention is the
 * compact "4 jul 2026" form, so we render via formatToParts and collapse
 * that connector to a single space instead of switching to dateStyle
 * (rejected in ADR-1 — dateStyle/timeStyle risk ICU-version output drift).
 */
function partsToCompactString(parts: Intl.DateTimeFormatPart[]): string {
  return parts
    .map((part) => (part.type === "literal" && part.value === " de " ? " " : part.value))
    .join("");
}

const DATE_PART_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
};

const TIME_PART_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TIME_ZONE,
};

const TIME_WITH_SECONDS_PART_OPTIONS: Intl.DateTimeFormatOptions = {
  ...TIME_PART_OPTIONS,
  second: "2-digit",
};

const DATE_TIME_PART_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_PART_OPTIONS,
  ...TIME_PART_OPTIONS,
};

/** "4 jul 2026" */
export function formatDateAr(value: DateTimeInput): string {
  const date = toValidDate(value);
  if (!date) {
    return INVALID_OUTPUT;
  }
  const parts = new Intl.DateTimeFormat(LOCALE, DATE_PART_OPTIONS).formatToParts(date);
  return partsToCompactString(parts);
}

/** "20:00 hs" */
export function formatTimeAr(value: DateTimeInput): string {
  const date = toValidDate(value);
  if (!date) {
    return INVALID_OUTPUT;
  }
  const formatted = new Intl.DateTimeFormat(LOCALE, TIME_PART_OPTIONS).format(date);
  return `${formatted} hs`;
}

/** "20:00:00 hs" — audit precision, seconds retained per owner decision (#933). */
export function formatTimeWithSecondsAr(value: DateTimeInput): string {
  const date = toValidDate(value);
  if (!date) {
    return INVALID_OUTPUT;
  }
  const formatted = new Intl.DateTimeFormat(LOCALE, TIME_WITH_SECONDS_PART_OPTIONS).format(date);
  return `${formatted} hs`;
}

/** "4 jul 2026, 20:00 hs" */
export function formatDateTimeAr(value: DateTimeInput): string {
  const date = toValidDate(value);
  if (!date) {
    return INVALID_OUTPUT;
  }
  const parts = new Intl.DateTimeFormat(LOCALE, DATE_TIME_PART_OPTIONS).formatToParts(date);
  return `${partsToCompactString(parts)} hs`;
}
