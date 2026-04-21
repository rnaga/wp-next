import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useBreakpoint } from "./use-breakpoint";
import { useEffect, useState } from "react";
import { WP_BREAKPOINT_WIDTH_CHANGED_COMMAND } from "./commands";

export const useWidth = () => {
  const { wpHooks } = useWP();
  const { breakpointRef } = useBreakpoint();
  const [width, setWidth] = useState({
    wrapperWidth: breakpointRef.current.wrapperWidth,
    widthRatio: breakpointRef.current.widthRatio,
  });

  useEffect(() => {
    return wpHooks.action.addCommand(
      WP_BREAKPOINT_WIDTH_CHANGED_COMMAND,
      (breakpointRef) => {
        setWidth({
          wrapperWidth: breakpointRef.current.wrapperWidth,
          widthRatio: breakpointRef.current.widthRatio,
        });
      }
    );
  }, []);

  return {
    width,
    setWidth,
  };
};
