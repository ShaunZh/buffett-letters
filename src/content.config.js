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

const companySchema = z.object({
  name_en: z.string(),
  name_zh: z.string(),
  industry: z.string().optional(),
  founded: z.string().optional(),
  headquarters: z.string().optional(),
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
const companies = defineCollection({
  type: "content",
  schema: companySchema,
});

export const collections = {
  letters,
  "partner-letters": partnerLetters,
  "special-letters": specialLetters,
  companies,
};