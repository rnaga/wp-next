import { useEffect, useRef } from "react";

interface Props {
  onDeltaChange: (e: MouseEvent, delta: { x: number; y: number }) => void;
  onMouseUp?: (e: MouseEvent) => void;
  onMouseDown?: (e: MouseEvent) => void;
  onContextMenu?: (e: MouseEvent) => void;
  onClick?: (e: MouseEvent) => void;
  threshold?: number;
  debounceTime?: number;
  cursor?: string; // Add cursor prop
}

export const useMouseMove = ({
  onDeltaChange,
  onMouseUp,
  onMouseDown,
  onContextMenu,
  onClick,
  threshold = 0.5,
  debounceTime = 500,
  cursor = "grabbing", // Default cursor
}: Props) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const eventStateRef = useRef<{
    isMouseDown: boolean;
    initialX: number | null;
    initialY: number | null;
    overlay?: HTMLElement | null;
  } | null>(null);

  const clickDurationTimerRef = useRef<number>(0);

  const handleMouseMove = (e: MouseEvent) => {
    //const target = e.target as HTMLElement;
    e.stopPropagation();
    e.preventDefault();

    const state = eventStateRef.current;
    if (!state || !state.isMouseDown) return;

    const deltaX = e.clientX - (state.initialX ?? e.clientX);
    const deltaY = e.clientY - (state.initialY ?? e.clientY);

    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      onDeltaChange(e, { x: deltaX, y: deltaY });
      state.initialX = e.clientX;
      state.initialY = e.clientY;
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    const state = eventStateRef.current;
    if (state?.isMouseDown) {
      const clickDuration = Date.now() - clickDurationTimerRef.current;

      // Check if the click duration is less than 150ms, then it's a click
      if (clickDuration < 150) {
        // Call the onClick handler
        onClick?.(e);
      } else if (onMouseUp) {
        onMouseUp(e);
      }

      state.isMouseDown = false;
      state.initialX = null;
      state.initialY = null;

      // Remove the overlay
      if (state.overlay) {
        state.overlay.removeEventListener("mousemove", handleMouseMove);
        state.overlay.removeEventListener("mouseup", handleMouseUp);
        document.body.removeChild(state.overlay);
        state.overlay = null;
      }

      eventStateRef.current = null;
    }
  };

  const initMouseMove = (
    elementOrRef: HTMLElement | React.RefObject<HTMLElement | null>
  ) => {
    elementRef.current =
      elementOrRef instanceof HTMLElement ? elementOrRef : elementOrRef.current;

    return (e: React.MouseEvent) => {
      const element =
        elementOrRef instanceof HTMLElement
          ? elementOrRef
          : elementOrRef.current;

      if (!element) return;

      clickDurationTimerRef.current = Date.now(); // milliseconds

      if (onMouseDown) {
        onMouseDown(e as unknown as MouseEvent);
      }

      let state = eventStateRef.current;
      if (!state) {
        state = {
          isMouseDown: false,
          initialX: null,
          initialY: null,
        };
        eventStateRef.current = state;
      }

      state.isMouseDown = true;
      state.initialX = e.clientX;
      state.initialY = e.clientY;

      // Create and show the overlay
      if (!state.overlay) {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.zIndex = "2000";
        overlay.style.cursor = cursor;
        overlay.style.background = "transparent"; // Keep transparent
        document.body.appendChild(overlay);
        state.overlay = overlay;

        // Attach global mousemove and mouseup to the overlay
        overlay.addEventListener("mousemove", handleMouseMove);
        overlay.addEventListener("mouseup", handleMouseUp);

        if (onContextMenu) {
          overlay.addEventListener("contextmenu", onContextMenu);
        }

        eventStateRef.current = state;
      }
    };
  };

  useEffect(() => {
    return () => {
      // Cleanup overlays and event listeners on unmount
      const state = eventStateRef.current;
      if (state?.overlay) {
        state.overlay.removeEventListener("mousemove", handleMouseMove);
        state.overlay.removeEventListener("mouseup", handleMouseUp);
        if (onContextMenu) {
          state.overlay.removeEventListener("contextmenu", onContextMenu);
        }

        if (state.overlay && state.overlay.parentNode === document.body) {
          document.body.removeChild(state.overlay);
        }
      }
    };
  }, []);

  return { initMouseMove };
};
