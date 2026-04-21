import {
  addWheelEventListener,
  WheelEventHandlerParameters,
} from "./add-wheel-event-listener";

export const addEventListener = <
  E extends Parameters<HTMLElement["addEventListener"]>[0],
  T extends Event
>(
  element: HTMLElement | Document | Window,
  event: E,
  handler: E extends "wheel"
    ? (event: WheelEvent, args: WheelEventHandlerParameters) => void
    : (event: T) => void,
  options?: boolean | AddEventListenerOptions
) => {
  if (event === "wheel") {
    return addWheelEventListener(element, handler as any, options);
  }

  element.addEventListener(event, handler as EventListener, options);
  return () => {
    element.removeEventListener(event, handler as EventListener);
  };
};
