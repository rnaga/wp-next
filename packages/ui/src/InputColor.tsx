import { CSSProperties, useRef, useState } from "react";
import { Input } from "./Input";
import { Box, SxProps } from "@mui/material";

type HexString = `#${string}`;
type AngleUnit = "deg" | "rad" | "turn";

export const isColorString = (src: string): boolean =>
  /^#([\da-f]{3}|[\da-f]{6})$/i.test(src) ||
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+)?\s*\)$/.test(
    src
  ) ||
  /^hsla?\(\s*[\d.]+\s*(deg|rad|turn)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%/.test(
    src
  ) ||
  /^hsv\(\s*[\d.]+\s*(deg|rad|turn)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/.test(
    src
  );

/** Convert common CSS color strings to 7-char hex (#rrggbb) for <input type="color"> */
const toHexColor = (src: string): HexString | "" => {
  const v = src.trim().toLowerCase();

  // Return empty string if the input is empty
  if (!v) return "" as HexString;

  /* ---------- HEX ---------- */
  const hex = v.replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(hex) || /^[\da-f]{6}$/i.test(hex)) {
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    return `#${full}` as HexString;
  }

  /* ---------- RGB / RGBA ---------- */
  const rgbMatch = v.match(/^rgba?\(([^)]+)\)$/);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch[1]
      .split(",")
      .slice(0, 3)
      .map((n) => clamp(+n, 0, 255));
    return rgbToHex(r, g, b);
  }

  /* ---------- HSL / HSLA ---------- */
  const hslMatch = v.match(
    /^hsla?\(\s*([\d.]+)(deg|rad|turn)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/
  );
  if (hslMatch) {
    const h = parseAngle(+hslMatch[1], hslMatch[2] as AngleUnit);
    const s = clamp(+hslMatch[3], 0, 100) / 100;
    const l = clamp(+hslMatch[4], 0, 100) / 100;
    return rgbToHex(...hslToRgb(h, s, l));
  }

  /* ---------- HSV ---------- */
  const hsvMatch = v.match(
    /^hsv\(\s*([\d.]+)(deg|rad|turn)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/
  );
  if (hsvMatch) {
    const h = parseAngle(+hsvMatch[1], hsvMatch[2] as AngleUnit);
    const s = clamp(+hsvMatch[3], 0, 100) / 100;
    const vv = clamp(+hsvMatch[4], 0, 100) / 100;
    return rgbToHex(...hsvToRgb(h, s, vv));
  }

  //throw new Error(`Unsupported color format: “${src}”`);
  // return "#000000" as HexString;
  return "" as HexString; // Return empty string for unsupported formats
};

/* ---------- helpers ---------- */
const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

const rgbToHex = (r: number, g: number, b: number): HexString =>
  `#${[r, g, b]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}` as HexString;

const parseAngle = (val: number, unit: AngleUnit = "deg"): number => {
  switch (unit) {
    case "turn":
      return (val * 360) % 360;
    case "rad":
      return ((val * 180) / Math.PI) % 360;
    default:
      return val % 360; // deg
  }
};

const hslToRgb = (
  h: number,
  s: number,
  l: number
): [number, number, number] => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
      ? [x, c, 0]
      : hp < 3
      ? [0, c, x]
      : hp < 4
      ? [0, x, c]
      : hp < 5
      ? [x, 0, c]
      : [c, 0, x];

  const m = l - c / 2;
  return [r1 + m, g1 + m, b1 + m].map((v) => Math.round(v * 255)) as [
    number,
    number,
    number
  ];
};

const hsvToRgb = (
  h: number,
  s: number,
  v: number
): [number, number, number] => {
  const c = v * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
      ? [x, c, 0]
      : hp < 3
      ? [0, c, x]
      : hp < 4
      ? [0, x, c]
      : hp < 5
      ? [x, 0, c]
      : [c, 0, x];

  const m = v - c;
  return [r1 + m, g1 + m, b1 + m].map((v) => Math.round(v * 255)) as [
    number,
    number,
    number
  ];
};

export const InputColor = (
  props: Omit<Parameters<typeof Input>[0], "sx"> & {
    sx?: SxProps;
    slotSxProps?: {
      input?: SxProps;
      color?: CSSProperties;
    };
  }
) => {
  const { size, onChange, sx, onBlur, slotSxProps, ...rest } = props;

  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const [value, setValue] = useState<string | undefined>(
    `${props.value ?? ""}`
  );

  const handleChange = (value: string) => {
    setValue(value);
    onChange && onChange(value);
  };

  const handleBlur = (value: string) => {
    if (!onBlur) return;

    setValue(value);
    onBlur(value);
  };

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", ...sx }}>
      <Input
        size={size}
        onChange={(value) => {
          handleChange(value);
        }}
        onBlur={(value) => {
          handleBlur(value);
        }}
        sx={{
          width: "100%",
          ...slotSxProps?.input,
        }}
        {...rest}
        value={value ?? ""}
      />
      <input
        type="color"
        style={{
          width: "15%",
          height: size === "medium" ? 28 : size == "large" ? 32 : 22,
          ...slotSxProps?.color,
        }}
        value={toHexColor(value ?? "")}
        onChange={(e) => {
          const value = e.target.value;
          if (timeoutId.current) {
            clearTimeout(timeoutId.current);
          }

          timeoutId.current = setTimeout(() => {
            handleChange(value);
            timeoutId.current = null;
          }, 20);
        }}
      />
    </Box>
  );
};
