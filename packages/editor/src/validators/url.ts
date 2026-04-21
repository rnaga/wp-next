import { z } from "zod";

// Zod schema for dataName (alphabet, underscore, and numbers only)
export const dataName = z
  .string()
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Data name must only contain alphabets, numbers, and underscores"
  );

// Transforms numeric strings to numbers, otherwise keeps as string.
// Values are trimmed first; empty/whitespace-only strings are kept as-is —
// `z.coerce.number()` would silently convert "" to 0, which causes type errors
// when downstream schemas expect a string (e.g. `search`).
export const urlParamValue = z.string().transform((val) => {
  const trimmed = val.trim();

  if (trimmed === "") {
    return trimmed;
  }

  const parsed = z.coerce.number().safeParse(trimmed);
  return parsed.success ? parsed.data : trimmed;
});

// URL query cache data structure: { [dataName: string]: { [key: string]: any } }
export const urlQueryCacheData = z.record(
  dataName,
  z.record(z.string(), z.any())
);

export const templateWidgetIdOrSlug = z.union([
  z.number(),
  z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9_.-]*$/,
      "Template widget slug must only contain lowercase letters, numbers, hyphens, underscores, or dots"
    ),
]);
