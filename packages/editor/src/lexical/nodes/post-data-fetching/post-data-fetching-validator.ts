import { z } from "zod";
export const postDataFetchingValidator = z.object({
  ID: z.number().optional(),
  post_title: z.string().optional(),
  post_content: z.string().optional(),
  comment_count: z.number().optional(),
  comment_status: z.string().optional(),
  guid: z.string().optional(),
  post_author: z.number().optional(),
  author: z
    .object({
      ID: z.number(),
      user_nicename: z.string(),
      display_name: z.string(),
    })
    .optional(),
  post_excerpt: z.string().optional(),
  post_date: z.coerce.date().optional(),
  post_modified: z.coerce.date().optional(),
  post_name: z.string().optional(),
  post_password: z.string().optional(),
  post_type: z.string().optional(),
  post_status: z.string().optional(),
  categories: z
    .array(
      z
        .object({
          term_id: z.number(),
          name: z.string(),
          slug: z.string(),
        })
        .optional()
    )
    .optional(),
  tags: z
    .array(
      z
        .object({
          term_id: z.number(),
          name: z.string(),
          slug: z.string(),
        })
        .optional()
    )
    .optional(),
});
