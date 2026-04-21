export type FontWeight =
  | 0
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900;

export type FontStyle = "normal" | "italic";

export type FontFace = {
  ID: number;
  name: string;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  url: string;
  fontFileId?: number;
};

export type FontType = "google" | "custom" | "raw";

export type GoogleFonts = Record<
  string,
  {
    // fontWeight is not needed while ALL_FONT_WEIGHTS in buildGoogleFontQueryString requests all weights
    // fontWeight: number[];
    fontStyle: Array<"normal" | "italic">;
  }
>;

export type GoogleFontsParameters = Omit<CSSTypography, "$type" | "$slug">;

export type CSSTypography = {
  $type: FontType | undefined;
  $slug: string | undefined;
  fontFamily: string | undefined;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
};
