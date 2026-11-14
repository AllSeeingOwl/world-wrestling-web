// Turns contribute-form data into a registry entry Markdown file.
// Kept free of React so it can be tested and reused (e.g. by a future CSV sync).

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Quoted YAML scalar, written exactly as Prettier would format it, so submitted
// entries pass the CI formatting check: single quotes by default, double quotes
// when the value contains an apostrophe but no double quote or backslash (the
// characters that would need escaping inside double quotes). Whitespace, including
// pasted newlines, is collapsed because every front-matter field is one line.
function yamlString(value) {
  const clean = String(value).replace(/\s+/g, ' ').trim();
  if (clean.includes("'") && !clean.includes('"') && !clean.includes('\\')) {
    return `"${clean}"`;
  }
  return `'${clean.replace(/'/g, "''")}'`;
}

// Field order matches the existing entries and schema.md.
const SCALAR_FIELDS = [
  'title',
  'date',
  'air_date',
  'promotion',
  'significance',
  'registry_section',
  'event_name',
  'era',
  'description',
  'image_url',
  'source_material',
  'context_statement',
];

export function buildFrontmatter(entry) {
  const lines = ['---'];
  for (const field of SCALAR_FIELDS) {
    const value = entry[field];
    if (value === undefined || value === '') continue;
    lines.push(`${field}: ${yamlString(value)}`);
    // Keep the wrestler list next to the other "who/what" fields, after registry_section.
    if (field === 'registry_section' && entry.wrestlers_involved?.length) {
      lines.push('wrestlers_involved:');
      for (const name of entry.wrestlers_involved) lines.push(`  - ${yamlString(name)}`);
    }
  }
  if (entry.external_links?.length) {
    lines.push('external_links:');
    for (const link of entry.external_links) {
      lines.push(`  - name: ${yamlString(link.name)}`);
      lines.push(`    url: ${yamlString(link.url)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

export function buildMarkdown(entry, body) {
  const text = String(body || '')
    .replace(/\r\n/g, '\n')
    .trim();
  return `${buildFrontmatter(entry)}\n\n${text}\n`;
}

export function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
