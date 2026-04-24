import { defineCollection, z } from "astro:content";

const letters = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    title_zh: z.string(),
    date: z.coerce.date(),
    type: z.string(),
    tags: z.array(z.string()),
    summary: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { letters };
