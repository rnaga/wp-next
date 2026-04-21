export type ParsedTemplateExpression = {
  fullMatch: string;
  varPath: string;
  pipeName?: string;
  pipeParams?: Record<string, any>;
};

/**
 * Extracts all ${...} template expressions from a template string using a state machine.
 *
 * Syntax:
 *   ${varPath}                             — plain variable
 *   ${varPath|pipeName}                    — pipe with no params
 *   ${varPath|pipeName:{key:value}}        — pipe with params object
 *
 * Examples:
 *   "Hello ${item.name}"
 *   "Excerpt: ${item.post_content|truncate}"
 *   "Excerpt: ${item.post_content|truncate:{length:10}}"
 *   "Label: ${item.post_content|custom:{params:{nested:1}}}"
 *   "Label: ${item.post_content|custom:{bracketValue: "}"}}"
 *     ↑ JSON string values containing "}" are safe — the state machine tracks
 *       depth and skips over string literals before counting closing braces.
 *
 * Returns one ParsedTemplateExpression per expression found in the template.
 */
export const extractTemplateExpressions = (
  template: string
): ParsedTemplateExpression[] => {
  const results: ParsedTemplateExpression[] = [];
  let i = 0;

  while (i < template.length) {
    if (
      template[i] === "$" &&
      i + 1 < template.length &&
      template[i + 1] === "{"
    ) {
      const start = i;
      let depth = 1;
      i += 2; // skip "${"
      let inString = false;
      let stringChar = "";

      while (i < template.length && depth > 0) {
        const c = template[i];
        if (inString) {
          if (c === "\\") {
            i++; // skip next char (escaped)
          } else if (c === stringChar) {
            inString = false;
          }
        } else {
          if (c === '"' || c === "'") {
            inString = true;
            stringChar = c;
          } else if (c === "{") {
            depth++;
          } else if (c === "}") {
            depth--;
          }
        }
        i++;
      }

      if (depth === 0) {
        const fullMatch = template.slice(start, i);
        const content = template.slice(start + 2, i - 1); // inside ${ ... }
        const parsed = parseTemplateExpression(content);
        results.push({ fullMatch, ...parsed });
      }
    } else {
      i++;
    }
  }

  return results;
};

/**
 * Parses the inner content of a ${...} expression (the part between ${ and }).
 *
 * Given the content string, splits it on "|" to separate the variable path from
 * the optional pipe section, then splits the pipe section on ":" to separate the
 * pipe name from its params.
 *
 * Examples (content = everything inside ${ }):
 *   "item.post_content"                          → { varPath: "item.post_content" }
 *   "item.post_content|truncate"                 → { varPath: "item.post_content", pipeName: "truncate" }
 *   "item.post_content|truncate:{length:10}"     → { varPath: "item.post_content", pipeName: "truncate", pipeParams: { length: 10 } }
 *   "item.post_content|custom:{params:{nested:1}}" → { varPath: "item.post_content", pipeName: "custom", pipeParams: { params: { nested: 1 } } }
 */
export const parseTemplateExpression = (
  content: string
): {
  varPath: string;
  pipeName?: string;
  pipeParams?: Record<string, any>;
} => {
  const pipeIndex = content.indexOf("|");

  if (pipeIndex === -1) {
    return { varPath: content.trim() };
  }

  const varPath = content.slice(0, pipeIndex).trim();
  const pipeStr = content.slice(pipeIndex + 1).trim();

  const colonIndex = pipeStr.indexOf(":");
  if (colonIndex === -1) {
    return { varPath, pipeName: pipeStr.trim() };
  }

  const pipeName = pipeStr.slice(0, colonIndex).trim();
  const paramsStr = pipeStr.slice(colonIndex + 1).trim();

  const pipeParams = parsePipeParams(paramsStr);
  return { varPath, pipeName, pipeParams: pipeParams ?? undefined };
};

/**
 * Parses the params portion of a pipe expression into a plain object.
 *
 * The params string is everything after the first ":" in the pipe section.
 * It must start with "{". Keys may be unquoted (JSON5-like); values follow
 * standard JSON rules, including quoted strings that may contain "}" characters.
 *
 * Examples:
 *   "{length:10}"                          → { length: 10 }
 *   "{params:{nested:1}}"                  → { params: { nested: 1 } }
 *   '{"bracketValue": "}"}'                → { bracketValue: "}" }
 *   "{bracketValue: "}"}"                  → { bracketValue: "}" }
 *
 * Tries standard JSON.parse first; if that fails, falls back to quoteUnquotedKeys()
 * to handle unquoted keys before retrying. Returns undefined if both attempts fail.
 */
export const parsePipeParams = (
  str: string
): Record<string, any> | undefined => {
  const trimmed = str.trim();
  if (!trimmed.startsWith("{")) {
    return undefined;
  }

  // Try standard JSON first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall back to lenient parsing (quote unquoted keys)
    try {
      return JSON.parse(quoteUnquotedKeys(trimmed));
    } catch {
      return undefined;
    }
  }
};

/**
 * Converts a JSON-like object string with unquoted keys into valid JSON so it
 * can be parsed with JSON.parse.
 *
 * Uses a state machine to track whether the current position is inside a string
 * literal (single- or double-quoted), which prevents keys inside string values
 * from being incorrectly wrapped in quotes.
 *
 * Examples:
 *   "{length:10}"               → '{"length":10}'
 *   "{params:{nested:1}}"       → '{"params":{"nested":1}}'
 *   "{bracketValue: "}"}"       → '{"bracketValue":"}"}'
 *   "{'key': 'val'}"            → '{"key":"val"}'   (single quotes → double quotes)
 */
const quoteUnquotedKeys = (str: string): string => {
  let result = "";
  let i = 0;

  while (i < str.length) {
    const c = str[i];

    // Handle string literals (single or double quoted)
    if (c === '"' || c === "'") {
      const quote = c;
      result += '"'; // always open with double quote for valid JSON
      i++;

      while (i < str.length) {
        const sc = str[i];
        if (sc === "\\") {
          result += str[i];
          i++;
          if (i < str.length) {
            result += str[i];
            i++;
          }
        } else if (sc === quote) {
          result += '"'; // always close with double quote
          i++;
          break;
        } else if (sc === '"' && quote === "'") {
          result += '\\"'; // escape double quotes inside single-quoted strings
          i++;
        } else {
          result += sc;
          i++;
        }
      }
      continue;
    }

    // Check if this could be an unquoted key (identifier followed by ":")
    if (/[a-zA-Z_$%]/.test(c)) {
      let j = i;
      while (j < str.length && /[a-zA-Z0-9_$%]/.test(str[j])) {
        j++;
      }
      const word = str.slice(i, j);

      // Look ahead past whitespace to check for ":"
      let k = j;
      while (k < str.length && str[k] === " ") k++;

      if (str[k] === ":") {
        // This is an unquoted key — wrap in double quotes
        result += '"' + word + '"';
      } else {
        // This is a value (true, false, null, etc.) — keep as-is
        result += word;
      }
      i = j;
      continue;
    }

    result += c;
    i++;
  }

  return result;
};
