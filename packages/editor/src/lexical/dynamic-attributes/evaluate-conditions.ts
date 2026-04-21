import type { WPLexicalNode } from "../nodes/wp/types";
import type {
  DynamicAttributeRule,
  DynamicAttributeCondition,
  ConditionOperator,
} from "./types";

/**
 * Evaluate all conditions in a rule
 * Returns true if conditions are met based on conditionOperator (any/all)
 */
export const evaluateConditions = (
  rule: DynamicAttributeRule,
  options: {
    data?: Record<string, any>;
    node: WPLexicalNode;
  }
): boolean => {
  const { conditionOperator, conditions } = rule;

  if (conditions.length === 0) {
    return false;
  }

  const results = conditions.map((condition) =>
    evaluateSingleCondition(condition, options)
  );

  // "any" = OR (at least one must be true)
  // "all" = AND (all must be true)
  return conditionOperator === "any"
    ? results.some((r) => r)
    : results.every((r) => r);
};

/**
 * Evaluate a single condition
 */
const evaluateSingleCondition = (
  condition: DynamicAttributeCondition,
  options: {
    data?: Record<string, any>;
    node: WPLexicalNode;
  }
): boolean => {
  const { type, key, operator, value } = condition;

  // Currently only support data-fetching type
  if (type !== "data-fetching") {
    return false;
  }

  // Process template text to get actual value
  // key format: "${item.post_modified}" or "${posts.title}"
  // Import lazily to avoid circular dependencies
  const {
    $processTemplateText,
  } = require("../nodes/template-text/TemplateTextNode");
  const actualValue = $processTemplateText(key, options);

  // If the template wasn't resolved (still contains ${), condition fails
  if (actualValue.includes("${")) {
    return false;
  }

  // Compare based on operator
  const result = compareValues(actualValue, operator, value);

  return result;
};

/**
 * Compare values based on operator type
 */
const compareValues = (
  actual: string,
  operator: ConditionOperator,
  expected: string | number
): boolean => {
  // Boolean operators
  if (operator === "is_true" || operator === "is_false") {
    const actualBool = actual === "true" || actual === "1" || actual === "yes";
    return operator === "is_true" ? actualBool : !actualBool;
  }

  // String operators
  if (operator === "contains") {
    return String(actual)
      .toLowerCase()
      .includes(String(expected).toLowerCase());
  }
  if (operator === "not_contains") {
    return !String(actual)
      .toLowerCase()
      .includes(String(expected).toLowerCase());
  }
  if (operator === "equals") {
    return String(actual) === String(expected);
  }
  if (operator === "not_equals") {
    return String(actual) !== String(expected);
  }

  // Number operators
  const actualNum = parseFloat(actual);
  const expectedNum =
    typeof expected === "number" ? expected : parseFloat(String(expected));

  // If numbers can be parsed, use numeric comparison
  if (!isNaN(actualNum) && !isNaN(expectedNum)) {
    if (operator === "lt") return actualNum < expectedNum;
    if (operator === "eq") return actualNum === expectedNum;
    if (operator === "gt") return actualNum > expectedNum;
    if (operator === "lte") return actualNum <= expectedNum;
    if (operator === "gte") return actualNum >= expectedNum;
    if (operator === "mod_zero")
      return expectedNum !== 0 && actualNum % expectedNum === 0;
  }

  // Date operators (also handles numeric operators for dates)
  if (
    operator === "before" ||
    operator === "after" ||
    operator === "on" ||
    operator === "lt" ||
    operator === "gt" ||
    operator === "lte" ||
    operator === "gte" ||
    operator === "eq"
  ) {
    return compareDates(actual, operator, expected);
  }

  return false;
};

/**
 * Compare date values
 */
const compareDates = (
  actual: string,
  operator: ConditionOperator,
  expected: string | number
): boolean => {
  const actualDate = new Date(actual);
  const expectedDate = new Date(String(expected));

  // If either date is invalid, return false
  if (isNaN(actualDate.getTime()) || isNaN(expectedDate.getTime())) {
    return false;
  }

  switch (operator) {
    case "before":
    case "lt":
      return actualDate < expectedDate;
    case "after":
    case "gt":
      return actualDate > expectedDate;
    case "on":
    case "eq":
      return actualDate.toDateString() === expectedDate.toDateString();
    case "lte":
      return actualDate <= expectedDate;
    case "gte":
      return actualDate >= expectedDate;
    default:
      return false;
  }
};
