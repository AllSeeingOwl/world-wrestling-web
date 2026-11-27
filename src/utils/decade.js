// The decade an entry belongs to: its `era` field if set (always a decade, e.g. '1990s'),
// otherwise the decade of its date. Used by the Home and Directory filters.
export function entryDecade({ era, date }) {
  if (era) return era;
  const match = /^(\d{3})\d/.exec(date || '');
  return match ? `${match[1]}0s` : 'Undated';
}
