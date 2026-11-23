import React, { useMemo, useState, useEffect } from 'react';

// Adapted from Fic-His-Arch's DirectoryView: a sortable master list plus a
// chronological timeline, with grouping and filters tuned for the wrestling
// registry (decade, era, promotion, registry section).

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const GROUP_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'decade', label: 'Decade' },
  { value: 'era', label: 'Era' },
  { value: 'promotion', label: 'Promotion / creator' },
  { value: 'registry_section', label: 'Registry Section' },
];

const COLUMNS = [
  { field: 'title', label: 'Entry' },
  { field: 'date', label: 'Date' },
  // On phones the promotion moves under the entry title, so the table fits without scrolling.
  { field: 'promotion', label: 'Promotion / creator', className: 'hidden sm:table-cell' },
  { field: 'era', label: 'Era', className: 'hidden md:table-cell' },
  { field: 'registry_section', label: 'Section', className: 'hidden lg:table-cell' },
];

function getDecade(date) {
  const match = /^(\d{4})/.exec(date || '');
  return match ? `${match[1].slice(0, 3)}0s` : 'Undated';
}

function formatDate(date) {
  const parsed = new Date(date);
  if (!date || Number.isNaN(parsed.getTime())) return date || 'Undated';
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// Excellence entries get the championship gold; Infamy entries get the red.
function sectionTone(section) {
  if (section?.startsWith('Registry of Infamy')) return 'infamy';
  if (section === 'Registry of Excellence') return 'excellence';
  return 'other';
}

const toneDot = {
  excellence: 'bg-registry-gold border-registry-gold',
  infamy: 'bg-registry-red border-registry-red',
  other: 'bg-registry-background border-registry-textMuted',
};

const toneText = {
  excellence: 'text-registry-gold',
  infamy: 'text-red-400',
  other: 'text-registry-textMuted',
};

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort(collator.compare);
}

function SelectControl({ id, label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label
        htmlFor={id}
        className="font-sans text-[10px] font-semibold uppercase tracking-wider text-registry-textMuted"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-registry-background border border-registry-border rounded px-3 py-2 text-sm text-registry-text focus:outline-none focus:border-registry-gold focus-visible:ring-2 focus-visible:ring-registry-gold"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function DirectoryView({ entries = [] }) {
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState('table');
  const [query, setQuery] = useState('');
  const [promotion, setPromotion] = useState('all');
  const [era, setEra] = useState('all');
  const [section, setSection] = useState('all');
  const [groupBy, setGroupBy] = useState('none');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [collapsed, setCollapsed] = useState(() => new Set());

  useEffect(() => setMounted(true), []);

  const filterOptions = useMemo(
    () => ({
      promotions: uniqueSorted(entries.map((e) => e.promotion)),
      eras: uniqueSorted(entries.map((e) => e.era)),
      sections: uniqueSorted(entries.map((e) => e.registry_section)),
    }),
    [entries]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (promotion !== 'all' && entry.promotion !== promotion) return false;
      if (era !== 'all' && entry.era !== era) return false;
      if (section !== 'all' && entry.registry_section !== section) return false;
      if (!needle) return true;
      return [entry.title, entry.event_name, entry.description, ...(entry.wrestlers_involved || [])]
        .filter(Boolean)
        .some((text) => text.toLowerCase().includes(needle));
    });
  }, [entries, query, promotion, era, section]);

  // The timeline is always chronological; the table follows the chosen sort.
  const sorted = useMemo(() => {
    const field = activeView === 'timeline' ? 'date' : sortField;
    const direction = activeView === 'timeline' ? 'asc' : sortDirection;
    return [...filtered].sort((a, b) => {
      const result = collator.compare(a[field] || '', b[field] || '');
      return direction === 'asc' ? result : -result;
    });
  }, [filtered, sortField, sortDirection, activeView]);

  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ name: 'All entries', items: sorted }];
    const map = new Map();
    for (const entry of sorted) {
      const key = groupBy === 'decade' ? getDecade(entry.date) : entry[groupBy] || 'Unclassified';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    }
    const list = [...map.entries()].map(([name, items]) => ({ name, items }));
    // Decades always run oldest first ("1990s" < "2000s"), with undated entries last;
    // other groupings are alphabetical. Entries inside each group keep the chosen sort.
    list.sort((a, b) => {
      if (groupBy === 'decade') {
        if (a.name === 'Undated') return 1;
        if (b.name === 'Undated') return -1;
      }
      return collator.compare(a.name, b.name);
    });
    return list;
  }, [sorted, groupBy]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleGroup = (name) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const changeGrouping = (value) => {
    setGroupBy(value);
    setCollapsed(new Set());
  };

  const clearFilters = () => {
    setQuery('');
    setPromotion('all');
    setEra('all');
    setSection('all');
  };

  const filtersActive = query || promotion !== 'all' || era !== 'all' || section !== 'all';
  const groupId = (name) => `group-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  if (entries.length === 0) {
    return <p className="text-registry-textMuted">No registry entries found.</p>;
  }

  const viewButton = (view, label, position) => (
    <button
      type="button"
      onClick={() => setActiveView(view)}
      aria-pressed={activeView === view}
      className={`flex-1 sm:flex-none px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wider border border-registry-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold focus-visible:ring-inset ${position} ${
        activeView === view
          ? 'bg-registry-gold border-registry-gold text-registry-background'
          : 'bg-registry-background text-registry-textMuted hover:text-registry-text'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full">
      {/* Controls need JavaScript, so they stay hidden until the component hydrates. */}
      {mounted && (
        <section
          aria-label="Filter and arrange registry entries"
          className="bg-registry-surface border border-registry-border rounded-lg p-4 mb-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label
                htmlFor="directory-search"
                className="font-sans text-[10px] font-semibold uppercase tracking-wider text-registry-textMuted"
              >
                Search
              </label>
              <input
                id="directory-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Entry, event or person"
                className="bg-registry-background border border-registry-border rounded px-3 py-2 text-sm text-registry-text placeholder:text-registry-textMuted focus:outline-none focus:border-registry-gold focus-visible:ring-2 focus-visible:ring-registry-gold"
              />
            </div>
            <div className="flex" role="group" aria-label="View">
              {viewButton('table', 'Master List', 'rounded-l')}
              {viewButton('timeline', 'Timeline', 'rounded-r -ml-px')}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SelectControl
              id="directory-promotion"
              label="Promotion / creator"
              value={promotion}
              onChange={setPromotion}
              options={[
                { value: 'all', label: 'All promotions & creators' },
                ...filterOptions.promotions.map((v) => ({ value: v, label: v })),
              ]}
            />
            <SelectControl
              id="directory-era"
              label="Era"
              value={era}
              onChange={setEra}
              options={[
                { value: 'all', label: 'All eras' },
                ...filterOptions.eras.map((v) => ({ value: v, label: v })),
              ]}
            />
            <SelectControl
              id="directory-section"
              label="Registry Section"
              value={section}
              onChange={setSection}
              options={[
                { value: 'all', label: 'All sections' },
                ...filterOptions.sections.map((v) => ({ value: v, label: v })),
              ]}
            />
            <SelectControl
              id="directory-group"
              label="Group By"
              value={groupBy}
              onChange={changeGrouping}
              options={GROUP_OPTIONS}
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-registry-textMuted">
            <p aria-live="polite">
              Showing {filtered.length} of {entries.length}{' '}
              {entries.length === 1 ? 'entry' : 'entries'}
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-registry-gold hover:text-registry-goldHover underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold rounded"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>
      )}

      {filtered.length === 0 ? (
        <div className="bg-registry-surface border border-registry-border rounded-lg p-8 text-center">
          <p className="text-registry-text mb-2">No entries match these filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-registry-gold hover:text-registry-goldHover underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold rounded"
          >
            Clear filters
          </button>
        </div>
      ) : activeView === 'table' ? (
        <div className="overflow-x-auto border border-registry-border rounded-lg bg-registry-surface">
          <table className="w-full text-left text-sm text-registry-text">
            <thead className="bg-registry-background border-b border-registry-border font-sans text-[10px] uppercase tracking-wider text-registry-textMuted">
              <tr>
                {COLUMNS.map((column) => {
                  const active = sortField === column.field;
                  return (
                    <th
                      key={column.field}
                      scope="col"
                      className={`font-semibold ${column.className || ''}`}
                      aria-sort={
                        active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(column.field)}
                        className={`w-full text-left px-4 py-3 uppercase tracking-wider hover:text-registry-text focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold focus-visible:ring-inset ${active ? 'text-registry-gold' : ''}`}
                      >
                        {column.label}
                        <span aria-hidden="true">
                          {active ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            {groups.map(({ name, items }) => {
              const isOpen = !collapsed.has(name);
              return (
                <tbody key={name} className="divide-y divide-registry-border">
                  {groupBy !== 'none' && (
                    <tr className="bg-registry-surfaceHover">
                      <th scope="rowgroup" colSpan={COLUMNS.length} className="p-0 font-normal">
                        <button
                          type="button"
                          onClick={() => toggleGroup(name)}
                          aria-expanded={isOpen}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left text-xs uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold focus-visible:ring-inset"
                        >
                          <span
                            aria-hidden="true"
                            className={`text-registry-gold transition-transform ${isOpen ? 'rotate-90' : ''}`}
                          >
                            ▶
                          </span>
                          <span className="font-bold text-registry-text">{name}</span>
                          <span className="text-registry-textMuted">
                            ({items.length} {items.length === 1 ? 'entry' : 'entries'})
                          </span>
                        </button>
                      </th>
                    </tr>
                  )}
                  {isOpen &&
                    items.map((entry) => (
                      <tr
                        key={entry.slug}
                        className="hover:bg-registry-background transition-colors"
                      >
                        <td className="px-4 py-3 sm:min-w-[12rem]">
                          <a
                            href={entry.url}
                            className="font-medium text-registry-gold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold rounded"
                          >
                            {entry.title}
                          </a>
                          {entry.event_name && (
                            <span className="block text-xs text-registry-textMuted mt-0.5">
                              {entry.event_name}
                            </span>
                          )}
                          <span className="block text-xs text-registry-text mt-0.5 sm:hidden">
                            {entry.promotion}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-registry-textMuted">
                          <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">{entry.promotion}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-registry-textMuted">
                          {entry.era || '—'}
                        </td>
                        <td
                          className={`px-4 py-3 hidden lg:table-cell text-xs ${toneText[sectionTone(entry.registry_section)]}`}
                        >
                          {entry.registry_section}
                        </td>
                      </tr>
                    ))}
                </tbody>
              );
            })}
          </table>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ name, items }) => {
            const isOpen = !collapsed.has(name);
            const listId = groupId(name);
            return (
              <section key={name} aria-label={groupBy === 'none' ? 'Timeline' : name}>
                {groupBy !== 'none' && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(name)}
                    aria-expanded={isOpen}
                    aria-controls={listId}
                    className="mb-4 flex items-center gap-3 bg-registry-surfaceHover rounded px-4 py-2 text-left text-sm uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold"
                  >
                    <span
                      aria-hidden="true"
                      className={`text-registry-gold transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    >
                      ▶
                    </span>
                    <span className="font-bold text-registry-text">{name}</span>
                    <span className="text-xs text-registry-textMuted bg-registry-background px-2 py-0.5 rounded">
                      {items.length} {items.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </button>
                )}
                {isOpen && (
                  <ol
                    id={listId}
                    className="relative border-l-2 border-registry-border ml-2 sm:ml-3"
                  >
                    {items.map((entry) => {
                      const tone = sectionTone(entry.registry_section);
                      return (
                        <li key={entry.slug} className="relative pl-6 sm:pl-8 pb-6 last:pb-0">
                          <span
                            aria-hidden="true"
                            className={`absolute -left-[9px] top-5 w-4 h-4 rounded-full border-2 ${toneDot[tone]}`}
                          />
                          <article className="bg-registry-surface border border-registry-border rounded-lg p-4 sm:p-5 hover:border-registry-gold transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 mb-2">
                              <h2 className="font-bold text-lg leading-snug">
                                <a
                                  href={entry.url}
                                  className="text-registry-text hover:text-registry-gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-registry-gold rounded"
                                >
                                  {entry.title}
                                </a>
                              </h2>
                              <time
                                dateTime={entry.date}
                                className="shrink-0 font-mono text-xs text-registry-gold"
                              >
                                {formatDate(entry.date)}
                              </time>
                            </div>
                            <p className="font-mono text-[11px] uppercase tracking-wider text-registry-textMuted mb-3">
                              {[entry.promotion, entry.event_name, entry.era]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                            {entry.description && (
                              <p className="text-sm text-registry-textMuted leading-relaxed mb-3">
                                {entry.description}
                              </p>
                            )}
                            <p className={`text-xs font-semibold ${toneText[tone]}`}>
                              {entry.registry_section}
                            </p>
                          </article>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
