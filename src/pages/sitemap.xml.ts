// sitemap.xml: every page of the site, for search engines. Generated at build time from the
// registry entries, so new entries are included automatically.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { resolvePath } from '../utils/paths.js';

const STATIC_PAGES = ['/', '/directory/', '/about/', '/handbook/', '/contribute/'];

export const GET: APIRoute = async ({ site }) => {
  const entries = await getCollection('archive');
  const origin = site ?? new URL('https://allseeingowl.github.io');
  const urls = [
    ...STATIC_PAGES.map((path) => resolvePath(path)),
    ...entries
      .map((entry) => entry.id)
      .sort()
      .map((id) => resolvePath(`/${id}/`)),
  ].map((path) => `  <url><loc>${new URL(path, origin).href}</loc></url>`);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
