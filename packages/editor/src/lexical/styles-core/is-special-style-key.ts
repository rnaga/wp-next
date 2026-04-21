import { CSS_SPECIAL_KEYS } from "./constants";

export const isSpecialStyleKey = (key: string): boolean => {
  return (
    key.startsWith("__cssVariablesUsage") ||
    CSS_SPECIAL_KEYS.includes(key) ||
    key === "__animation"
  );
};
