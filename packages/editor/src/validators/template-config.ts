import { z } from "zod";

// Zod schema for URL parameter names (alphanumeric, underscore, hyphen only)
// Transforms input by stripping invalid characters
export const urlParamName = z
  .string()
  .transform((val) => val.replace(/[^a-zA-Z0-9_-]/g, ""))
  .pipe(z.string().min(1, "URL parameter name is required"));

// Zod schema for validating mapping items
export const configItem = z.object({
  nodeType: z.string().trim().min(1),
  name: z.string().trim().min(1),
  queryKey: z.string().trim().min(1),

  // Optional boolean to indicate if this mapping is required (defaults to false if not provided)
  // this is primarily used for production mode validation to ensure critical mappings are present
  // if required is true, and the item is missing or invalid, the page will return 404 instead of rendering with missing data
  required: z.boolean().optional(),
});

/**
 * Validates a nested pathMapping array structure.
 * Each segment (outer array element) contains an array of configItems
 * that all receive the same URL path segment value.
 *
 * configItems may include an optional `required` boolean. When `required:true`,
 * the path segment must be present in the URL on public pages; missing it returns 404.
 * Cascade rule: segment N can only be marked required if segment N-1 has at least
 * one required item (enforced in the UI; not validated here).
 * The required flag is ignored on admin/preview pages.
 *
 * @param segments - Array of arrays, where each inner array contains configItems for one path segment
 * @returns Filtered array with only valid segments (segments with at least one valid configItem)
 */
export const pathMapping = <T extends z.infer<typeof configItem>>(
  segments: T[][]
): T[][] => {
  return segments
    .map((segment) => {
      // Filter valid configItems within each segment
      return segment.filter((item) => configItem.safeParse(item).success);
    })
    .filter((segment) => segment.length > 0); // Remove empty segments
};

/**
 * Validates a queryMapping structure where each query parameter maps to an array of configItems.
 * This enables 1:many relationships where a single query parameter can route to multiple nodes.
 *
 * configItems may include an optional `required` boolean. When `required:true`,
 * the query key must be present in the URL on public pages; missing it returns 404.
 * The required flag is ignored on admin/preview pages.
 *
 * @param queryMapping - Record mapping query parameter names to arrays of configItems
 * @returns Filtered record with only valid entries (entries with at least one valid configItem)
 */
export const queryMapping = <T extends z.infer<typeof configItem>>(
  queryMapping: Record<string, T[]>
): Record<string, T[]> => {
  return Object.fromEntries(
    Object.entries(queryMapping)
      .map(([key, items]) => {
        // Filter valid configItems within each array
        const validItems = items.filter(
          (item) => configItem.safeParse(item).success
        );
        return [key, validItems] as [string, T[]];
      })
      .filter(([key, items]) => key.trim() !== "" && items.length > 0)
  );
};
