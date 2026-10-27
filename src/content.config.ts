import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(300),
    date: z.coerce.date(),
    tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase, hyphen-separated tags.')).default([]).transform((tags) => [...new Set(tags)]),
    draft: z.boolean().default(false),
    starter: z.boolean().default(false),
  }),
});

export const collections = { posts };
