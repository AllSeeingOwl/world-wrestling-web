// Regenerates data/registry-entries.csv from the Markdown entries in src/content/archive.
// The CSV is an export (for spreadsheets, backups and analysis); the Markdown files remain
// the source of truth.
//
//   pnpm run sync:csv            write the CSV if anything changed
//   pnpm run sync:csv --check    exit 1 if the CSV is out of date, without writing
//
// Adapted from Fic-His-Arch's sync-csv-from-markdown.js. Unlike that script, it reuses the
// site's own schema and fails on invalid entries instead of silently leaving them out.

import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { stringify } from 'csv-stringify/sync';
import { archiveSchema, type ArchiveEntry } from '../src/schema/archive';

const ROOT = process.cwd();
const ARCHIVE_DIR = path.join(ROOT, 'src/content/archive');
const CSV_PATH = path.join(ROOT, 'data/registry-entries.csv');
const SITE_URL = 'https://allseeingowl.github.io/world-wrestling-web';

type Row = ArchiveEntry & { slug: string };

// Column order follows schema.md, with the slug and page address first.
const COLUMNS: [header: string, value: (entry: Row) => string | undefined][] = [
  ['slug', (e) => e.slug],
  ['page_url', (e) => `${SITE_URL}/${e.slug}/`],
  ['title', (e) => e.title],
  ['date', (e) => e.date],
  ['air_date', (e) => e.air_date],
  ['promotion', (e) => e.promotion],
  ['event_name', (e) => e.event_name],
  ['era', (e) => e.era],
  ['registry_section', (e) => e.registry_section],
  ['significance', (e) => e.significance],
  // Lists are joined so each entry stays on one readable spreadsheet row.
  ['wrestlers_involved', (e) => e.wrestlers_involved?.join('; ')],
  ['description', (e) => e.description],
  ['source_material', (e) => e.source_material],
  ['context_statement', (e) => e.context_statement],
  ['image_url', (e) => e.image_url],
  ['external_links', (e) => e.external_links?.map((l) => `${l.name} (${l.url})`).join('; ')],
];

function readEntries(): { rows: Row[]; errors: string[] } {
  const files = fs
    .readdirSync(ARCHIVE_DIR)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .sort();
  const rows: Row[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(ARCHIVE_DIR, file), 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
    if (!match) {
      errors.push(`${file}: no front matter found`);
      continue;
    }
    let data: unknown;
    try {
      data = parseYaml(match[1]);
    } catch (err) {
      errors.push(`${file}: front matter is not valid YAML (${(err as Error).message})`);
      continue;
    }
    const result = archiveSchema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${file}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
      }
      continue;
    }
    rows.push({ ...result.data, slug: file.replace(/\.mdx?$/, '') });
  }

  // Chronological, so a new entry adds one row in a predictable place.
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug));
  return { rows, errors };
}

export function buildCsv(rows: Row[]): string {
  return stringify([
    COLUMNS.map(([header]) => header),
    ...rows.map((row) => COLUMNS.map(([, value]) => value(row) ?? '')),
  ]);
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const { rows, errors } = readEntries();

  if (errors.length) {
    console.error('Some entries are invalid, so the CSV was not updated:');
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  const csv = buildCsv(rows);
  const current = fs.existsSync(CSV_PATH) ? fs.readFileSync(CSV_PATH, 'utf8') : null;
  const relative = path.relative(ROOT, CSV_PATH);

  if (current === csv) {
    console.log(`${relative} is up to date (${rows.length} entries).`);
    return;
  }
  if (checkOnly) {
    console.error(`${relative} is out of date. Run: pnpm run sync:csv`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
  fs.writeFileSync(CSV_PATH, csv);
  console.log(`Updated ${relative} (${rows.length} entries).`);
}

main();
