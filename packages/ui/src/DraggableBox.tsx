/**
 * A draggable component that displays content in a floating container.
 *
 * Props:
 * - children: The content to be displayed inside the draggable box.
 * - open: Controls whether the box is visible or not.
 * - onClose: Callback to close the box.
 * - offset: Optional initial offset for the box's X and Y coordinates.
 * - title: Optional title to display in the header.
 * - size: Sets the Typography size ("small" | "medium").
 * - targetRef: Reference to an element whose relative position determines the box's initial placement.
 * - sx: Style overrides for the outer Box wrapping the content.
 * - slotSxProps: Style overrides for the header and title.
 */
import React, {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Box, Divider, SxProps } from "@mui/material";
import { Typography } from "./Typography";
import { Background } from "./Background";
import { Portal } from "./portal";

// Optional style prop types for certain sections of the component
type SlotSxProps = {
  header?: SxProps;
  title?: SxProps;
};

export const DraggableBox = (props: {
  children: React.ReactNode;
  open: boolean;
  onClose: VoidFunction;
  offset?: {
    left?: number;
    top?: number;
  };
  title?: string;
  size?: "small" | "medium";
  targetRef?: RefObject<HTMLElement | null>;
  ref?: RefObject<HTMLElement | null>;
  sx?: SxProps;
  slotSxProps?: SlotSxProps;
  zIndexLayer?: number; // Optional zIndex layer for the box
  placement?: "target" | "left";
}) => {
  // Destructure props
  const {
    children,
    targetRef,
    ref: selfRef,
    title,
    size,
    onClose,
    open,
    sx,
    slotSxProps,
    offset: initialOffset = {},
    zIndexLayer = 0,
    placement = "left",
  } = props;

  // Provide default offset values for the box
  const { left = 0, top = 0 } = initialOffset;

  // Reference to the draggable box DOM element
  const boxRef = useRef<HTMLElement>(null);

  // State to store the current position of the draggable box
  const [position, setPosition] = useState({ x: left, y: top });

  // Determines if the box is currently being dragged
  const [isDragging, setIsDragging] = useState(false);

  // Stores the mouse down offset within the box
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  /**
   * Ensures the new position is within the browser window bounds.
   * Returns null if the position would place the box partially off-screen.
   */
  const clampPosition = (
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    let newX = x;
    let newY = y;
    if (newX < 0 || newX + width > window.innerWidth) return null;
    if (newY < 0 || newY + height > window.innerHeight) return null;
    return { x: newX, y: newY };
  };

  /**
   * Callback ref to get the DOM element for the draggable box.
   * Requires a targetRef to position the box relative to another element.
   */
  const callbackRef = useCallback(
    (ref: HTMLElement | undefined) => {
      if (!ref || !targetRef?.current) return;
      boxRef.current = ref;
      if (selfRef) {
        // If a selfRef is provided, assign the boxRef to it
        selfRef.current = ref;
      }

      // Calculate the referenced element’s position
      const rect = targetRef.current.getBoundingClientRect();
      const boxWidth = boxRef.current.offsetWidth || 0;
      const boxHeight = boxRef.current.offsetHeight || 0;

      // Compute initial position based on target element
      let newX = rect.left + left - boxWidth;
      let newY = rect.bottom - boxHeight / 2 + top;

      // if placemenet is "target", x and y are relative to the target element
      if (placement === "target") {
        newX = rect.left;
        newY = rect.top;
      }

      // If the box goes off-screen at the bottom, adjust upward
      if (newY + boxHeight > window.innerHeight) {
        newY = window.innerHeight - boxHeight;
      }
      // Store the position state
      setPosition({ x: newX, y: newY });
    },
    [targetRef, left, top]
  );

  /**
   * Called when the user presses the mouse button within the box header.
   * Captures the offset from the mouse position to the box's top-left corner.
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = boxRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  /**
   * Called whenever the mouse moves, if dragging is active.
   * Updates the box position while respecting window bounds.
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !boxRef.current) return;
    const { offsetWidth, offsetHeight } = boxRef.current;
    const newPos = clampPosition(
      e.clientX - offset.x,
      e.clientY - offset.y,
      offsetWidth,
      offsetHeight
    );
    if (newPos) setPosition(newPos);
  };

  // Called when the mouse is released. Ends the dragging session.
  const handleMouseUp = () => setIsDragging(false);

  /**
   * Subscribes to mousemove and mouseup while dragging; unsubscribes otherwise.
   * This ensures we only respond to these events when necessary.
   */
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, offset]);

  /**
   * Observes changes to the box size and repositions if part of the box
   * moves off-screen. This keeps the box fully visible upon resizing.
   */
  useEffect(() => {
    if (!open || !boxRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      const rect = boxRef.current!.getBoundingClientRect();
      let { x, y } = position;
      const { width, height } = rect;

      // Clamp against right/bottom edges
      if (rect.right > window.innerWidth)
        x = Math.max(0, window.innerWidth - width);
      if (rect.bottom > window.innerHeight)
        y = Math.max(0, window.innerHeight - height);

      // Only update position if there's a change
      if (x !== position.x || y !== position.y) setPosition({ x, y });
    });
    resizeObserver.observe(boxRef.current);

    // Cleanup upon unmount or when the box is closed
    return () => resizeObserver.disconnect();
  }, [open, position]);

  // If the box is not open, render nothing
  if (!open) return null;

  return (
    <>
      {/* Background overlay, higher stacking context than normal content */}
      <Background zIndex={999 + zIndexLayer} onClose={onClose} />
      {/* Portal to render the box outside of the normal hierarchy */}
      <Portal>
        <Box
          // Attach our callback ref
          ref={callbackRef}
          sx={{
            position: "fixed",
            left: position.x,
            top: position.y,
            userSelect: "none",
            minWidth: 300,
            zIndex: 1000 + zIndexLayer,
            bgcolor: "background.paper",
            borderRadius: 2,
            p: 1,
            ...sx,
          }}
        >
          {/* Header section, used for dragging via mouseDown */}
          <Box
            sx={{
              height: 30,
              cursor: "move",
              ...slotSxProps?.header,
            }}
            onMouseDown={handleMouseDown}
          >
            <Typography
              size={size}
              sx={{
                p: 0.5,
                ...slotSxProps?.title,
              }}
              bold
            >
              {title}
            </Typography>
          </Box>
          {/* Main content area */}
          <Box>{children}</Box>
        </Box>
      </Portal>
    </>
  );
};
