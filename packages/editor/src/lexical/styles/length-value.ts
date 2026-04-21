import type * as types from "../../types";

export const parseLengthUnit = (
  value: string
): types.LengthUnit | undefined => {
  const unit = value.match(/(\D+)$/)?.[0];
  return (unit as types.LengthUnit) || undefined;
};

export const parseLengthValue = (
  valueUnit: string,
  options?: {
    defaultUnit?: types.LengthUnit;
    defaultValue?: string;
  }
) => {
  // passing value contains number and unit, which should be separated using regex
  // Ensure that the regex can take "auto" as a value
  const parsed = valueUnit?.match(/^(auto|(-?\d*\.?\d+)(\D*))$/);
  const defaultUnit = options?.defaultUnit || "px";
  const defaultValue = options?.defaultValue || "";

  if (!parsed) {
    return { value: defaultValue, unit: defaultUnit };
  }

  if (parsed[1] === "auto") {
    return { value: "auto", unit: "" };
  }

  const value = parsed[2];
  const unit = parsed[3] || defaultUnit;

  return { value, unit };
};
