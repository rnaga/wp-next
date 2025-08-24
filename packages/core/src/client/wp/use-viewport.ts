import { useEffect, useState } from "react";

export const useViewport = () => {
  const [width, setWidth] = useState(
    () => (typeof window !== "undefined" && window.innerWidth) || 0
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const breakpoint = 768;
  return {
    width,
    isMobile: width < breakpoint,
    isDesktop: width >= breakpoint,
  };
};
