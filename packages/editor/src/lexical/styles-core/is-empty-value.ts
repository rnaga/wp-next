import { isStyleObject } from "./is-style-object";

export const isEmptyValue = (value: any): boolean => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.length === 0) ||
    (isStyleObject(value) && Object.keys(value).length === 0)
  );
};
