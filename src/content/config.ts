import { defineCollection, z } from "astro:content";

const guides = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /* urlSlug instead of slug — slug is reserved by Astro for filename-derived routing */
    urlSlug: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("Ivan Stamenov"),
    reviewer: z.string().optional(),
    pillar: z.string().optional(),
    targetKeyword: z.string().optional(),
    secondaryKeywords: z.array(z.string()).optional(),
    schema: z.array(z.string()).optional(),
    tier: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { guides };
