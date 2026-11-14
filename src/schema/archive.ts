import { z } from 'zod';

// Shared by the content collection (src/content.config.ts) and the contribute form,
// so an entry that passes the form also passes the site build.

export const SIGNIFICANCE_OPTIONS = [
  'Cultural Significance',
  'Historical Significance',
  'Aesthetic Significance',
  'Conceptual Failure',
  'Technical Failure',
  'Contextual Failure',
  "So Bad It's Good",
  'Cautionary Archive',
  'Homage & Influence',
] as const;

export const REGISTRY_SECTIONS = [
  'Registry of Excellence',
  'Registry of Infamy - Division A',
  'Registry of Infamy - Division B',
  'Registry of Homage & Influence',
] as const;

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

// schema.md requires dates as YYYY-MM-DD.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Use the format YYYY-MM-DD' })
  .refine((val) => !Number.isNaN(new Date(val).getTime()), { message: 'Not a real date' });

export const archiveSchema = z.object({
  title: z.string(),
  date: isoDate,
  promotion: z.string(),
  significance: z.enum(SIGNIFICANCE_OPTIONS),
  registry_section: z.enum(REGISTRY_SECTIONS),
  wrestlers_involved: z.array(z.string()).optional(),
  event_name: z.string().optional(),
  era: z.string().optional(),
  description: z.string().optional(),
  image_url: safeUrlSchema.optional(),
  // Citation fields (see wrestling_handbook.md, section 4)
  source_material: z.string().optional(),
  air_date: isoDate.optional(),
  context_statement: z.string().optional(),
  external_links: z
    .array(
      z.object({
        name: z.string(),
        url: safeUrlSchema,
      })
    )
    .optional(),
});

export type ArchiveEntry = z.infer<typeof archiveSchema>;
