// Formats an ISO date (YYYY-MM-DD) as, for example, "February 20, 1989". Dates are read as UTC
// so they never shift by a day in the reader's time zone.
export function formatLongDate(value) {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) return value || '';
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
