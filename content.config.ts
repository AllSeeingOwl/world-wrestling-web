import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// 🛡️ Sentinel: Prevent XSS via javascript: URIs
export const safeUrlSchema = z.string().refine(
  (val) => {
    if (val.startsWith('/') || val.startsWith('#')) return true;
    try {
      const url = new URL(val);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  },
  { message: 'Must be a safe URL (http/https) or relative path' }
);

export const archiveSchema = z.object({
  title: z.string(),
  date: z.string(),
  promotion: z.string(),
  significance: z.enum([
    'Cultural Significance',
    'Historical Significance',
    'Aesthetic Significance',
    'Conceptual Failure',
    'Technical Failure',
    'Contextual Failure',
    'So Bad It\'s Good',
    'Cautionary Archive',
    'Homage & Influence'
  ]),
  registry_section: z.enum([
    'Registry of Excellence',
    'Registry of Infamy - Division A',
    'Registry of Infamy - Division B',
    'Registry of Homage & Influence'
  ]),
  image_url: safeUrlSchema.optional(),
  external_links: z
    .array(
      z.object({
        name: z.string(),
        url: safeUrlSchema,
      })
    )
    .optional(),
});

const archiveCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/archive' }),
  schema: archiveSchema,
});

export const collections = {
  archive: archiveCollection,
};
