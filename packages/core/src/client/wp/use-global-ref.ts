import { useRef } from "react";

export const useGlobalRef = () => {
  const ref = useRef(new Map());
  const globalRef = {
    get: (key: any) => ref.current.get(key),
    set: (key: any, value: any) => {
      ref.current.set(key, value);
    },
    delete: (key: any) => ref.current.delete(key),
    map: ref.current,
  };

  return globalRef;
};
