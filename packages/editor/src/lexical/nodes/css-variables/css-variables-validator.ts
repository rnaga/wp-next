import { z } from "zod";

export const cssVariablesDataFetchingValidator = z.array(
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

/**
 * Validator for CSS variables content which reflects @property in CSS.
 *
 */
export const cssVariablesContentValidator = z.array(
  z
    .object({
      variableName: z.string().min(1),
      syntax: z.enum([
        "angle",
        "color",
        "number",
        "string",
        "font",
        "length",
        "universal",
      ]),
      inherit: z.boolean().optional().default(true),
      initialValue: z.union([z.string(), z.number(), z.array(z.string())]),
      font: z
        .object({
          $type: z.enum(["google", "custom", "raw"]).optional(),
          $slug: z.string().optional(),
          fontFamily: z.string().optional(),
          fontStyle: z.enum(["italic", "normal"]).optional(),
          fontWeight: z.number().optional(),
        })
        .optional(),
    })
    .transform((obj) => ({
      ...obj,
      initialValueString: Array.isArray(obj.initialValue)
        ? obj.initialValue.join(", ")
        : obj.initialValue.toString(),
      initialValueDataType: Array.isArray(obj.initialValue)
        ? "array"
        : typeof obj.initialValue === "number"
          ? "number"
          : typeof obj.initialValue === "string"
            ? "string"
            : "unknown",
    }))
);

// export const cssVariableInitialValueTransformer = (
//   value: z.infer<typeof cssVariablesContentValidator>[number]["initialValue"]
// ) => {
//   if (Array.isArray(value)) {
//     return value.join(", ");
//   }
//   return value.toString();
// };

export const cssVariablesListValidator = z.array(
  z.object({
    ID: z.number(),
    name: z.string().min(1),
    slug: z.string().min(1),
    content: cssVariablesContentValidator,
  })
);
