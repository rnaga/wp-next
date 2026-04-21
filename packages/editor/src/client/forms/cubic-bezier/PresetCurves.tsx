import { Box } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import {
  formatPresetName,
  generateBezierPath,
  PRESET_CURVES,
  PresetCurveName,
} from "./bezier-utils";

import type * as types from "../../../types";

interface PresetCurvesProps {
  value: types.BezierCurve;
  onChange: (value: types.BezierCurve) => void;
  disabled?: boolean;
}

const PREVIEW_SIZE = 30;
const PREVIEW_PADDING = 3;

// Generate a mini preview path for a curve
const getMiniCurvePath = (curve: types.BezierCurve): string => {
  const points = generateBezierPath(curve, 20);
  const scale = PREVIEW_SIZE - PREVIEW_PADDING * 2;

  return points.reduce((path, [x, y], index) => {
    const svgX = PREVIEW_PADDING + x * scale;
    const svgY = PREVIEW_PADDING + (1 - y) * scale;
    if (index === 0) return `M ${svgX} ${svgY}`;
    return `${path} L ${svgX} ${svgY}`;
  }, "");
};

// Check if two curves are approximately equal
const curvesEqual = (
  a: types.BezierCurve,
  b: types.BezierCurve,
  tolerance = 0.01
): boolean => {
  return (
    Math.abs(a[0] - b[0]) < tolerance &&
    Math.abs(a[1] - b[1]) < tolerance &&
    Math.abs(a[2] - b[2]) < tolerance &&
    Math.abs(a[3] - b[3]) < tolerance
  );
};

export const PresetCurves = ({
  value,
  onChange,
  disabled = false,
}: PresetCurvesProps) => {
  const presetNames = Object.keys(PRESET_CURVES) as PresetCurveName[];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Typography fontSize={10} bold sx={{ mb: 0.5 }}>
        Presets
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          maxHeight: 500,
          overflowY: "auto",
          pr: 0.5,
        }}
      >
        {presetNames.map((name) => {
          const curve = PRESET_CURVES[name];
          const isSelected = curvesEqual(value, curve);
          const path = getMiniCurvePath(curve);

          return (
            <Box
              key={name}
              onClick={() => !disabled && onChange(curve)}
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 1,
                p: 0.5,
                border: "1px solid",
                borderColor: isSelected ? "primary.main" : "divider",
                borderRadius: 1,
                cursor: disabled ? "not-allowed" : "pointer",
                backgroundColor: isSelected ? "action.selected" : "transparent",
                opacity: disabled ? 0.5 : 1,
                transition: "all 0.2s",
                "&:hover": disabled
                  ? {}
                  : {
                      borderColor: "primary.main",
                      backgroundColor: "action.hover",
                    },
              }}
            >
              <svg
                width={PREVIEW_SIZE}
                height={PREVIEW_SIZE}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  background: "#fafafa",
                  flexShrink: 0,
                }}
              >
                {/* Grid */}
                <rect
                  x={PREVIEW_PADDING}
                  y={PREVIEW_PADDING}
                  width={PREVIEW_SIZE - PREVIEW_PADDING * 2}
                  height={PREVIEW_SIZE - PREVIEW_PADDING * 2}
                  fill="none"
                  stroke="#ddd"
                  strokeWidth={0.5}
                />

                {/* Curve */}
                <path
                  d={path}
                  fill="none"
                  stroke={isSelected ? "#2196f3" : "#666"}
                  strokeWidth={1.2}
                  strokeLinecap="round"
                />
              </svg>

              <Typography
                fontSize={8}
                sx={{
                  color: isSelected ? "primary.main" : "text.secondary",
                  fontWeight: isSelected ? "bold" : "normal",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {formatPresetName(name)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
