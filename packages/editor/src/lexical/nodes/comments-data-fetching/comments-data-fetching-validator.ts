import { z } from "zod";

export type CommentData = {
  index: number;
  comment_ID?: number;
  comment_post_ID?: number;
  comment_author?: string;
  comment_author_url?: string;
  comment_date?: Date;
  comment_date_gmt?: Date;
  comment_content?: string;
  comment_approved?: string;
  comment_parent?: number;
  user_id?: number;
  author?: {
    ID: number;
    user_nicename: string;
    display_name: string;
  };
  post?: {
    ID: number;
    post_title: string;
    post_name: string;
  };
  children?: CommentData[];
};

const commentSchema: z.ZodType<CommentData> = z.object({
  index: z.number(),
  comment_ID: z.number().optional(),
  comment_post_ID: z.number().optional(),
  comment_author: z.string().optional(),
  comment_author_url: z.string().optional(),
  comment_date: z.coerce.date().optional(),
  comment_date_gmt: z.coerce.date().optional(),
  comment_content: z.string().optional(),
  comment_approved: z.string().optional(),
  comment_parent: z.number().optional(),
  user_id: z.number().optional(),
  author: z
    .object({
      ID: z.number(),
      user_nicename: z.string(),
      display_name: z.string(),
    })
    .optional(),
  post: z
    .object({
      ID: z.number(),
      post_title: z.string(),
      post_name: z.string(),
    })
    .optional(),
  children: z.lazy(() => z.array(commentSchema)).optional(),
});

export const commentsDataFetchingValidator = z.array(commentSchema);
