import React, { useEffect, useMemo, useRef, useState } from 'react';
import { archiveSchema } from '../schema/archive';
import { buildMarkdown, countWords, slugify } from '../utils/entry-markdown.js';

// Adapted from Fic-His-Arch's ContributeForm. Everything happens in the browser:
// the form validates against the same schema as the site build, then hands the
// contributor a ready-made Markdown file to submit as a pull request.

// Which significance types belong to which section, per the IPWHR charter
// ("The International Professional Wrestling Heritage Registry" Google Doc).
// The Cautionary Archive (Registry of Infamy - Division B) is left out on purpose:
// the charter says it is not open to public nomination, and the Preservation Board
// chooses its inductees privately. Editors add those entries directly.
const SECTIONS = [
  {
    value: 'Registry of Excellence',
    hint: 'Outstanding artistic, historical or cultural achievement. The entry must be significant in at least one of the three ways below.',
    significance: ['Cultural Significance', 'Historical Significance', 'Aesthetic Significance'],
  },
  {
    value: 'Registry of Infamy - Division A',
    hint: 'Failures in craft: creative, technical or conceptual. These are case studies for performers, bookers and producers, not a chance to mock.',
    significance: [
      'Conceptual Failure',
      'Technical Failure',
      'Contextual Failure',
      "So Bad It's Good",
    ],
  },
  {
    value: 'Registry of Homage & Influence',
    hint: 'A work from outside the wrestling industry (a video game, cartoon, film or other media) with a clear, demonstrable element taken from or paying homage to wrestling.',
    significance: ['Homage & Influence'],
  },
];

// What each type of significance means, from the charter.
const SIGNIFICANCE_DETAILS = {
  'Cultural Significance':
    'It crossed over into the wider public consciousness, reflecting or influencing the values, trends and conversations of its time.',
  'Historical Significance':
    'It fundamentally changed the industry: a pivotal business decision, a debut that launched a new era, an influential event or a definitive "passing of the torch".',
  'Aesthetic Significance':
    'It is recognised for exceptional artistic and athletic merit: brilliant in-ring storytelling, innovative technique, unique character work or masterful execution.',
  'Conceptual Failure': 'The idea was fundamentally flawed, bizarre or nonsensical from the start.',
  'Technical Failure':
    'The execution of a move, promo or segment collapsed through error, accident or poor planning.',
  'Contextual Failure':
    'It misjudged the audience, the cultural climate or the story so far, and came across as tone-deaf or counterproductive.',
  "So Bad It's Good":
    'It failed so spectacularly at what it set out to do that it looped back around to become iconic and beloved.',
  'Homage & Influence':
    "A character homage, a story built on wrestling tropes (tournament arcs, heel turns, stable warfare), wrestling's visual language, or a direct parody of the wrestling world.",
};

// The charter: a work must be at least five years old so its legacy can be understood.
const MIN_AGE_YEARS = 5;

function latestEligibleDate(now = new Date()) {
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - MIN_AGE_YEARS);
  return d.toISOString().slice(0, 10);
}

const MIN_WORDS = 100;
const MAX_WORDS = 2000;
const MAX_DESCRIPTION = 300;
// Beyond this, the "open on GitHub" link may be too long for browsers or GitHub.
const MAX_GITHUB_URL = 8000;
const DRAFT_KEY = 'wwr-contribute-draft-v1';

const EMPTY = {
  title: '',
  event_name: '',
  date: '',
  air_date: '',
  promotion: '',
  era: '',
  registry_section: '',
  significance: '',
  wrestlers: '',
  description: '',
  source_material: '',
  context_statement: '',
  image_url: '',
  body: '',
};

const inputClass =
  'w-full bg-registry-background border border-registry-border rounded px-3 py-2 text-sm text-registry-text placeholder:text-registry-textMuted focus:outline-none focus:border-registry-gold focus-visible:ring-2 focus-visible:ring-registry-gold aria-[invalid=true]:border-registry-red';

function Field({ id, label, required, hint, error, children }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-semibold text-registry-text">
        {label}
        {required ? (
          <span className="text-registry-gold" aria-hidden="true">
            {' '}
            *
          </span>
        ) : (
          <span className="font-normal text-registry-textMuted"> (optional)</span>
        )}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-registry-textMuted">
          {hint}
        </p>
      )}
      {React.cloneElement(children, {
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': describedBy || undefined,
        'aria-required': required ? 'true' : undefined,
      })}
      {error && (
        <p id={`${id}-error`} className="text-xs font-semibold text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <fieldset className="bg-registry-surface border border-registry-border rounded-lg p-4 sm:p-6 space-y-5">
      <legend className="px-2 -ml-2 font-mono text-xs uppercase tracking-widest text-registry-gold">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function toEntry(fields, links) {
  const optional = (v) => (v.trim() ? v.trim() : undefined);
  return {
    title: fields.title.trim(),
    date: fields.date,
    air_date: optional(fields.air_date),
    promotion: fields.promotion.trim(),
    significance: fields.significance,
    registry_section: fields.registry_section,
    event_name: optional(fields.event_name),
    era: optional(fields.era),
    description: optional(fields.description),
    wrestlers_involved: fields.wrestlers
      .split('\n')
      .map((w) => w.trim())
      .filter(Boolean),
    image_url: optional(fields.image_url),
    source_material: optional(fields.source_material),
    context_statement: optional(fields.context_statement),
    external_links: links
      .map((l) => ({ name: l.name.trim(), url: l.url.trim() }))
      .filter((l) => l.name || l.url),
  };
}

function validate(fields, links, existingSlugs) {
  const errors = {};
  const entry = toEntry(fields, links);
  const add = (key, message) => {
    if (!errors[key]) errors[key] = message;
  };

  // Rules from the handbook and schema.md that the schema leaves optional.
  if (!entry.title) add('title', 'Give the entry a title.');
  if (!entry.date) add('date', 'Enter the date of the event.');
  if (!entry.promotion) add('promotion', 'Name the promotion or creator.');
  if (!entry.registry_section) add('registry_section', 'Choose a registry section.');
  if (!entry.significance) add('significance', 'Choose the type of significance.');
  if (!entry.wrestlers_involved.length) add('wrestlers', 'List at least one person involved.');
  if (!entry.description) add('description', 'Write a one-sentence summary.');
  else if (entry.description.length > MAX_DESCRIPTION)
    add('description', `Keep the summary under ${MAX_DESCRIPTION} characters.`);
  if (!entry.source_material) add('source_material', 'Say where the information comes from.');
  if (!entry.context_statement)
    add('context_statement', 'Explain why this moment is historically significant.');

  const today = new Date().toISOString().slice(0, 10);
  if (entry.date && entry.date > today) add('date', 'The date cannot be in the future.');
  else if (entry.date && entry.date > latestEligibleDate())
    add(
      'date',
      `Works must be at least ${MIN_AGE_YEARS} years old to be nominated, so their legacy can be judged.`
    );
  if (entry.air_date && entry.date && entry.air_date < entry.date)
    add('air_date', 'The broadcast date cannot be before the event or taping date.');

  const section = SECTIONS.find((s) => s.value === entry.registry_section);
  if (entry.registry_section && !section)
    add(
      'registry_section',
      'This section is not open to public nomination. Choose another section.'
    );
  if (section && entry.significance && !section.significance.includes(entry.significance))
    add('significance', `This type of significance doesn't belong in the ${section.value}.`);

  const words = countWords(fields.body);
  if (words < MIN_WORDS) add('body', `Write at least ${MIN_WORDS} words (currently ${words}).`);
  else if (words > MAX_WORDS)
    add('body', `Keep the article under ${MAX_WORDS} words (currently ${words}).`);

  const slug = slugify(entry.title);
  if (slug && existingSlugs.includes(slug))
    add('title', 'An entry with this title already exists. Choose a more specific title.');

  links.forEach((link, i) => {
    const name = link.name.trim();
    const url = link.url.trim();
    if (url && !name) add(`link-name-${i}`, 'Give this link a name.');
    if (name && !url) add(`link-url-${i}`, 'Add the link address.');
  });

  // Finally, the exact schema the site build uses.
  const result = archiveSchema.safeParse({
    ...entry,
    wrestlers_involved: entry.wrestlers_involved.length ? entry.wrestlers_involved : undefined,
    external_links: entry.external_links.length ? entry.external_links : undefined,
  });
  if (!result.success) {
    for (const issue of result.error.issues) {
      const [field, index, sub] = issue.path;
      if (field === 'external_links') add(`link-${sub}-${index}`, issue.message);
      else if (field === 'wrestlers_involved') add('wrestlers', issue.message);
      else add(String(field), issue.message);
    }
  }

  return { errors, entry, slug };
}

const FIELD_ORDER = [
  'title',
  'event_name',
  'date',
  'air_date',
  'promotion',
  'era',
  'registry_section',
  'significance',
  'wrestlers',
  'description',
  'source_material',
  'context_statement',
  'image_url',
];

function fieldId(key) {
  return `contribute-${key.replace(/_/g, '-')}`;
}

function readDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ContributeForm({
  repo,
  branch = 'main',
  existingSlugs = [],
  promotions = [],
  eras = [],
}) {
  const [fields, setFields] = useState(EMPTY);
  const [links, setLinks] = useState([]);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const summaryRef = useRef(null);
  const reviewRef = useRef(null);

  // Restore a saved draft once, then save on every change.
  useEffect(() => {
    const draft = readDraft();
    if (draft?.fields) {
      const restored = { ...EMPTY, ...draft.fields };
      // Drafts saved before Division B was removed may still hold it.
      if (!SECTIONS.some((s) => s.value === restored.registry_section)) {
        restored.registry_section = '';
        restored.significance = '';
      }
      setFields(restored);
      setLinks(Array.isArray(draft.links) ? draft.links : []);
      setDraftRestored(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const isEmpty = links.length === 0 && Object.values(fields).every((v) => !v.trim());
    try {
      if (isEmpty) window.localStorage.removeItem(DRAFT_KEY);
      else window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ fields, links }));
    } catch {
      // Storage unavailable (private mode, blocked): the form still works without drafts.
    }
  }, [fields, links, hydrated]);

  const section = SECTIONS.find((s) => s.value === fields.registry_section);
  const significanceOptions = section ? section.significance : [];
  const bodyWords = useMemo(() => countWords(fields.body), [fields.body]);

  const update = (key, value) => {
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      // Clear a significance that no longer fits the chosen section.
      if (key === 'registry_section') {
        const s = SECTIONS.find((x) => x.value === value);
        if (!s || !s.significance.includes(prev.significance)) {
          next.significance = s && s.significance.length === 1 ? s.significance[0] : '';
        }
      }
      return next;
    });
    setResult(null);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const bind = (key) => ({
    name: key,
    value: fields[key],
    onChange: (e) => update(key, e.target.value),
  });

  const updateLink = (index, key, value) => {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, [key]: value } : l)));
    setResult(null);
    if (errors[`link-${key}-${index}`])
      setErrors((prev) => ({ ...prev, [`link-${key}-${index}`]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCopied(false);
    const { errors: found, entry, slug } = validate(fields, links, existingSlugs);
    const active = Object.fromEntries(Object.entries(found).filter(([, v]) => v));
    setErrors(active);
    if (Object.keys(active).length) {
      setResult(null);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    const cleanEntry = {
      ...entry,
      wrestlers_involved: entry.wrestlers_involved,
      external_links: entry.external_links.length ? entry.external_links : undefined,
    };
    const markdown = buildMarkdown(cleanEntry, fields.body);
    const filename = `${slug}.md`;
    const githubUrl = repo
      ? `https://github.com/${repo}/new/${branch}/src/content/archive?filename=${encodeURIComponent(
          filename
        )}&value=${encodeURIComponent(markdown)}`
      : null;
    setResult({
      markdown,
      filename,
      githubUrl: githubUrl && githubUrl.length <= MAX_GITHUB_URL ? githubUrl : null,
    });
    requestAnimationFrame(() => reviewRef.current?.focus());
  };

  const download = () => {
    const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.markdown);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const clearForm = () => {
    if (!window.confirm('Clear the whole form? Your saved draft will be deleted.')) return;
    setFields(EMPTY);
    setLinks([]);
    setErrors({});
    setResult(null);
    setDraftRestored(false);
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  const errorList = [
    ...FIELD_ORDER.filter((k) => errors[k]).map((k) => ({ id: fieldId(k), message: errors[k] })),
    ...links.flatMap((_, i) =>
      ['name', 'url']
        .filter((k) => errors[`link-${k}-${i}`])
        .map((k) => ({
          id: fieldId(`link-${k}-${i}`),
          message: `Link ${i + 1}: ${errors[`link-${k}-${i}`]}`,
        }))
    ),
    ...(errors.body ? [{ id: fieldId('body'), message: errors.body }] : []),
  ];

  return (
    <div className="space-y-6">
      {draftRestored && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-registry-surface border border-registry-border rounded-lg px-4 py-3 text-sm">
          <p className="text-registry-textMuted">Your saved draft has been restored.</p>
          <button
            type="button"
            onClick={clearForm}
            className="text-registry-gold underline underline-offset-2 hover:text-registry-goldHover focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold rounded"
          >
            Start over
          </button>
        </div>
      )}

      {errorList.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby="contribute-errors-heading"
          className="bg-red-950/40 border border-registry-red rounded-lg p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-red"
        >
          <h2 id="contribute-errors-heading" className="font-bold text-red-300 mb-2">
            {errorList.length === 1
              ? 'One thing needs fixing'
              : `${errorList.length} things need fixing`}
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {errorList.map((err) => (
              <li key={err.id}>
                <a
                  href={`#${err.id}`}
                  className="text-red-200 underline underline-offset-2 hover:text-white"
                >
                  {err.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Section title="1. The moment">
          <Field
            id={fieldId('title')}
            label="Entry title"
            required
            error={errors.title}
            hint="e.g. 'WrestleMania X-Seven: Stone Cold vs. The Rock'. For a composite work (a match trilogy, a tournament, a whole feud), name the full scope, e.g. 'Flair vs. Steamboat: The 1989 Trilogy'."
          >
            <input type="text" className={inputClass} {...bind('title')} />
          </Field>
          <Field
            id={fieldId('event_name')}
            label="Event or show"
            error={errors.event_name}
            hint="The pay-per-view or broadcast, e.g. 'Survivor Series 1997'."
          >
            <input type="text" className={inputClass} {...bind('event_name')} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              id={fieldId('date')}
              label="Event date"
              required
              error={errors.date}
              hint={`If taped, the taping date. For a composite work, the date it began. Must be at least ${MIN_AGE_YEARS} years ago.`}
            >
              <input type="date" className={inputClass} {...bind('date')} />
            </Field>
            <Field
              id={fieldId('air_date')}
              label="Broadcast date"
              error={errors.air_date}
              hint="Only if it aired on a later date."
            >
              <input type="date" className={inputClass} {...bind('air_date')} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              id={fieldId('promotion')}
              label="Promotion or creator"
              required
              error={errors.promotion}
              hint="The promotion, or for works outside wrestling the studio, publisher, network or channel. Match names used by existing entries so they group together."
            >
              <input
                type="text"
                list="contribute-promotions"
                className={inputClass}
                {...bind('promotion')}
              />
            </Field>
            <Field
              id={fieldId('era')}
              label="Decade"
              error={errors.era}
              hint="e.g. '1990s'. Mention named eras, like the Attitude Era, in the article."
            >
              <input type="text" list="contribute-eras" className={inputClass} {...bind('era')} />
            </Field>
          </div>
          <datalist id="contribute-promotions">
            {promotions.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <datalist id="contribute-eras">
            {eras.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
          <Field
            id={fieldId('wrestlers')}
            label="People involved"
            required
            error={errors.wrestlers}
            hint="One name per line. Wrestlers, plus key owners, referees, commentators or creators. For Homage & Influence, the wrestlers referenced and the creators responsible."
          >
            <textarea rows={4} className={inputClass} {...bind('wrestlers')} />
          </Field>
        </Section>

        <Section title="2. Classification">
          <Field
            id={fieldId('registry_section')}
            label="Registry section"
            required
            error={errors.registry_section}
            hint={section ? section.hint : 'Which part of the registry this belongs to.'}
          >
            <select className={inputClass} {...bind('registry_section')}>
              <option value="">Choose a section…</option>
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.value}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id={fieldId('significance')}
            label="Significance"
            required
            error={errors.significance}
            hint={
              SIGNIFICANCE_DETAILS[fields.significance] ||
              (section
                ? 'The options depend on the section you chose.'
                : 'Choose a registry section first.')
            }
          >
            <select className={inputClass} disabled={!section} {...bind('significance')}>
              <option value="">{section ? 'Choose…' : '—'}</option>
              {significanceOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id={fieldId('description')}
            label="One-sentence summary"
            required
            error={errors.description}
            hint={`Say what it is and why it matters. Significance counts, not star ratings. Shown on cards and in the directory. ${fields.description.trim().length}/${MAX_DESCRIPTION} characters.`}
          >
            <textarea rows={2} className={inputClass} {...bind('description')} />
          </Field>
        </Section>

        <Section title="3. Citation">
          <Field
            id={fieldId('source_material')}
            label="Source material"
            required
            error={errors.source_material}
            hint="Broadcasts, databases (Cagematch, ProFightDB), books, documentaries or verified interviews. The work must have aired, streamed or been distributed on a professional, publicly accessible platform."
          >
            <textarea rows={2} className={inputClass} {...bind('source_material')} />
          </Field>
          <Field
            id={fieldId('context_statement')}
            label="Historical context statement"
            required
            error={errors.context_statement}
            hint="One sentence on why this moment matters to wrestling history."
          >
            <textarea rows={2} className={inputClass} {...bind('context_statement')} />
          </Field>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-registry-text">
              External links <span className="font-normal text-registry-textMuted">(optional)</span>
            </p>
            {links.map((link, i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-3 items-start border-l-2 border-registry-border pl-3"
              >
                <Field
                  id={fieldId(`link-name-${i}`)}
                  label={`Link ${i + 1} name`}
                  required
                  error={errors[`link-name-${i}`]}
                >
                  <input
                    type="text"
                    className={inputClass}
                    value={link.name}
                    onChange={(e) => updateLink(i, 'name', e.target.value)}
                  />
                </Field>
                <Field
                  id={fieldId(`link-url-${i}`)}
                  label={`Link ${i + 1} address`}
                  required
                  error={errors[`link-url-${i}`]}
                >
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    className={inputClass}
                    value={link.url}
                    onChange={(e) => updateLink(i, 'url', e.target.value)}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => {
                    setLinks((prev) => prev.filter((_, j) => j !== i));
                    setErrors({});
                    setResult(null);
                  }}
                  className="sm:mt-6 text-sm text-registry-textMuted hover:text-red-400 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold rounded justify-self-start"
                >
                  Remove<span className="sr-only"> link {i + 1}</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLinks((prev) => [...prev, { name: '', url: '' }])}
              className="text-sm font-semibold text-registry-gold hover:text-registry-goldHover focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold rounded"
            >
              + Add a link
            </button>
          </div>

          <Field
            id={fieldId('image_url')}
            label="Image address"
            error={errors.image_url}
            hint="A direct https:// link to an image you have the right to use."
          >
            <input type="url" inputMode="url" className={inputClass} {...bind('image_url')} />
          </Field>
        </Section>

        <Section title="4. The article">
          <Field
            id={fieldId('body')}
            label="Article"
            required
            error={errors.body}
            hint={`Markdown. Use '## ' for section headings such as 'The Context', 'The Incident' and 'Historical Impact'. ${MIN_WORDS}–${MAX_WORDS} words; currently ${bodyWords}.`}
          >
            <textarea rows={16} className={`${inputClass} font-mono`} {...bind('body')} />
          </Field>
        </Section>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            className="bg-registry-gold hover:bg-registry-goldHover text-registry-background font-bold uppercase tracking-wider text-sm px-6 py-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-registry-background focus-visible:ring-registry-gold"
          >
            Check &amp; prepare entry
          </button>
          <p className="text-xs text-registry-textMuted">
            Your draft is saved in this browser as you type.
          </p>
        </div>
      </form>

      {result && (
        <section
          ref={reviewRef}
          tabIndex={-1}
          aria-labelledby="contribute-ready-heading"
          className="bg-registry-surface border border-registry-gold rounded-lg p-4 sm:p-6 space-y-4 focus:outline-none"
        >
          <div>
            <h2 id="contribute-ready-heading" className="font-bold text-lg text-registry-text">
              Your entry is ready
            </h2>
            <p className="text-sm text-registry-textMuted mt-1">
              It passed the same checks the site build uses. Submit it as a pull request so an
              editor can review it.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {result.githubUrl && (
              <a
                href={result.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center bg-registry-gold hover:bg-registry-goldHover text-registry-background font-bold text-sm px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-registry-surface focus-visible:ring-registry-gold"
              >
                Open a pull request on GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            <button
              type="button"
              onClick={download}
              className="bg-registry-background border border-registry-border hover:border-registry-gold text-registry-text font-semibold text-sm px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold"
            >
              Download {result.filename}
            </button>
            <button
              type="button"
              onClick={copy}
              className="bg-registry-background border border-registry-border hover:border-registry-gold text-registry-text font-semibold text-sm px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold"
            >
              {copied ? 'Copied' : 'Copy Markdown'}
            </button>
            <span aria-live="polite" className="sr-only">
              {copied ? 'Markdown copied to clipboard' : ''}
            </span>
          </div>

          <ol className="list-decimal pl-5 space-y-1 text-sm text-registry-textMuted">
            {result.githubUrl ? (
              <>
                <li>
                  “Open a pull request on GitHub” creates <code>{result.filename}</code> in{' '}
                  <code>src/content/archive</code> with your entry filled in. You’ll need a GitHub
                  account; GitHub makes a copy (fork) of the repository for you if needed.
                </li>
                <li>Choose “Commit changes”, then “Create pull request”.</li>
              </>
            ) : (
              <li>
                This entry is too long to open on GitHub directly. Download it, then add it to{' '}
                <code>src/content/archive</code> through a pull request.
              </li>
            )}
            <li>
              An editor will review it against the charter and the Editorial Handbook, and it goes
              live once the pull request is merged.
            </li>
          </ol>

          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-registry-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold rounded">
              Preview the Markdown
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto bg-registry-background border border-registry-border rounded p-3 text-xs text-registry-text whitespace-pre-wrap break-words">
              {result.markdown}
            </pre>
          </details>
        </section>
      )}
    </div>
  );
}
