type CSSBorderStyle =
  | "solid"
  | "dashed"
  | "dotted"
  | "double"
  | "groove"
  | "ridge"
  | "inset"
  | "outset";

export type CSSBorderValue = {
  $width?: string; // e.g., "1px", "2px"
  $style?: CSSBorderStyle;
  $color?: string; // e.g., "#ff0000", "rgba(255, 0, 0, 1)"
};

export type CSSBorder = {
  $type: "all" | "individual";
  $all?: CSSBorderValue;
  $top?: CSSBorderValue;
  $right?: CSSBorderValue;
  $bottom?: CSSBorderValue;
  $left?: CSSBorderValue;
};

export type CSSBorderRadius = {
  $type: "all" | "individual";
  $all?: string; // e.g., "4px", "8px"
  $top?: string;
  $right?: string;
  $bottom?: string;
  $left?: string;
};

export type CSSBoxShadowValue = {
  position: "inset" | "outset"; // "inset" for inner shadow, "outset" for outer shadow
  offsetX: string;
  offsetY: string;
  blurRadius: string;
  size?: string; // Optional, e.g., "0px"
  color: string;
};

export type CSSOutlineValue = {
  $width?: string; // e.g., "1px", "2px"
  $style: CSSBorderStyle;
  $color: string; // e.g., "#ff0000", "rgba(255, 0, 0, 1)"
  $offset: string;
};
