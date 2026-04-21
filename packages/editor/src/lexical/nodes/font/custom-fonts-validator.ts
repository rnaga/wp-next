import { z } from "zod";
export const customFontsDataFetchingValidator = z.array(
  z.object({
    ID: z.number().optional(),
    post_title: z.string().optional(),
    post_content: z.string().optional(),
    guid: z.string().optional(),
    post_author: z.number().optional(),
    author: z
      .object({
        ID: z.number(),
        user_nicename: z.string(),
        display_name: z.string(),
      })
      .optional(),
    post_date: z.string().optional(),
    post_modified: z.string().optional(),
    post_name: z.string().optional(),
    post_type: z.string().optional(),
    post_status: z.string().optional(),
  })
);
