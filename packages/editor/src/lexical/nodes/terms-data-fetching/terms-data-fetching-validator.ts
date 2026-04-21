import { z } from "zod";

const termSchema = z.object({
  index: z.number(),
  term_id: z.number(),
  count: z.number(),
  description: z.string(),
  name: z.string(),
  slug: z.string(),
  parent: z.number(),
  taxonomy: z.string(),
});

export const termsDataFetchingValidator = z.array(termSchema);
