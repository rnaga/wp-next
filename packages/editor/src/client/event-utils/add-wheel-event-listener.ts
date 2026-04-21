type Direction = "up" | "down" | "left" | "right" | "in" | "out" | undefined;

const canScroll = (
  element: HTMLElement | Document | Window,
  direction: Direction
) => {
  const {
    scrollTop,
    scrollHeight,
    clientHeight,
    scrollLeft,
    scrollWidth,
    clientWidth,
  } =
    element instanceof HTMLElement
      ? element
      : element instanceof Document
      ? element.documentElement
      : {
          scrollTop: element.scrollY,
          scrollHeight: element.document.documentElement.scrollHeight,
          clientHeight: element.innerHeight,
          scrollLeft: element.scrollX,
          scrollWidth: element.document.documentElement.scrollWidth,
          clientWidth: element.innerWidth,
        };

  const scrollYPosition =
    element instanceof Window
      ? Math.floor(element.scrollY)
      : Math.floor(scrollTop);

  const scrollXPosition =
    element instanceof Window
      ? Math.floor(element.scrollX)
      : Math.floor(scrollLeft);

  if (
    direction === "in" ||
    direction === "out" ||
    (direction === "up" && scrollYPosition === 0) ||
    (direction === "down" &&
      scrollYPosition / (scrollHeight - clientHeight) >= 0.99) ||
    (direction === "left" && scrollLeft === 0) ||
    (direction === "right" &&
      scrollXPosition / (scrollWidth - clientWidth) >= 0.99)
  ) {
    return false;
  }

  return true;
};

const canZoom = (
  element: HTMLElement | Document | Window,
  direction: Direction
) => {
  if (direction === "in" || direction === "out") {
    return true;
  }

  return false;
};

type HelperFunctions = {
  canScroll: typeof canScroll;
  canZoom: typeof canZoom;
};

export type WheelEventHandlerParameters =
  | {
      scrolling: true;
      zooming: false;
      direction: Extract<Direction, "up" | "down" | "left" | "right">;
      helpers: HelperFunctions;
    }
  | {
      scrolling: false;
      zooming: true;
      direction: Extract<Direction, "in" | "out">;
      helpers: HelperFunctions;
    };

// Declare weakMap to store counter for direction with respect to element
const directionCounterMap = new WeakMap<
  HTMLElement | Document | Window,
  [Extract<Direction, "up" | "down" | "left" | "right">, number]
>();

export const addWheelEventListener = (
  element: HTMLElement | Document | Window,
  handler: (event: WheelEvent, args: WheelEventHandlerParameters) => void,
  options?: boolean | (AddEventListenerOptions & { count?: number })
) => {
  const { count = 3, ...restOptions } =
    typeof options !== "boolean" && options ? options : {};
  const helpers = { canScroll, canZoom };

  const wheelHandler = (event: WheelEvent) => {
    // Detect zooming (either ctrlKey is pressed or pinch gesture on touchpad)
    if (event.ctrlKey || event.deltaZ !== 0) {
      handler(event, {
        scrolling: false,
        zooming: true,
        direction: event.deltaY < 0 ? "in" : "out",
        helpers,
      });

      return; // Skip further checks since this is zooming
    }

    // Skip and return if deltaX and deltaY are between -1 and 1
    if (
      event.deltaX >= -1 &&
      event.deltaX <= 1 &&
      event.deltaY >= -1 &&
      event.deltaY <= 1
    ) {
      return;
    }

    // Get the counter for the element
    const [direction, counter] = directionCounterMap.get(element) || [
      undefined,
      0,
    ];

    // Get the current direction
    const currentDirection =
      Math.abs(Math.floor(event.deltaY)) > Math.abs(Math.floor(event.deltaX))
        ? event.deltaY < 0
          ? "up"
          : "down"
        : event.deltaX < 0
        ? "left"
        : "right";

    // If the current direction is different from the previous direction, reset the counter
    if (currentDirection !== direction && count > 0) {
      directionCounterMap.set(element, [currentDirection, 0]);
      return;
    }

    // Increment the counter and if it reaches 3, then call the handler
    const newCounter = counter + 1;
    directionCounterMap.set(element, [currentDirection, newCounter]);

    if (newCounter >= count) {
      handler(event, {
        scrolling: true,
        zooming: false,
        direction: currentDirection,
        helpers,
      });

      directionCounterMap.set(element, [currentDirection, 0]);
    }
  };

  element.addEventListener("wheel", wheelHandler as EventListener, restOptions);
  return () => {
    element.removeEventListener("wheel", wheelHandler as EventListener);
    // Remove the counter from the map
    directionCounterMap.delete(element);
  };
};
