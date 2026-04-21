import type { HTMLAttributes } from "react";

// Operator types based on data type
export type StringOperator =
  | "contains"
  | "not_contains"
  | "equals"
  | "not_equals";
export type NumberOperator = "lt" | "eq" | "gt" | "lte" | "gte" | "mod_zero";
export type DateOperator = "before" | "after" | "on";
export type BooleanOperator = "is_true" | "is_false";

export type ConditionOperator =
  | StringOperator
  | NumberOperator
  | DateOperator
  | BooleanOperator;

// Condition type - currently only data-fetching, extensible for future
export type ConditionType = "data-fetching";

export interface DynamicAttributeCondition {
  type: ConditionType;
  key: string; // e.g., "${item.post_modified}"
  operator: ConditionOperator;
  value: string | number;
}

export interface DynamicAttributeSettings {
  display: boolean;
  externalClassnames: string[] | undefined;
  customAttributes: HTMLAttributes<any>;
}

export interface DynamicAttributeRule {
  conditionOperator: "any" | "all";
  conditions: DynamicAttributeCondition[];
  settings: DynamicAttributeSettings;
}

export type DynamicAttributesJSON = DynamicAttributeRule[];

// For the Zod utility
export interface KeyWithType {
  key: string;
  zodType:
    | "string"
    | "number"
    | "date"
    | "boolean"
    | "array"
    | "object"
    | "unknown";
}

// Operator mappings by data type for UI
export const OPERATORS_BY_TYPE: Record<
  string,
  { label: string; value: ConditionOperator }[]
> = {
  string: [
    { label: "Contains", value: "contains" },
    { label: "Does not contain", value: "not_contains" },
    { label: "Equals", value: "equals" },
    { label: "Does not equal", value: "not_equals" },
  ],
  number: [
    { label: "Less than", value: "lt" },
    { label: "Equal to", value: "eq" },
    { label: "Greater than", value: "gt" },
    { label: "Less than or equal", value: "lte" },
    { label: "Greater than or equal", value: "gte" },
    { label: "Divisible by", value: "mod_zero" },
  ],
  date: [
    { label: "Before", value: "before" },
    { label: "After", value: "after" },
    { label: "On", value: "on" },
  ],
  boolean: [
    { label: "Is true", value: "is_true" },
    { label: "Is false", value: "is_false" },
  ],
  // Default fallback uses string operators
  unknown: [
    { label: "Contains", value: "contains" },
    { label: "Does not contain", value: "not_contains" },
    { label: "Equals", value: "equals" },
    { label: "Does not equal", value: "not_equals" },
  ],
};

// Default empty settings
export const DEFAULT_SETTINGS: DynamicAttributeSettings = {
  display: true,
  externalClassnames: undefined,
  customAttributes: {},
};

// Default empty rule
export const DEFAULT_RULE: DynamicAttributeRule = {
  conditionOperator: "all",
  conditions: [],
  settings: { ...DEFAULT_SETTINGS },
};
