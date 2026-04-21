import { Box } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useEffect, useState, useRef } from "react";
import { bezierToCSSString } from "./bezier-utils";
import type * as types from "../../../types";

interface AnimationPreviewProps {
  value: types.BezierCurve;
  duration?: number;
}

const PREVIEW_WIDTH = 300;
const PREVIEW_HEIGHT = 30;
const DOT_SIZE = 12;

export const AnimationPreview = ({
  value,
  duration = 1000,
}: AnimationPreviewProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [position, setPosition] = useState<"left" | "right">("left");
  const [enableTransition, setEnableTransition] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const returnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggle = () => {
    if (isAnimating) {
      // Stop the animation immediately and snap back to left
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (returnTimeoutRef.current) {
        clearTimeout(returnTimeoutRef.current);
      }
      setIsAnimating(false);
      // Disable transition, snap to left, then re-enable transition
      setEnableTransition(false);
      setPosition("left");
      // Re-enable transition after a brief moment
      setTimeout(() => {
        setEnableTransition(true);
      }, 50);
    } else {
      // Start the animation
      // Clear any existing timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (returnTimeoutRef.current) {
        clearTimeout(returnTimeoutRef.current);
      }

      // Ensure transition is enabled
      setEnableTransition(true);
      // Reset to left
      setPosition("left");
      setIsAnimating(true);

      // Use setTimeout to trigger reflow and start animation
      setTimeout(() => {
        // Move to right
        setPosition("right");

        // Schedule return to left
        returnTimeoutRef.current = setTimeout(() => {
          setPosition("left");

          // After returning to left, switch button back to Play
          timeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
          }, duration);
        }, duration);
      }, 10);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (returnTimeoutRef.current) {
        clearTimeout(returnTimeoutRef.current);
      }
    };
  }, []);

  const bezierString = bezierToCSSString(value);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <Typography fontSize={9} color="text.secondary">
          CSS Value:
        </Typography>
        <Box
          sx={{
            fontFamily: "monospace",
            fontSize: 9,
            p: 1,
            backgroundColor: "#f5f5f5",
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            wordBreak: "break-all",
          }}
        >
          {bezierString}
        </Box>
      </Box>

      <Typography fontSize={10} bold>
        Preview
      </Typography>

      <Box
        sx={{
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          position: "relative",
          backgroundColor: "#fafafa",
          border: "1px solid #e0e0e0",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left:
              position === "right" ? `${PREVIEW_WIDTH - DOT_SIZE}px` : "0px",
            top: "50%",
            transform: "translateY(-50%)",
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: "50%",
            backgroundColor: "#2196f3",
            transition: enableTransition
              ? `left ${duration}ms ${bezierString}`
              : "none",
          }}
        />
      </Box>
      <Button
        size="small"
        onClick={handleToggle}
        variant={isAnimating ? "outlined" : "contained"}
      >
        <Typography fontSize={9}>{isAnimating ? "Stop" : "Play"}</Typography>
      </Button>
    </Box>
  );
};
