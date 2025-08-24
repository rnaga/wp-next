import { useViewport } from "./hooks/use-viewport";
import { ReactNode } from "react";

export const Viewport = (props: {
  device: "desktop" | "mobile";
  children: ReactNode;
}) => {
  const { device, children } = props;
  const viewport = useViewport();

  if (
    (device == "desktop" && viewport.isDesktop) ||
    (device == "mobile" && viewport.isMobile)
  ) {
    return children;
  }

  return null;
};
