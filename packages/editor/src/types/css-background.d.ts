export type CSSBackgroundImageType =
  | "url"
  | "linear-gradient"
  | "radial-gradient";

export type CSSBackgroundImageUrlValue = {
  $type: "url";
  imageUrl: string | undefined;
  degrees?: never;
  values?: never;
  top?: never;
  left?: never;
  endingShape?: never;
  size?: never;
  advancedOptions?: CSSBackgroundAdvancedOptions;
};

export type CSSBackgroundImageLinearGradientValue = {
  $type: "linear-gradient";
  imageUrl?: never;
  degrees?: number;
  values: string[];
  top?: number;
  left?: number;
  endingShape?: never;
  size?: never;
  advancedOptions?: CSSBackgroundAdvancedOptions;
};

export type CSSBackgroundImageRadialGradientValue = {
  $type: "radial-gradient";
  imageUrl?: never;
  degrees?: never;
  top: number;
  left: number;
  endingShape: "circle" | "ellipse";
  values: string[];
  size?:
    | "closest-side"
    | "closest-corner"
    | "farthest-side"
    | "farthest-corner";
  advancedOptions?: CSSBackgroundAdvancedOptions;
};

// export type CSSBackgroundColorValue = {
//   $type: "color";
//   color: string; // e.g., "#ff0000", "rgba(255, 0, 0, 1)"
//   advancedOptions?: CSSBackgroundAdvancedOptions;
// };

export type CSSBackgroundAdvancedOptions = Partial<{
  position: {
    top?: number; // in percentage
    left?: number; // in percentage
  };
  size: {
    keyword?: "cover" | "contain";
    width?: string; // e.g., "100px", "50%", "auto"
    height?: string; // e.g., "100px", "50%", "auto"
  };
  //color: string; // e.g., "#ff0000", "rgba(255, 0, 0, 1)"
  attachment: "scroll" | "fixed" | "local";
  repeat: "repeat" | "no-repeat" | "repeat-x" | "repeat-y";
  clip: "border-box" | "padding-box" | "content-box" | "text";
  origin: "border-box" | "padding-box" | "content-box";
}>;

export type CSSBackgroundImage =
  | CSSBackgroundImageUrlValue
  | CSSBackgroundImageLinearGradientValue
  | CSSBackgroundImageRadialGradientValue;

export type CSSBackgroundGlobal = {
  $backgroundColor?: string; // e.g., "#ff0000", "rgba(255, 0, 0, 1)"
  $clip?: "border-box" | "padding-box" | "content-box" | "text";
};
