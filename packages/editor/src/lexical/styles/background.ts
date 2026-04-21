import type * as types from "../../types";

export const backgroundValuesToCSSArray = (
  values?: types.CSSBackgroundImage[],
  global?: types.CSSBackgroundGlobal
): string[] => {
  // Check if global background color and clip are set
  const globalValue = `${global?.$backgroundColor || ""} ${
    global?.$clip || ""
  }`.trim();

  if (!values || values.length === 0) {
    return globalValue ? [globalValue] : [];
  }

  const cssValues = values.map((value) => backgroundValueToCSSString(value));

  // Add the global background color or clip as the last value, per CSS background layering spec.
  if (globalValue) {
    cssValues.push(globalValue);
  }

  return [...cssValues];
};

export const backgroundValueToStringArray = (
  value: types.CSSBackgroundImage | undefined
): string[] => {
  if (!value) return [];

  switch (value.$type) {
    case "url":
      return [value.imageUrl || ""];
    case "linear-gradient":
      return value.degrees && value.degrees > 0
        ? [`${value.degrees}deg`, ...value.values]
        : value.values
          ? [...value.values]
          : [];
    case "radial-gradient":
      const firstValue = `${value.endingShape || "circle"} ${
        value.size || "closest-side"
      } at top ${value.top ? `${value.top}%` : "50%"} left ${
        value.left ? `${value.left}%` : "50%"
      }`;
      return [firstValue, ...value.values];

    default:
      return [];
  }
};

const advancedOptionsToString = (
  value: types.CSSBackgroundImage | undefined
): string => {
  if (!value || !value.advancedOptions) return "";

  const options = value.advancedOptions;
  const parts: string[] = [];

  // 1. Repeat
  if (options.repeat) parts.push(options.repeat);

  // 2. Attachment
  if (options.attachment) parts.push(options.attachment);

  // 3. Position and Size
  let positionSizePart = "";
  if (options.position || options.size) {
    const { top, left } = options.position || {};
    const pos = [
      left !== undefined ? `${left}%` : undefined,
      top !== undefined ? `${top}%` : undefined,
    ]
      .filter(Boolean)
      .join(" ");

    const { keyword, width, height } = options.size || {};
    const size =
      keyword ??
      (width || height ? `${width || "auto"} ${height || "auto"}` : undefined);

    if (pos && size) {
      positionSizePart = `${pos} / ${size}`;
    } else if (pos) {
      positionSizePart = pos;
    } else if (size) {
      positionSizePart = `0% 0% / ${size}`;
    }

    if (positionSizePart) parts.push(positionSizePart);
  }

  // 4. Origin and clip
  if (options.origin || options.clip) {
    const origin = options.origin || options.clip || "padding-box";
    const clip = options.clip || options.origin || origin;
    parts.push(`${origin} ${clip}`);
  }

  return parts.join(" ");
};

/**
 * Converts a CSS background image value object to its corresponding CSS string representation.
 *
 * @param value - The CSS background image value object to convert.
 * @returns The CSS string representation of the background image, or `undefined` if the type is not recognized.
 */
export const backgroundValueToCSSString = (
  background: types.CSSBackgroundImage
): string => {
  const stringArray = backgroundValueToStringArray(background);
  const advancedOptions = advancedOptionsToString(background);

  switch (background?.$type) {
    case "url":
      return `url(${stringArray[0]}) ${advancedOptions}`.trim();
    case "linear-gradient":
      return `linear-gradient(${stringArray.join(
        ", "
      )}) ${advancedOptions}`.trim();
    case "radial-gradient":
      return `radial-gradient(${stringArray.join(
        ", "
      )}) ${advancedOptions}`.trim();

    default:
      throw new Error(`Unsupported CSS background image type`);
  }
};

export const hasBackgroundValue = (
  value: types.CSSBackgroundImage | undefined
): boolean => {
  if (!value) return false;

  switch (value.$type) {
    case "url":
      return Boolean(value.imageUrl);
    case "linear-gradient":
      return Boolean(value.values && value.values.length > 0);
    case "radial-gradient":
      return Boolean(value.values && value.values.length > 0);
    // case "color":
    //   return !!value.color;
    default:
      throw new Error(`Unsupported CSS background image type`);
  }
};
