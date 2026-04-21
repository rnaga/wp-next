import { z } from "zod";

export const settingsDataFetchingValidator = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  home: z.string().optional(),
  email: z.string().optional(),
  timezone: z.string().optional(),
  date_format: z.string().optional(),
  time_format: z.string().optional(),
  start_of_week: z.coerce.number().optional(),
  use_smilies: z.coerce.number().optional(),
  default_category: z.coerce.number().optional(),
  default_post_format: z.coerce.number().optional(),
  posts_per_page: z.coerce.number().optional(),
  show_on_front: z.string().optional(),
  page_on_front: z.number().optional(),
  page_for_posts: z.coerce.number().optional(),
  default_ping_status: z.enum(["open", "closed"]).optional(),
  default_comment_status: z.enum(["open", "closed"]).optional(),
  site_icon: z.coerce.number().optional(),
  time_offset_minutes: z.number().optional(),
});
