import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useBreakpoint } from "./use-breakpoint";
import { WP_BREAKPOINT_SCALE_CHANGED_COMMAND } from "./commands";
import { useEffect, useState } from "react";

export const useScale = () => {
  const { wpHooks } = useWP();
  const { breakpointRef, setScale, setScaleByEvent } = useBreakpoint();
  const [scale, setScaleState] = useState(breakpointRef.current.scale);

  useEffect(() => {
    return wpHooks.action.addCommand(
      WP_BREAKPOINT_SCALE_CHANGED_COMMAND,
      (breakpointRef) => {
        setScaleState(breakpointRef.current.scale);
      }
    );
  }, []);

  return {
    scale,
    setScale,
    setScaleByEvent,
  };
};
