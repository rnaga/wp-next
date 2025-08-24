import { useEffect, useState } from "react";

export const usePortal = (props: { target: HTMLElement | null }) => {
  const { target = document.body } = props;
  const [targetState, setTargetState] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (target) {
      setTargetState(target);
    }
  }, [target]);

  return [targetState];
};
