import { CSSProperties } from "react";

import { isEditorMode } from "../editor-mode";
import { logger } from "../logger";
import { animationsValueToStringCSSAndJS } from "../styles/animation";
import { cssKeyToKebabCase } from "../styles/css-variables";
import { decodeCustomProperties } from "../styles/custom-properties";
import { cloneStyle } from "./clone-style";
import { CSS_CUSTOM_PROPERTIES_KEY } from "./constants";
import { cssVariableUsagesToStringObject } from "./css-variable-usages-to-string-object";
import { deleteStyle } from "./delete-style";
import { resolveCSSVariableUsage } from "./resolve-css-variable-usage";
import { styleToStringObject } from "./style-to-string-object";

import type * as types from "../../types";

export const styleToString = <T = true | false>(
  style: types.CSSKeyValue,
  requiredOptions: {
    className: string;
  },
  options?: {
    returnAsObject?: T;
    excludeCSSKeys?: Array<keyof types.CSSKeyValue>;
  }
): T extends true ? types.StyleStringObject : string => {
  const { className } = requiredOptions;
  let { excludeCSSKeys = [] } = options || {};

  let clonedStyle = cloneStyle(style);

  // if excludeCSSKeys is provided, remove those keys from style
  if (excludeCSSKeys.length > 0) {
    deleteStyle(clonedStyle, excludeCSSKeys);
  }

  // First, resolve CSS variable usage.
  // (i.e. check diff between style and usage, and remove keys from style or usage accordingly)
  clonedStyle = resolveCSSVariableUsage(clonedStyle);

  // Then, convert to string object
  let stringObject = styleToStringObject(clonedStyle);

  // And passing stringObject and objectValues to cssVariableUsagesToStringObject
  if (clonedStyle.__cssVariablesUsage) {
    const result = cssVariableUsagesToStringObject(
      clonedStyle.__cssVariablesUsage,
      stringObject
    );

    stringObject = result;
  }

  // For special keys like __animation, __customProperties

  // Handle custom properties
  if (clonedStyle[CSS_CUSTOM_PROPERTIES_KEY]) {
    const rawValue = clonedStyle[CSS_CUSTOM_PROPERTIES_KEY];
    const jsonString =
      typeof rawValue === "object" && rawValue.$value
        ? rawValue.$value
        : rawValue;

    try {
      const customProperties =
        typeof jsonString === "object"
          ? jsonString
          : decodeCustomProperties(jsonString);

      // Overwrite existing properties with custom properties
      stringObject = {
        ...stringObject,
        ...customProperties,
      };
    } catch {
      logger.log(`Failed to parse custom properties JSON: ${jsonString}`);
      // ignore invalid custom properties
    }
  }

  let styleString = "";
  for (const [key, value] of Object.entries(stringObject)) {
    const kebabCaseKey = cssKeyToKebabCase(key);
    if (Array.isArray(value)) {
      if (value.length === 0) {
        // // if kebabCaseKey is "background", then skip adding "background: " to "none"
        // if (kebabCaseKey === "background") {
        //   continue;
        // }

        // Empty array means no value, so set to 'none'
        styleString += `${kebabCaseKey}: none; `;
      } else {
        styleString += `${kebabCaseKey}: ${value.join(", ")}; `;
      }
      continue;
    }

    if (typeof value === "object") {
      const objectEntries = Object.entries(value)
        // Exclude non-function entries
        .filter(
          ([subkey]) => !subkey.startsWith("__") && !subkey.startsWith("$")
        )
        .map(([subKey, subValue]) => `${subKey}(${subValue})`);
      styleString += `${kebabCaseKey}: ${objectEntries.join(" ")}; `;

      continue;
    }

    styleString += `${kebabCaseKey}: ${value}; `;
  }

  // animation
  // Don't include animation CSS in editor mode
  if (clonedStyle.__animation && isEditorMode() === false) {
    const { css } = animationsValueToStringCSSAndJS(
      className,
      clonedStyle.__animation as types.CSSAnimation[]
    );

    styleString += css.join(" ");
    stringObject["__animation"] = css;
  }

  if (options?.returnAsObject) {
    return stringObject as T extends true ? types.StyleStringObject : never;
  }

  return styleString.trim() as T extends true ? never : string;
};
