import { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

import { generateBezierPath, clamp } from "./bezier-utils";

import type * as types from "../../../types";

interface CubicBezierEditorProps {
  value: types.BezierCurve;
  onChange: (value: types.BezierCurve) => void;
  width?: number;
  height?: number;
  disabled?: boolean;
}

const GRID_SIZE = 220;
const PADDING = 16;
const CONTROL_POINT_RADIUS = 7;
const CURVE_STROKE_WIDTH = 2.5;
const GRID_LINES = 4;

export const CubicBezierEditor = ({
  value,
  onChange,
  width = GRID_SIZE + PADDING * 2,
  height = GRID_SIZE + PADDING * 2,
  disabled = false,
}: CubicBezierEditorProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingPoint, setDraggingPoint] = useState<1 | 2 | null>(null);

  // Convert normalized coordinates (0-1) to SVG coordinates
  const normalizedToSVG = useCallback(
    (x: number, y: number): types.BezierPoint => {
      return [
        PADDING + x * GRID_SIZE,
        PADDING + GRID_SIZE - y * GRID_SIZE, // Invert Y axis
      ];
    },
    []
  );

  // Convert SVG coordinates to normalized (0-1)
  const svgToNormalized = useCallback(
    (x: number, y: number): types.BezierPoint => {
      const normalizedX = clamp((x - PADDING) / GRID_SIZE, 0, 1);
      const normalizedY = clamp((GRID_SIZE - (y - PADDING)) / GRID_SIZE); // Invert Y axis, no limits on Y
      return [normalizedX, normalizedY];
    },
    []
  );

  // Generate curve path
  const getCurvePath = useCallback(() => {
    const points = generateBezierPath(value, 100);
    const svgPoints = points.map(([x, y]) => normalizedToSVG(x, y));

    return svgPoints.reduce((path, [x, y], index) => {
      if (index === 0) return `M ${x} ${y}`;
      return `${path} L ${x} ${y}`;
    }, "");
  }, [value, normalizedToSVG]);

  // Handle mouse down on control points
  const handleMouseDown = (pointIndex: 1 | 2) => (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setDraggingPoint(pointIndex);
  };

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (draggingPoint === null || !svgRef.current || disabled) return;

      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const [normalizedX, normalizedY] = svgToNormalized(x, y);

      const newValue = [...value] as types.BezierCurve;
      if (draggingPoint === 1) {
        newValue[0] = normalizedX;
        newValue[1] = normalizedY;
      } else {
        newValue[2] = normalizedX;
        newValue[3] = normalizedY;
      }

      onChange(newValue);
    },
    [draggingPoint, value, onChange, svgToNormalized, disabled]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDraggingPoint(null);
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (draggingPoint !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingPoint, handleMouseMove, handleMouseUp]);

  // Calculate positions
  const p0 = normalizedToSVG(0, 0);
  const p1 = normalizedToSVG(value[0], value[1]);
  const p2 = normalizedToSVG(value[2], value[3]);
  const p3 = normalizedToSVG(1, 1);

  const curvePath = getCurvePath();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        userSelect: "none",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "default",
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          border: "1px solid #e0e0e0",
          borderRadius: 4,
          background: "#fafafa",
        }}
      >
        {/* Grid lines */}
        <g opacity={0.2}>
          {Array.from({ length: GRID_LINES + 1 }).map((_, i) => {
            const pos = PADDING + (i * GRID_SIZE) / GRID_LINES;
            return (
              <g key={i}>
                <line
                  x1={pos}
                  y1={PADDING}
                  x2={pos}
                  y2={PADDING + GRID_SIZE}
                  stroke="#999"
                  strokeWidth={1}
                />
                <line
                  x1={PADDING}
                  y1={pos}
                  x2={PADDING + GRID_SIZE}
                  y2={pos}
                  stroke="#999"
                  strokeWidth={1}
                />
              </g>
            );
          })}
        </g>

        {/* Border */}
        <rect
          x={PADDING}
          y={PADDING}
          width={GRID_SIZE}
          height={GRID_SIZE}
          fill="none"
          stroke="#666"
          strokeWidth={2}
        />

        {/* Linear reference line (diagonal) */}
        <line
          x1={p0[0]}
          y1={p0[1]}
          x2={p3[0]}
          y2={p3[1]}
          stroke="#ccc"
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Control point handle lines */}
        <g opacity={0.5}>
          <line
            x1={p0[0]}
            y1={p0[1]}
            x2={p1[0]}
            y2={p1[1]}
            stroke="#999"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          <line
            x1={p3[0]}
            y1={p3[1]}
            x2={p2[0]}
            y2={p2[1]}
            stroke="#999"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
        </g>

        {/* Bezier curve */}
        <path
          d={curvePath}
          fill="none"
          stroke="#2196f3"
          strokeWidth={CURVE_STROKE_WIDTH}
          strokeLinecap="round"
        />

        {/* Start and end points */}
        <circle cx={p0[0]} cy={p0[1]} r={4} fill="#666" />
        <circle cx={p3[0]} cy={p3[1]} r={4} fill="#666" />

        {/* Control points */}
        <g>
          {/* Control point 1 */}
          <circle
            cx={p1[0]}
            cy={p1[1]}
            r={CONTROL_POINT_RADIUS}
            fill="#2196f3"
            stroke="white"
            strokeWidth={2}
            style={{
              cursor: disabled ? "not-allowed" : "grab",
              filter: draggingPoint === 1 ? "brightness(0.8)" : "none",
            }}
            onMouseDown={handleMouseDown(1)}
          />
          {/* Control point 2 */}
          <circle
            cx={p2[0]}
            cy={p2[1]}
            r={CONTROL_POINT_RADIUS}
            fill="#2196f3"
            stroke="white"
            strokeWidth={2}
            style={{
              cursor: disabled ? "not-allowed" : "grab",
              filter: draggingPoint === 2 ? "brightness(0.8)" : "none",
            }}
            onMouseDown={handleMouseDown(2)}
          />
        </g>

        {/* Labels */}
        <g fontSize={10} fill="#666">
          <text x={PADDING - 12} y={PADDING + GRID_SIZE + 5}>
            0
          </text>
          <text x={PADDING - 12} y={PADDING + 5}>
            1
          </text>
          <text x={PADDING - 4} y={PADDING + GRID_SIZE + 12}>
            0
          </text>
          <text x={PADDING + GRID_SIZE - 4} y={PADDING + GRID_SIZE + 12}>
            1
          </text>
        </g>
      </svg>
    </Box>
  );
};
