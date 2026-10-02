import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(160), // one line for the card
      context: z.enum(['prácticas', 'académico', 'tfg']),
      year: z.string(), // "2026", "2025 - 2026"
      role: z.string(),
      stack: z.array(z.string()),
      cover: image().optional(),
      coverAlt: z.string().optional(), // descriptive alt for the cover on the detail page
      gallery: z
        .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
        .optional(),
      model: z.string().optional(), // path to a .glb in /public/models
      links: z.object({ demo: z.url().optional(), repo: z.url().optional() }).optional(),
      confidential: z.boolean().default(false), // true = no screenshots or client names
      featured: z.boolean().default(true),
      order: z.number(),
    }),
});

export const collections = { projects };
