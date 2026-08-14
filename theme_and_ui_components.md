# Visual Style Guide: Wrestling Heritage Registry

This document outlines the visual style guide and UI component architecture for the Wrestling Heritage Registry, adapting a historical archive aesthetic for professional wrestling.

## 1. Color Palette (Tailwind Configuration)

The color palette is designed to evoke a sense of professional history while capturing the grandeur and intensity of professional wrestling.

- **Primary Background:** A deep, dark slate/navy to represent a sophisticated, archival feel.
- **Surface Background:** Slightly lighter than the primary background for cards and panels.
- **Accents:** Championship Gold (for significant achievements, titles, and highlights) and Intensity Red (for alerts, active states, or intense moments).
- **Text:** High-contrast off-white for body text to ensure readability against dark backgrounds, with softer grays for secondary text.

### Example Tailwind Configuration (`tailwind.config.js` extension)

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        registry: {
          background: '#0F172A', // Slate 900 - Deep dark slate
          surface: '#1E293B', // Slate 800 - Slightly lighter for cards
          surfaceHover: '#334155', // Slate 700 - Hover states
          text: '#F8FAFC', // Slate 50 - Primary text
          textMuted: '#94A3B8', // Slate 400 - Secondary text/metadata
          gold: '#F59E0B', // Amber 500 - Championship Gold
          goldHover: '#D97706', // Amber 600 - Gold hover
          red: '#DC2626', // Red 600 - Intensity Red
          border: '#334155', // Slate 700 - Subtle borders
        },
      },
    },
  },
};
```

## 2. Typography

The typography pairs a distinguished serif for headings (conveying history and authority) with a highly legible, clean sans-serif for body text and metadata, ensuring maximum accessibility.

- **Headings (Font Family):** `Merriweather` or `Playfair Display`. (Accessible, high-contrast serif).
- **Body Text (Font Family):** `Inter` or `Roboto`. (Clean sans-serif with excellent legibility across devices).
- **Monospace/Metadata (Font Family):** `JetBrains Mono` or standard `ui-monospace`.

### Example Tailwind Configuration

```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        heading: ['Merriweather', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

## 3. Component Descriptions & Examples

Below are descriptions and React + Tailwind CSS examples for the core components of the registry.

### RegistryCard

Displays individual wrestling moments. Includes the title, date, promotion, and significance level.

```tsx
import React from 'react';

const RegistryCard = ({ title, date, promotion, significance, summary }) => {
  return (
    <article className="bg-registry-surface border border-registry-border rounded-lg p-6 hover:border-registry-gold transition-colors focus-within:ring-2 focus-within:ring-registry-gold focus-within:ring-offset-2 focus-within:ring-offset-registry-background">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-heading text-xl font-bold text-registry-text mb-2">
          <a href="#" className="focus:outline-none before:absolute before:inset-0 relative">
            {title}
          </a>
        </h3>
        <span className="bg-registry-gold text-registry-background text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
          {promotion}
        </span>
      </div>
      <p className="text-sm font-mono text-registry-textMuted mb-3">
        <time dateTime={date}>{new Date(date).toLocaleDateString()}</time> &bull; Significance:{' '}
        {significance}/10
      </p>
      <p className="font-sans text-registry-text line-clamp-3">{summary}</p>
    </article>
  );
};
```

### RegistryFilters

Allows users to narrow down the archive by promotion, era, wrestler, or significance level.

```tsx
import React from 'react';

const RegistryFilters = () => {
  return (
    <section
      aria-label="Filter registry entries"
      className="bg-registry-surface p-4 rounded-lg border border-registry-border flex flex-wrap gap-4 items-center"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="promotion-filter"
          className="text-xs font-semibold text-registry-textMuted uppercase"
        >
          Promotion
        </label>
        <select
          id="promotion-filter"
          className="bg-registry-background border border-registry-border text-registry-text text-sm rounded focus:ring-registry-gold focus:border-registry-gold block w-full p-2"
        >
          <option value="">All Promotions</option>
          <option value="wwf">WWF/WWE</option>
          <option value="wcw">WCW</option>
          <option value="njpw">NJPW</option>
          <option value="aew">AEW</option>
        </select>
      </div>

      {/* Additional filters for Era, Wrestler, etc. would follow the same pattern */}

      <button className="mt-5 bg-registry-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-registry-background focus:ring-registry-red">
        Apply Filters
      </button>
    </section>
  );
};
```

### CitationBlock

Footer element for entries displaying source and date information to maintain the "historical archive" aesthetic.

```tsx
import React from 'react';

const CitationBlock = ({ source, retrievedDate, author }) => {
  return (
    <footer className="mt-8 pt-4 border-t border-registry-border text-xs text-registry-textMuted font-mono bg-registry-surface/50 p-4 rounded">
      <p className="mb-1">
        <strong>Source:</strong> {source}
      </p>
      <p className="mb-1">
        <strong>Archivist:</strong> {author}
      </p>
      <p>
        <strong>Retrieved:</strong> {new Date(retrievedDate).toLocaleDateString()}
      </p>
    </footer>
  );
};
```

### TimelineView

A visual representation of wrestling history by era.

```tsx
import React from 'react';

const TimelineEvent = ({ year, title, isMajor }) => {
  return (
    <div className="relative pl-8 sm:pl-32 py-6 group">
      {/* Timeline Line */}
      <div className="font-sans text-registry-textMuted text-sm font-bold sm:absolute left-0 top-6 sm:w-24 sm:text-right mb-2 sm:mb-0">
        {year}
      </div>
      {/* Timeline Node */}
      <div
        className={`absolute left-0 sm:left-28 top-7 w-3 h-3 rounded-full border-2 ${isMajor ? 'bg-registry-gold border-registry-gold' : 'bg-registry-background border-registry-textMuted'} group-hover:border-registry-gold group-hover:bg-registry-gold transition-colors`}
      ></div>
      <div className="bg-registry-surface p-4 rounded-lg border border-registry-border group-hover:border-registry-gold transition-colors">
        <h4 className="font-heading font-bold text-lg text-registry-text">{title}</h4>
      </div>
    </div>
  );
};

const TimelineView = ({ events }) => {
  return (
    <div className="relative border-l border-registry-border ml-3 sm:ml-[7.5rem]">
      {events.map((event, index) => (
        <TimelineEvent key={index} {...event} />
      ))}
    </div>
  );
};
```

## 4. Interactive Features

The user interface will support several interactive features to help users explore the archive:

- **Filter by Promotion:** Users can filter entries to view history specific to WWF/WWE, WCW, NJPW, AEW, ECW, or regional territories.
- **Filter by Era:** Filter by recognized historical eras (e.g., The Golden Era (1980s), The New Generation (early 90s), The Attitude Era (late 90s), Ruthless Aggression, PG Era, Modern Era).
- **Search Functionality:** A robust text search targeting entry titles, wrestler names, and event summaries.
- **Timeline Navigation:** An interactive timeline allowing users to jump to specific decades or major paradigm-shifting events in wrestling history.

## 5. Accessibility

To ensure the registry is available to all users, the following accessibility standards are integrated into the design:

- **ARIA Labels:** All interactive elements, especially custom filters and complex components (like the timeline), use appropriate `aria-label`, `aria-expanded`, and `aria-controls` attributes.
- **Keyboard Navigation:** All features are fully operable via keyboard. Forms and links utilize intuitive tab ordering. The `RegistryCard` example uses a pseudo-element link trick to make the whole card clickable while maintaining a single, logical focus target for screen readers.
- **Focus Indicators:** Custom, high-visibility focus rings are defined using Tailwind's `focus:ring` utilities (e.g., `focus:ring-registry-gold`), ensuring users navigating via keyboard can easily track their position.
- **High Contrast Mode Compatibility:** The color palette (off-white text on dark slate backgrounds) inherently provides a high contrast ratio (well above WCAG AA standards). Border colors are distinct enough to ensure component boundaries are visible even in OS-level high contrast modes.
