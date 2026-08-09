// Single source for user-facing date-time formatting. The event runs in Africa/Lagos (GMT+1);
// dates are shown in that zone in en-GB style everywhere (console, reports, emails, print).
// Move the timezone to a per-tenant setting if the multi-tenant direction lands (B-023).
const DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: 'Africa/Lagos',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

/**
 * Format a Date / ISO string / epoch in the event's local time (Africa/Lagos, en-GB).
 * Empty / null / unparseable input → null, so callers can fall back to a dash.
 */
export function formatEventDateTime(value: Date | string | number | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString('en-GB', DATETIME_OPTS);
}
