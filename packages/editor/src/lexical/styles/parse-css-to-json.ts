/**
 * Parses CSS properties string to a JSON object
 * Handles both semicolon-separated and newline-separated properties
 * Can optionally remove CSS class wrapper (first and last lines)
 *
 * @param cssContent - CSS properties string (e.g., "padding-left: 100px; margin: 10px" or ".class {\n  padding-left: 100px\n}")
 * @param options - Optional configuration
 * @param options.removeWrapper - If true, removes first line (CSS selector) and last line (closing brace). Default: false
 * @returns Object with CSS properties as key-value pairs
 *
 * @example
 * parseCSSToJSON("padding-left: 100px; margin: 10px;")
 * // Returns: { "padding-left": "100px", "margin": "10px" }
 *
 * @example
 * parseCSSToJSON("padding-left: 100px\nmargin: 10px")
 * // Returns: { "padding-left": "100px", "margin": "10px" }
 *
 * @example
 * parseCSSToJSON(".className {\n  padding-left: 100px;\n}", { removeWrapper: true })
 * // Returns: { "padding-left": "100px" }
 *
 * @example
 * parseCSSToJSON(".className:hover {\n  padding-left: 100px;\n}", { removeWrapper: true })
 * // Returns: { "padding-left": "100px" }
 */
export const parseCSSToJSON = (
  cssContent: string,
  options?: { removeWrapper?: boolean }
): Record<string, string> => {
  const parsed: Record<string, string> = {};
  const { removeWrapper = false } = options || {};

  let content = cssContent.trim();

  // Remove CSS class wrapper if requested
  if (removeWrapper) {
    const lines = content.split("\n");

    // Remove first line (CSS selector with opening brace)
    // Handles selectors with optional pseudo-classes like .className:hover, .className:active, etc.
    if (
      lines.length > 0 &&
      lines[0].trim().match(/^\.[a-zA-Z0-9_-]+(:[a-zA-Z0-9_-]+)?\s*\{/)
    ) {
      lines.shift(); // Remove first line
    }

    // Remove last line (closing brace)
    if (lines.length > 0 && lines[lines.length - 1].trim() === "}") {
      lines.pop(); // Remove last line
    }

    // Rejoin the content
    content = lines.join("\n").trim();
  }

  // If content is empty after removing wrapper, return empty object
  if (!content) {
    return parsed;
  }

  // Split by both newlines and semicolons
  // First, we'll split by newlines and then process each line
  const lines = content.split(/\n|;/).filter((line) => line.trim());

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Find the first colon (property: value separator)
    const colonIndex = trimmedLine.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmedLine.slice(0, colonIndex).trim();
    const value = trimmedLine.slice(colonIndex + 1).trim();

    // Remove trailing semicolon from value if present
    const cleanValue = value.endsWith(";") ? value.slice(0, -1).trim() : value;

    if (key && cleanValue) {
      parsed[key] = cleanValue;
    }
  }

  return parsed;
};
