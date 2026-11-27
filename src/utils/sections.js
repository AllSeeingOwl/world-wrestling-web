// One colour per registry section, used everywhere a section appears (cards, entry pages,
// the Directory and the Home legend), so readers can tell sections apart at a glance.
// Gold is kept for Excellence; the Infamy divisions are red family, with Division B (the
// charter's "Red Line" registry) the strongest; Homage & Influence is blue. The section's
// name is always shown alongside its colour, so the coding never relies on colour alone.
//
// Class names are written out in full so Tailwind can find them when building the CSS.
export const SECTION_STYLES = {
  'Registry of Excellence': {
    short: 'Excellence',
    stripe: 'border-l-amber-400',
    band: 'border-t-amber-400',
    text: 'text-amber-300',
    chip: 'bg-amber-400 text-slate-900',
    outline: 'border-amber-400 text-amber-300',
    dot: 'bg-amber-400 border-amber-400',
    swatch: 'bg-amber-400',
  },
  'Registry of Infamy - Division A': {
    short: 'Infamy: Failures in Craft',
    stripe: 'border-l-rose-400',
    band: 'border-t-rose-400',
    text: 'text-rose-300',
    chip: 'bg-rose-400 text-slate-900',
    outline: 'border-rose-400 text-rose-300',
    dot: 'bg-rose-400 border-rose-400',
    swatch: 'bg-rose-400',
  },
  'Registry of Infamy - Division B': {
    short: 'Infamy: Cautionary Archive',
    stripe: 'border-l-red-500',
    band: 'border-t-red-500',
    text: 'text-red-300',
    chip: 'bg-red-500 text-slate-900',
    outline: 'border-red-500 text-red-300',
    dot: 'bg-red-500 border-red-500',
    swatch: 'bg-red-500',
  },
  'Registry of Homage & Influence': {
    short: 'Homage & Influence',
    stripe: 'border-l-sky-400',
    band: 'border-t-sky-400',
    text: 'text-sky-300',
    chip: 'bg-sky-400 text-slate-900',
    outline: 'border-sky-400 text-sky-300',
    dot: 'bg-sky-400 border-sky-400',
    swatch: 'bg-sky-400',
  },
};

const FALLBACK = {
  short: 'Unclassified',
  stripe: 'border-l-slate-500',
  band: 'border-t-slate-500',
  text: 'text-registry-textMuted',
  chip: 'bg-slate-500 text-slate-900',
  outline: 'border-slate-500 text-registry-textMuted',
  dot: 'bg-registry-background border-registry-textMuted',
  swatch: 'bg-slate-500',
};

export function sectionStyle(section) {
  return SECTION_STYLES[section] ?? FALLBACK;
}
