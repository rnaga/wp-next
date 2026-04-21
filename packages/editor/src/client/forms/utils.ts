import type * as types from "../../types";

export const createExtractFormData =
  <const T extends readonly string[]>(keys: T, nestedKey?: `__${string}`) =>
  (formData: Record<string, any>) => {
    const result: Record<string, any> = {};

    keys.forEach((key) => {
      const keyValue = nestedKey
        ? (formData[nestedKey] ?? {})
        : (formData ?? {});

      // Set undefined if the key is not found
      // which will be removed from __css.__style when called by __css.set
      result[key] = keyValue?.[key as T[number]] || undefined;
    });

    return result as Record<T[number], any>;
  };

export const createTransformFormDataValue =
  (formData: Record<string, any>) =>
  <T>(name: string, callback: (...args: any) => T, defaultValue: T) => {
    return callback
      ? formData?.[name]
        ? callback(formData?.[name])
        : defaultValue
      : (formData?.[name] ?? defaultValue);
  };

export const parseCssValue = (v: string | undefined) => {
  const value = String(v === undefined ? "0" : v);
  // Check if value is "auto"
  if (value.trim() === "auto") {
    return { value: "", unit: "auto" };
  }

  const match = value.match(/^(-?\d*\.?\d+)([a-z%]+)?$/i);

  return match
    ? { value: match[1], unit: match[2] ?? null }
    : { value, unit: null };
};

export const formatCssValue = (args?: {
  value: string;
  unit: string | null;
}) => {
  const { value = "0", unit = "" } = args ?? {};
  return `${value}${unit ?? ""}`;
};

export const cssPositionValueToJson = (
  value: string
): types.CSSPositionValues => {
  const values = value.split(/\s+/).map(parseCssValue);
  return {
    top: values[0],
    right: values[1] ?? values[0],
    bottom: values[2] ?? values[0],
    left: values[3] ?? values[1] ?? values[0],
  };
};

export const jsonToCssPositionValue = (
  json?: types.CSSPositionValues
): string => {
  const top = formatCssValue(json?.top);
  const right = formatCssValue(json?.right);
  const bottom = formatCssValue(json?.bottom);
  const left = formatCssValue(json?.left);

  if (top === bottom && right === left && top === right) {
    return top;
  } else if (top === bottom && right === left) {
    return `${top} ${right}`;
  } else if (right === left) {
    return `${top} ${right} ${bottom}`;
  } else {
    return `${top} ${right} ${bottom} ${left}`;
  }
};

export const positionToCssValue = (
  position: "top" | "right" | "bottom" | "left",
  json?: types.CSSPositionValues
): string => {
  const value = json?.[position]?.value;
  const unit = json?.[position]?.unit;

  return `${value ?? "0"}${unit ?? ""}`;
};
