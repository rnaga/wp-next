/**
 * Validates CSS property keys and values
 * Only allows valid CSS property names (lowercase letters and hyphens)
 * Rejects pseudo-classes, pseudo-elements, and other invalid property names
 */

/**
 * Checks if a CSS property key is valid
 * Valid keys can only contain lowercase letters, hyphens, and numbers
 * Must start with a letter or hyphen (for CSS custom properties like --var)
 * Rejects pseudo-classes (&:hover), pseudo-elements (::before), etc.
 *
 * @param key - The CSS property key to validate
 * @returns true if the key is valid, false otherwise
 *
 * @example
 * isValidCSSPropertyKey("padding-left") // true
 * isValidCSSPropertyKey("--custom-property") // true
 * isValidCSSPropertyKey("&:hover") // false
 * isValidCSSPropertyKey("::before") // false
 * isValidCSSPropertyKey("PADDING") // false (uppercase not allowed)
 */
export const isValidCSSPropertyKey = (key: string): boolean => {
  if (!key || typeof key !== "string") {
    return false;
  }

  // Pattern: must start with letter or hyphen, followed by lowercase letters, hyphens, or numbers
  // This allows regular properties (padding, margin) and custom properties (--my-var)
  // But rejects pseudo-classes (&:hover), pseudo-elements (::before), uppercase, etc.
  const validPropertyPattern = /^[a-z-][a-z0-9-]*$/;

  return validPropertyPattern.test(key.trim());
};

/**
 * Validates CSS content and checks if all property keys are valid
 * Parses the CSS content and validates each property key
 *
 * @param cssContent - CSS content string to validate
 * @param options - Optional configuration
 * @param options.removeWrapper - If true, removes CSS class wrapper before validation
 * @returns Object with validation result and invalid keys found
 *
 * @example
 * validateCSSContent("padding: 10px; margin: 20px")
 * // Returns: { isValid: true, invalidKeys: [] }
 *
 * @example
 * validateCSSContent("&:hover: red; padding: 10px")
 * // Returns: { isValid: false, invalidKeys: ["&:hover"] }
 */
export const validateCSSContent = (
  cssContent: string,
  options?: { removeWrapper?: boolean }
): { isValid: boolean; invalidKeys: string[] } => {
  const { removeWrapper = false } = options || {};
  const invalidKeys: string[] = [];

  let content = cssContent.trim();

  // Remove CSS class wrapper if requested
  if (removeWrapper) {
    const lines = content.split("\n");

    // Remove first line (CSS selector with opening brace)
    if (lines.length > 0 && lines[0].trim().match(/^\.[a-zA-Z0-9_-]+\s*\{/)) {
      lines.shift();
    }

    // Remove last line (closing brace)
    if (lines.length > 0 && lines[lines.length - 1].trim() === "}") {
      lines.pop();
    }

    content = lines.join("\n").trim();
  }

  // If content is empty, consider it valid
  if (!content) {
    return { isValid: true, invalidKeys: [] };
  }

  // Split by both newlines and semicolons
  const lines = content.split(/\n|;/).filter((line) => line.trim());

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Find the first colon (property: value separator)
    const colonIndex = trimmedLine.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmedLine.slice(0, colonIndex).trim();

    // Validate the key
    if (!isValidCSSPropertyKey(key)) {
      invalidKeys.push(key);
    }
  }

  return {
    isValid: invalidKeys.length === 0,
    invalidKeys,
  };
};

/**
 * Validates changes between two CSS content strings
 * Compares the previous and current CSS content to identify invalid modifications
 * Checks both first/last line modifications and invalid property keys
 *
 * @param previousContent - Previous valid CSS content
 * @param currentContent - Current CSS content to validate
 * @param options - Optional configuration
 * @param options.removeWrapper - If true, removes CSS class wrapper before validation
 * @returns Object indicating if changes are valid, reasons for invalidity, and invalid keys
 *
 * @example
 * validateCSSChanges(".class {\n  padding: 10px\n}", ".class {\n  padding: 20px\n}")
 * // Returns: { isValid: true, invalidKeys: [], firstLineChanged: false, lastLineChanged: false }
 *
 * @example
 * validateCSSChanges(".class {\n  padding: 10px\n}", ".other {\n  padding: 10px\n}")
 * // Returns: { isValid: false, invalidKeys: [], firstLineChanged: true, lastLineChanged: false }
 *
 * @example
 * validateCSSChanges(".class {\n  padding: 10px\n}", ".class {\n  &:hover: red\n}")
 * // Returns: { isValid: false, invalidKeys: ["&:hover"], firstLineChanged: false, lastLineChanged: false }
 */
export const validateCSSChanges = (
  previousContent: string,
  currentContent: string,
  options?: { removeWrapper?: boolean }
): {
  isValid: boolean;
  invalidKeys: string[];
  firstLineChanged: boolean;
  lastLineChanged: boolean;
} => {
  const currentLines = currentContent.split("\n");
  const previousLines = previousContent.split("\n");

  // Check if content is empty
  if (currentLines.length === 0 || previousLines.length === 0) {
    return {
      isValid: currentLines.length > 0,
      invalidKeys: [],
      firstLineChanged: false,
      lastLineChanged: false,
    };
  }

  // Get first and last lines
  const firstLine = currentLines[0].trim();
  const lastLine = currentLines[currentLines.length - 1].trim();
  const originalFirstLine = previousLines[0].trim();
  const originalLastLine = previousLines[previousLines.length - 1].trim();

  // Check if first or last line was modified
  const firstLineChanged = firstLine !== originalFirstLine;
  const lastLineChanged = lastLine !== originalLastLine;

  // Validate CSS property keys
  const validation = validateCSSContent(currentContent, options);

  // Changes are invalid if:
  // 1. First line was changed (CSS selector/wrapper)
  // 2. Last line was changed (closing brace)
  // 3. Invalid property keys were found
  const isValid =
    !firstLineChanged && !lastLineChanged && validation.isValid;

  return {
    isValid,
    invalidKeys: validation.invalidKeys,
    firstLineChanged,
    lastLineChanged,
  };
};
