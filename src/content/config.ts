import { defineCollection, z } from 'astro:content';
const summariesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(), author: z.string(), category: z.string(), description: z.string(), pubDate: z.date(),
  }),
});
export const collections = { 'summaries': summariesCollection };