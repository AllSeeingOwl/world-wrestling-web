import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const isVercel = process.env.VERCEL === '1';
const base = isVercel ? undefined : '/world-wrestling-web';

export default defineConfig({
  site: isVercel
    ? process.env.VERCEL_URL
      ? `https://undefined`
      : 'https://vercel.app'
    : 'https://allseeingowl.github.io',
  base,
  // The charter used to be published as a registry entry; it now lives on the About page.
  // Astro doesn't add the base path to redirect destinations, so add it here.
  redirects: {
    '/the-international-professional-wrestling-heritage-registry': `${base ?? ''}/about`,
  },
  integrations: [react()],
  vite: {
    plugins: [tsconfigPaths(), tailwindcss()],
    ssr: {
      external: ['@tailwindcss/vite'],
    },
  },
});
