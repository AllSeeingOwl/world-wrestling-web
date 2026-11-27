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

// One work inside a composite entry (a match in a trilogy, a round of a tournament).
const componentSchema = z.object({
  title: z.string().min(1, { message: 'Give this part a title' }),
  date: isoDate,
  event_name: z.string().optional(),
});

export const archiveSchema = z
  .object({
    title: z.string(),
    date: isoDate,
    promotion: z.string(),
    significance: z.enum(SIGNIFICANCE_OPTIONS),
    registry_section: z.enum(REGISTRY_SECTIONS),
    wrestlers_involved: z.array(z.string()).optional(),
    event_name: z.string().optional(),
    // The decade, e.g. '1990s'. Named eras (the Attitude Era, the joshi boom) differ by promotion
    // and country, so they belong in the article; see wrestling_handbook.md, section 3.
    era: z
      .string()
      .regex(/^\d{3}0s$/, { message: "Use a decade, like '1990s'" })
      .optional(),
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
    // Composite works (charter section IV, eligibility rule 6): the works the entry covers.
    components: z.array(componentSchema).optional(),
    // The component an editor proposes for a Citation for Individual Merit. The charter says
    // the Preservation Board issues the citation, so the site presents this as a proposal.
    proposed_individual_merit: z.string().optional(),
  })
  .superRefine((entry, ctx) => {
    const { components, proposed_individual_merit: merit } = entry;
    if (components) {
      if (components.length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['components'],
          message: 'A composite work needs at least two parts',
        });
      }
      const earliest = components.map((c) => c.date).sort()[0];
      if (earliest && entry.date !== earliest) {
        ctx.addIssue({
          code: 'custom',
          path: ['date'],
          message: `For a composite work, use the date of its first part (${earliest})`,
        });
      }
    }
    if (merit && !components?.some((c) => c.title === merit)) {
      ctx.addIssue({
        code: 'custom',
        path: ['proposed_individual_merit'],
        message: 'The proposed Citation for Individual Merit must name one of the parts',
      });
    }
  });

export type ArchiveComponent = z.infer<typeof componentSchema>;
export type ArchiveEntry = z.infer<typeof archiveSchema>;
