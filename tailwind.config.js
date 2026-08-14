export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,md,mdx,astro}'],
  theme: {
    extend: {
      colors: {
        archive: {
          bg: '#121413', // Deep obsidian desk matte
          surface: '#1c1f1d', // Microfilm reader backing layer
          border: '#333b36', // Weathered static cabinet dividers
          paper: '#f4f1ea', // Restored vintage document text
          accent: '#cfa353', // Aged gold institutional seal
          muted: '#8a948e', // Low-contrast metadata descriptors
          terminal: '#4af626', // Rare active system elements
        },
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
      fontFamily: {
        serif: ['"Courier Prime"', 'Courier', 'monospace'], // Typewriter/Microfilm text
        sans: ['"Inter"', 'sans-serif'], // Clean interface labels
        display: ['"Playfair Display"', 'serif'], // Formal journalistic headings
      },
    },
  },
};
