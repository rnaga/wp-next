import { logger } from "../logger";

export const encodeCustomProperties = (
  cssProperties: Record<string, string>
): string => {
  const jsonString = JSON.stringify(cssProperties);
  return Buffer.from(jsonString).toString("base64");
};

export const mergeCustomProperties = (
  base?: string,
  override?: string
): string | undefined => {
  const baseProperties = base ? decodeCustomProperties(base) : undefined;
  const overrideProperties = override
    ? decodeCustomProperties(override)
    : undefined;
  return !baseProperties && !overrideProperties
    ? undefined
    : encodeCustomProperties({ ...baseProperties, ...overrideProperties });
};

export const decodeCustomProperties = (
  cssPropertiesString: string
): Record<string, string> => {
  try {
    // Try base64 decode first
    const jsonString = Buffer.from(cssPropertiesString, "base64").toString(
      "utf-8"
    );
    const cssProperties = JSON.parse(jsonString);
    const value = cssProperties.$value ?? cssProperties;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    // Fallback: try parsing as plain JSON string
    try {
      const cssProperties = JSON.parse(cssPropertiesString);
      const value = cssProperties.$value ?? cssProperties;
      return typeof value === "string" ? JSON.parse(value) : value;
    } catch (error) {
      logger.warn( `Failed to decode custom properties: ${error}`);
      return {};
    }
  }
};
