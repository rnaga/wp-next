import { z } from "zod";

export const usersDataFetchingValidator = z.array(
  z.object({
    index: z.number(),
    ID: z.number().int().nonnegative(),
    user_nicename: z.string().max(50).trim().default(""),
    user_email: z.email().max(100).trim().default(""),
    user_url: z.union([
      z.string().max(100).trim().default(""),
      z.string().max(0).optional(),
    ]),
    display_name: z.string().max(250).trim().default(""),
  })
);
