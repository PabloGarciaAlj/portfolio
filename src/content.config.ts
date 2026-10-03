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
      // 3D viewer on the detail page: .glb in /public/models, a poster shown until
      // the visitor loads it (and to anyone without JS or WebGL), and its alt text.
      model: z
        .object({
          src: z.string(),
          poster: image(),
          alt: z.string(),
          // Clip that plays by default instead of the bind (T) pose.
          idle: z.string().optional(),
          // Clips the visitor can play, by their name in the .glb. `loop: false`
          // plays once and returns to the idle (attacks).
          animations: z
            .array(z.object({ clip: z.string(), label: z.string(), loop: z.boolean().default(true) }))
            .default([]),
        })
        .optional(),
      // Prop shown behind the project's card on the landing and moved by the
      // scroll: .glb in /public/models, plus a static render for when it cannot
      // run (no JS or WebGL, reduced motion) and while it loads. Decorative.
      backdrop: z.object({ src: z.string(), poster: image() }).optional(),
      links: z.object({ demo: z.url().optional(), repo: z.url().optional() }).optional(),
      confidential: z.boolean().default(false), // true = no screenshots or client names
      featured: z.boolean().default(true),
      order: z.number(),
    }),
});

export const collections = { projects };
