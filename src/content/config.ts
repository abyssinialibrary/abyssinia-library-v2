// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const summariesCollection = defineCollection({
  type: 'content', // can be 'content' or 'data'
  schema: z.object({
    title: z.string(),
    author: z.string(),
    category: z.string(),
    description: z.string(),
    pubDate: z.date(),
    // We add the new downloadUrl field here.
    // It's a string, it must be a valid URL, and it's optional.
    downloadUrl: z.string().url().optional(),
  }),
});

export const collections = {
  'summaries': summariesCollection,
};