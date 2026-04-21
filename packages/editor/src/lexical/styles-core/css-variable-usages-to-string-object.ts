import * as types from "../../types";
import { cssVariableUsageKeyType } from "../nodes/css-variables/CSSVariablesNode";
import { cssCustomProperty } from "../styles/css-variables";

const usageToString = (value: types.CSSVariablesUsageValue) => {
  const { slug, variableName, inherit } = value satisfies {
    slug: string;
    variableName: string;
  };

  return cssCustomProperty(slug, variableName);
};

const setStringObjectArray = (
  key: string,
  value: types.CSSVariablesUsageValue[],
  stringObject: types.StyleStringObject
) => {
  const propertyValues = value.map((item) => usageToString(item));

  // Note: for background, propertyValues should be prepended to existing values
  // Otherwise, later backgrounds will override earlier ones
  if (key === "background") {
    const existingValue = stringObject[key] as string[] | undefined;

    // If existing value is an array with a hex color at the end, insert propertyValues before it
    if (Array.isArray(existingValue)) {
      const lastValue = existingValue[existingValue.length - 1];
      const hexColorPattern = /^#[0-9a-fA-F]{3,8}$/;

      if (typeof lastValue === "string" && hexColorPattern.test(lastValue)) {
        const beforeColor = existingValue.slice(0, -1);
        stringObject[key] = [...beforeColor, ...propertyValues, lastValue];
        return;
      }
    }

    // Default background handling: prepend propertyValues to existing array
    stringObject[key] = [...propertyValues, ...(existingValue || [])];
    return;
  }

  // For other array-type properties (textShadow, boxShadow, etc.), append to existing array
  const existingValue = stringObject[key] as string[] | undefined;
  stringObject[key] = [...(existingValue || []), ...propertyValues];
};

const setStringObject = (
  key: string,
  value: types.CSSVariablesUsageValue,
  stringObject: types.StyleStringObject,
  override: boolean = false
) => {
  const propertyValue = usageToString(value);

  if (stringObject[key] && !override) {
    // If the key already exists, append the new value with a comma
    stringObject[key] = `${stringObject[key]}, ${propertyValue}`;
  } else {
    stringObject[key] = propertyValue;
  }
};

const setObjectValue = (
  key: string,
  subKey: string,
  value: types.CSSVariablesUsageValue,
  stringObject: types.StyleStringObject
) => {
  if (!stringObject[key]) {
    stringObject[key] = {};
  }

  const objectValue = {
    [subKey]: usageToString(value),
  };

  stringObject[key] = {
    ...(stringObject[key] as types.StyleObjectValue),
    ...objectValue,
  };
};

export const cssVariableUsagesToStringObject = (
  cssVariableUsages: types.CSSVariablesUsageMixed,
  stringObject: types.StyleStringObject = {}
): types.StyleStringObject => {
  const objectEntries = Object.entries(cssVariableUsages) as [
    string,
    types.CSSVariablesUsageValue | types.CSSVariablesUsageValue[],
  ][];

  for (const [key, value] of objectEntries) {
    const usageType = cssVariableUsageKeyType(key);

    if (usageType === "object") {
      // The object key can be in 2 different formats:
      // 1. <cssKey>-<subkey> e.g. tranform-rotate:
      // 2. <cssKey> (with value being an object of subkeys) e.g. transform
      // if it is format 2, then it will override any existing key of the same cssKey

      // First split the key into prefix and suffix
      const [cssKey, ...suffixParts] = key.split("-");
      const subKey = suffixParts.join("-");

      // Validate subkey value
      // Throw error if subKey is undefined, or value is array
      if (Array.isArray(value)) {
        throw new Error(
          `Invalid object key "${key}". Expected format "<cssKey>-<subkey>"`
        );
      }

      // Format 1
      if (subKey) {
        // Skip if stringObject[key] is filled with format 2
        if (stringObject[cssKey] && typeof stringObject[cssKey] === "string") {
          continue;
        }

        setObjectValue(
          cssKey,
          subKey,
          value as types.CSSVariablesUsageValue,
          stringObject
        );
        continue;
      }

      // Format 2 - the format of the value should be the same as Single value
      setStringObject(
        cssKey,
        value as types.CSSVariablesUsageValue,
        stringObject,
        true // override existing keys
      );
      continue;
    }

    if (usageType === "array") {
      if (!Array.isArray(value)) {
        throw new Error(
          `Invalid array key "${key}". Expected an array of CSS variable usage values.`
        );
      }

      setStringObjectArray(
        key,
        value as types.CSSVariablesUsageValue[],
        stringObject
      );

      continue;
    }

    // Single value
    setStringObject(key, value as types.CSSVariablesUsageValue, stringObject);
  }

  return stringObject;
};
