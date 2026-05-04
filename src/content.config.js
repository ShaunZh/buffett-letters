import { defineCollection, z } from "astro:content";

const letterSchema = z.object({
  title: z.string(),
  title_zh: z.string(),
  date: z.coerce.date(),
  type: z.string(),
  tags: z.array(z.string()),
  summary: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  pdfPath: z.string().optional(),
  draft: z.boolean().default(false),
});

function defineLetterCollection() {
  return defineCollection({
    type: "content",
    schema: letterSchema,
  });
}

const letters = defineLetterCollection();
const partnerLetters = defineLetterCollection();
const specialLetters = defineLetterCollection();

export const collections = {
  letters,
  "partner-letters": partnerLetters,
  "special-letters": specialLetters,
};
