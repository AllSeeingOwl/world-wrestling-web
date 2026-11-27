// Picks "See also" entries for an entry page: those that share people, a promotion or a decade
// with it. Shared people count most, so the links follow the people a reader is interested in.
import { entryDecade } from './decade.js';

// A shared registry section only breaks ties: on its own it is too broad to count as related.
const WEIGHTS = { person: 3, promotion: 2, decade: 1, section: 0.5 };

// "Fray Tormenta (referenced)" and "Fray Tormenta (inspiration and cameo)" are the same person.
function personKey(name) {
  return name
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim()
    .toLowerCase();
}

function people(data) {
  const names = new Map();
  for (const name of data.wrestlers_involved ?? []) {
    const key = personKey(name);
    if (key && !names.has(key)) names.set(key, name.replace(/\s*\(.*?\)\s*/g, ' ').trim());
  }
  return names;
}

function joinNames(names) {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

/**
 * @param {{ id: string, data: object }} entry  the entry being shown
 * @param {{ id: string, data: object }[]} all  every entry in the registry
 * @param {number} limit  how many to return
 * @returns {{ id: string, title: string, reason: string }[]}
 */
export function relatedEntries(entry, all, limit = 3) {
  const mine = people(entry.data);
  const myDecade = entryDecade(entry.data);

  const scored = [];
  for (const other of all) {
    if (other.id === entry.id) continue;
    const theirs = people(other.data);
    const shared = [...mine.keys()].filter((key) => theirs.has(key)).map((key) => mine.get(key));
    const samePromotion = other.data.promotion === entry.data.promotion;
    const sameDecade = entryDecade(other.data) === myDecade;

    const base =
      shared.length * WEIGHTS.person +
      (samePromotion ? WEIGHTS.promotion : 0) +
      (sameDecade ? WEIGHTS.decade : 0);
    if (base === 0) continue;
    const sameSection = other.data.registry_section === entry.data.registry_section;
    const score = base + (sameSection ? WEIGHTS.section : 0);

    let reason;
    if (shared.length) reason = `Also features ${joinNames(shared.slice(0, 3))}`;
    else if (samePromotion) reason = `Also from ${entry.data.promotion}`;
    else reason = `Also from the ${myDecade}`;

    // Ties go to the entry closest in time.
    const gap = Math.abs(Date.parse(other.data.date) - Date.parse(entry.data.date));
    scored.push({ id: other.id, title: other.data.title, reason, score, gap });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.gap - b.gap || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(({ id, title, reason }) => ({ id, title, reason }));
}
