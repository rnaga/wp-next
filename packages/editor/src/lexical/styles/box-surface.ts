import type * as types from "../../types";

export const borderDefaultValue: types.CSSBorderValue = {
  $width: "0px",
  $style: "solid",
  $color: "#000",
};

type BorderKey =
  | "border"
  | "border-top"
  | "border-right"
  | "border-bottom"
  | "border-left";

export const borderValueToCSS = (
  value: types.CSSBorder | undefined
): Record<BorderKey, string | undefined> | undefined => {
  if (!value) return undefined;

  const { $style: defaultStyle, $color: defaultColor } = borderDefaultValue;

  switch (value.$type) {
    case "all":
      if (!value.$all) {
        return {
          border: undefined,
          "border-top": undefined,
          "border-right": undefined,
          "border-bottom": undefined,
          "border-left": undefined,
        };
      }
      const {
        $width,
        $style = defaultStyle,
        $color = defaultColor,
      } = value.$all;
      return {
        border: `${$width} ${$style} ${$color}`,
        "border-top": undefined,
        "border-right": undefined,
        "border-bottom": undefined,
        "border-left": undefined,
      };
    case "individual":
      const borderObj: Record<
        Exclude<BorderKey, "border">,
        string | undefined
      > = {
        "border-top": undefined,
        "border-right": undefined,
        "border-bottom": undefined,
        "border-left": undefined,
      };
      const sideMap = {
        $top: "border-top",
        $right: "border-right",
        $bottom: "border-bottom",
        $left: "border-left",
      } as const;
      (["$top", "$right", "$bottom", "$left"] as const).forEach((side) => {
        const border = value[side];
        if (border) {
          borderObj[sideMap[side]] = `${border.$width} ${
            border.$style ?? defaultStyle
          } ${border.$color ?? defaultColor}`;
        }
      });
      return {
        border: undefined,
        ...borderObj,
      };
    default:
      return undefined;
  }
};

export const borderValueToString = (
  value: types.CSSBorder | undefined
): string | undefined => {
  if (!value || !borderHasValue(value)) {
    return undefined;
  }

  const css = borderValueToCSS(value);
  if (!css) return undefined;

  return Object.entries(css)
    .map(([key, val]) => (val ? `${key}: ${val};` : ""))
    .filter(Boolean)
    .join(" ");
};

export const borderHasValue = (value: types.CSSBorder | undefined): boolean => {
  if (
    !value ||
    (value?.$type === "all" &&
      0 === parseInt(`${value?.$all?.$width || "0"}`)) ||
    (value?.$type === "individual" &&
      ["$top", "$right", "$bottom", "$left"].every((side) => {
        const borderValue = value[side as keyof types.CSSBorder] as
          | types.CSSBorderValue
          | undefined;
        return !(
          borderValue &&
          borderValue.$width &&
          parseInt(borderValue.$width) > 0
        );
      }))
  ) {
    return false;
  }

  return true;
};

export const radiusValueToCSS = (
  value: types.CSSBorderRadius | undefined
): string | undefined => {
  if (!value) return undefined;

  const { $type, $all, $top, $right, $bottom, $left } = value;

  if ($type === "all" && $all) {
    return $all;
  }

  const sides = {
    top: $top || 0,
    right: $right || 0,
    bottom: $bottom || 0,
    left: $left || 0,
  };

  return Object.values(sides)
    .map((side) => side?.toString())
    .join(" ");
};

export const boxShadowValuesToCSSArray = (
  values: (types.CSSBoxShadowValue | undefined)[]
): string[] | undefined => {
  const convertToCSSValue = (val: types.CSSBoxShadowValue): string => {
    // Handle empty or missing values gracefully
    const position = val.position?.trim() || "outset"; // Default to "outset"
    const offsetX = val.offsetX?.trim() || "0px";
    const offsetY = val.offsetY?.trim() || "0px";
    const blurRadius = val.blurRadius?.trim() || "0px";
    const size = val.size?.trim() || "";
    const color = val.color?.trim() || "";

    // The correct order for box-shadow in CSS is:
    // [inset?] <offset-x> <offset-y> [<blur-radius>] [<spread-radius>] [<color>]
    // 'position' should be 'inset' if present, otherwise omitted.
    // 'size' is typically the spread radius.
    // So, the correct order is: [inset] offsetX offsetY blurRadius size color

    // Only include 'inset' if position is exactly 'inset'
    const inset = position === "inset" ? "inset" : "";
    return [inset, offsetX, offsetY, blurRadius, size, color]
      .filter(Boolean)
      .join(" ")
      .trim();
  };

  return !values || values.length === 0
    ? undefined
    : values.filter((v) => !!v).map(convertToCSSValue);
};

export const outlineDefaultValue: types.CSSOutlineValue = {
  $width: "0px",
  $style: "solid",
  $color: "#000",
  $offset: "0px",
};

export const outlineValueToCSS = (
  value: types.CSSOutlineValue | undefined
):
  | { outline: string | undefined; outlineOffset: string | undefined }
  | undefined => {
  if (!value) return undefined;

  const { $style, $color, $width, $offset } = value;

  if (!$width || parseInt($width) === 0) {
    return {
      outline: undefined,
      outlineOffset: undefined,
    };
  }

  return {
    outline: `${$width} ${$style} ${$color}`,
    outlineOffset: $offset,
  };
};

export const outlineValueToString = (
  value: types.CSSOutlineValue | undefined
): string | undefined => {
  if (!value || !outlineHasValue(value)) {
    return undefined;
  }

  const css = outlineValueToCSS(value);
  if (!css) return undefined;

  return Object.entries(css)
    .map(([key, val]) => (val ? `${key}: ${val};` : ""))
    .filter(Boolean)
    .join(" ");
};

export const outlineHasValue = (
  value: types.CSSOutlineValue | undefined
): boolean => {
  if (!value || !value.$width || parseInt(value.$width) === 0) {
    return false;
  }

  return true;
};
