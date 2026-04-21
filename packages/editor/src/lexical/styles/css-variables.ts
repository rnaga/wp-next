import type * as types from "../../types";
import { cssVariablesContentValidator } from "../nodes/css-variables/css-variables-validator";
import { formatting } from "@rnaga/wp-node/common/formatting";
import { logger } from "../logger";

export const CSS_PROPERTY_NAME_PREFIX = "--wpn-";

export const cssKeyToCamelCase = (key: string): string =>
  key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

export const cssKeyToKebabCase = (key: string): string =>
  key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();

export const cssPropertyName = (slug: string, variableName: string): string =>
  `${CSS_PROPERTY_NAME_PREFIX}${slug}-${formatting.slug(variableName)}`;
export const cssCustomProperty = (slug: string, variableName: string): string =>
  `var(${cssPropertyName(slug, variableName)})`;

export const deleteVariableFromCSSVariablesContent = (
  index: number,
  content: types.CSSVariablesContent
): types.CSSVariablesContent => {
  if (index < 0 || index >= content.length || !content[index]) {
    throw new Error(
      `Index ${index} is out of bounds for CSS variable content.`
    );
  }

  content.splice(index, 1);

  // Validate the content
  const parsedContent = cssVariablesContentValidator.safeParse(content);
  if (!parsedContent.success) {
    logger.error( "Invalid CSS variable content", parsedContent.error);
    throw new Error(
      `Invalid CSS variable content ${parsedContent.error.message}`
    );
  }

  return content;
};

export const appendVariableToCSSVariablesContent = (
  item: types.CSSVariablesContentItem,
  content: types.CSSVariablesContent //z.infer<typeof cssVariablesContentValidator>
): types.CSSVariablesContent => {
  // z.infer<typeof cssVariablesContentValidator> => {
  return updateCSSVariablesContent(-1, item, content);
};

export const updateInitialValueInCSSVariablesContent = (
  variableName: string,
  initialValue: string | number | Array<string>,
  content: types.CSSVariablesContent
): types.CSSVariablesContent => {
  const index = content.findIndex((item) => item.variableName === variableName);
  if (index < 0) {
    throw new Error(
      `Variable ${variableName} not found in CSS variable content.`
    );
  }
  const item = content[index];
  item.initialValue = initialValue;
  content[index] = item;

  // Validate the content
  const parsedContent = cssVariablesContentValidator.safeParse(content);
  if (!parsedContent.success) {
    logger.error( "Invalid CSS variable content", parsedContent.error);
    throw new Error(
      `Invalid CSS variable content ${parsedContent.error.message}`
    );
  }
  return content;
};

// if index is -1, push the item
export const updateCSSVariablesContent = (
  index: number,
  item: types.CSSVariablesContentItem,
  content: types.CSSVariablesContent
): types.CSSVariablesContent => {
  // Validate the item
  const parsed = cssVariablesContentValidator.safeParse([item]);
  if (!parsed.success) {
    logger.error( "Invalid CSS variable content", parsed.error);
    throw new Error(`Invalid CSS variable content ${parsed.error.message}`);
  }

  // Save content before updating
  const newContent = structuredClone(content);

  if (newContent[index]) {
    newContent[index] = item;
  } else {
    newContent.push(item);
  }

  // Validate the content
  const parsedContent = cssVariablesContentValidator.safeParse(newContent);
  if (!parsedContent.success) {
    logger.error( "Invalid CSS variable content", parsedContent.error);
    throw new Error(
      `Invalid CSS variable content ${parsedContent.error.message}`
    );
  }

  // Check for duplicates (exclude the current index)
  const [isUnique, duplicates] = checkCSSVariableNameUniqueness(newContent, [
    index,
  ]);

  if (!isUnique) {
    logger.error(
      "CSS variable content is not unique",
      duplicates,
      newContent
    );
    throw new Error(
      `CSS variable content is not unique. Duplicates: ${duplicates.join(", ")}`
    );
  }

  return newContent;
};

// Check variableName uniqueness
export const checkCSSVariableNameUniqueness = (
  content: types.CSSVariablesContent, // z.infer<typeof cssVariablesContentValidator>
  excludeIndex?: number[]
): [boolean, string[]] => {
  const filteredContent = content.filter(
    (item, index) => !excludeIndex || !excludeIndex.includes(index)
  );

  if (!filteredContent || filteredContent.length === 0) {
    return [true, []];
  }

  // Group by name (using Node.js 20+ builtin 'groupBy')
  const groupedByName = Object.groupBy(
    filteredContent,
    (item) => item.variableName
  );

  let duplicates: string[] = [];

  // Check uniqueness by name
  for (const [name, items] of Object.entries(groupedByName)) {
    if (items && items.length > 1) {
      duplicates.push(name);
    }
  }

  return [duplicates.length === 0, duplicates];
};

export const cssVariablesToString = (
  cssVariables: types.CSSVariables
): string => {
  const content = cssVariables.content;
  const slug = cssVariables.slug;

  return content
    .map((variables) => {
      // if type is not color, number, string, wrap with <>
      // if type is universal, convert it to *
      // if type is font, conver it to <string>
      // Note that above are based on the CSS spec
      // https://developer.mozilla.org/en-US/docs/Web/CSS/@property#syntax
      const syntax =
        variables.syntax === "universal"
          ? `"*"`
          : variables.syntax === "font"
            ? `"<string>"`
            : `"<${variables.syntax}>"`;

      const { inherit = true } = variables;
      const { initialValueString } = variables;
      let initialValue: string = variables.initialValueString;

      if (
        (syntax === `"<string>"` || syntax === `"*"`) &&
        typeof initialValueString === "string" &&
        /[']/g.test(initialValueString)
      ) {
        // Replace ' with "
        initialValue = initialValueString.replace(/'/g, '"');
      } else if (
        syntax === `"<string>"` &&
        typeof initialValueString === "string" &&
        !/["]/g.test(initialValueString)
      ) {
        // Wrap with " if no quotes present
        initialValue = `"${initialValueString}"`;
      } else if (variables.syntax === "font") {
        initialValue = `"${initialValueString}"`;
      }

      return `@property ${cssPropertyName(slug, variables.variableName)} {
          syntax: ${syntax};
          inherits: ${inherit};
          initial-value: ${initialValue};
        }`;
    })
    .join("\n");
};
