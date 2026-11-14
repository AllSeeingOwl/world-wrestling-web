import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { archiveSchema, safeUrlSchema } from './schema/archive';

export { archiveSchema, safeUrlSchema };

const archiveCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/archive' }),
  schema: archiveSchema,
});

export const collections = {
  archive: archiveCollection,
};
