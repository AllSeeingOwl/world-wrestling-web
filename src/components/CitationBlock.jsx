import React from 'react';

// Adapted from Fic-His-Arch's CitationBlock. Renders the four citation elements
// required by wrestling_handbook.md section 4: source material, event/air date,
// promotion and event name, and a historical context statement.

function formatDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function Field({ label, children, missing }) {
  return (
    <div>
      <dt className="font-sans text-[10px] uppercase tracking-wider text-registry-accent mb-1">
        {label}
      </dt>
      <dd className={missing ? 'italic text-registry-textMuted' : 'text-registry-text'}>
        {children}
      </dd>
    </div>
  );
}

export default function CitationBlock({ citation }) {
  if (!citation) return null;

  const {
    source_material,
    date,
    air_date,
    promotion,
    event_name,
    context_statement,
    external_links = [],
  } = citation;

  const eventDate = formatDate(date);
  const airDate = formatDate(air_date);
  const showAirDate = airDate && airDate !== eventDate;

  return (
    <footer className="mt-12 pt-6 border-t-2 border-dashed border-registry-border">
      <section
        aria-labelledby="citation-heading"
        className="bg-registry-background p-6 rounded border border-registry-border"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-registry-accent" aria-hidden="true" />
          <h2
            id="citation-heading"
            className="font-sans text-xs uppercase tracking-widest font-semibold text-registry-accent"
          >
            Registry Citation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-sm">
          <dl className="space-y-3">
            <Field label="Promotion / Creator & Event">
              {promotion}
              {event_name ? ` — ${event_name}` : ''}
            </Field>
            <Field label={showAirDate ? 'Event / Taping Date' : 'Event Date'}>
              {eventDate ? <time dateTime={date}>{eventDate}</time> : 'Date not recorded'}
            </Field>
            {showAirDate && (
              <Field label="Broadcast Date">
                <time dateTime={air_date}>{airDate}</time>
              </Field>
            )}
            <Field label="Source Material" missing={!source_material}>
              {source_material || 'Source not yet recorded'}
            </Field>
          </dl>

          <div className="md:border-l md:border-registry-border md:pl-6 flex flex-col gap-4">
            <dl>
              <Field label="Historical Context" missing={!context_statement}>
                <span className="font-sans leading-relaxed">
                  {context_statement || 'No context statement provided.'}
                </span>
              </Field>
            </dl>
            {external_links.length > 0 && (
              <div className="mt-auto">
                <h3 className="font-sans text-[10px] uppercase tracking-wider text-registry-accent mb-1">
                  External References
                </h3>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {external_links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-registry-text hover:text-registry-accent transition-colors underline decoration-registry-border underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-accent rounded"
                      >
                        {link.name}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </footer>
  );
}
