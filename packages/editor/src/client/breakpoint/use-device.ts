import { useBreakpointContext } from "./BreakpointContext";

export const useDevice = () => {
  const { device, setDevice } = useBreakpointContext();
  return { device, setDevice };
};
