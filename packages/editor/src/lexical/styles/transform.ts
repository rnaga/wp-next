import { $getNodeByKey, LexicalEditor } from "lexical";
import { WPLexicalNode } from "../nodes/wp";

import type * as types from "../../types";
import { $updateCSS } from "../styles-core/css";

// Using % prefix to indicate that this is objectValue type (see css-record-to-string.ts)
export const TRANSFORM_CSS_KEY = "%transform";

export const getTransformFromCSSKeyValue = (
  css: types.CSSKeyValue & Record<string, any>
) => {
  return css[TRANSFORM_CSS_KEY] as Partial<types.CSSTransform> | undefined;
};

/**
 * Extracts rotation angle from a CSS transform matrix
 */
export const transformValueToRotateAngle = (transform: string): number => {
  try {
    const matrix = new DOMMatrix(transform === "none" ? "" : transform);
    return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
  } catch {
    return 0;
  }
};

/**
 * Extracts the rotate value from a CSS transform string
 * Returns the angle in degrees, or 0 if no rotate is found
 */
// const parseRotateFromTransform = (transform: string): number => {
//   if (!transform || transform === "none") return 0;

//   // Match rotate(...) in the transform string
//   const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
//   if (!rotateMatch) return 0;

//   const value = rotateMatch[1].trim();

//   // Parse angle with unit
//   if (value.endsWith("deg")) {
//     return parseFloat(value);
//   } else if (value.endsWith("rad")) {
//     return (parseFloat(value) * 180) / Math.PI;
//   } else if (value.endsWith("turn")) {
//     return parseFloat(value) * 360;
//   } else {
//     // No unit means radians
//     return (parseFloat(value) * 180) / Math.PI;
//   }
// };

export const $getTransformCSSObject = (node: WPLexicalNode) => {
  return (node.__css.get()[TRANSFORM_CSS_KEY] ||
    {}) as Partial<types.CSSTransform>;
};

export const $getTransformCSSType = (node: WPLexicalNode): "2d" | "3d" => {
  const transformObject = (node.__css.get()[TRANSFORM_CSS_KEY] ||
    {}) as types.CSSTransform;
  return transformObject.$type === "3d" ? "3d" : "2d";
};

export const $transformToString = (node: WPLexicalNode): string | undefined => {
  const transformObject = (node.__css.get()[TRANSFORM_CSS_KEY] ||
    {}) as types.CSSTransform;
  //   const transformStrings: string[] = [];

  //   for (const [key, value] of Object.entries(transformObject)) {
  //     if (value !== undefined && value !== null && value !== "") {
  //       transformStrings.push(`${key}(${value})`);
  //     }
  //   }

  //   return transformStrings.join(" ");

  return transformValueToCSSString(transformObject);
};

export const transformValueToCSSString = (
  transform: types.CSSTransform
): string | undefined => {
  const transformStrings: string[] = [];

  // Check if transform has any defined properties
  const hasDefinedProperties = Object.values(transform).some(
    (value) => value !== undefined && value !== null && value !== ""
  );

  if (!hasDefinedProperties) {
    return undefined;
  }

  const type = transform.$type || "2d";

  for (const [key, value] of Object.entries(transform)) {
    // Skip the $type key
    if (key === "$type") continue;

    // Check for rotate, rotateX, rotateY, rotateZ based on type
    // If type is 2d, only include rotate
    // If type is 3d, include rotateX, rotateY, rotateZ
    const is3dRotate =
      key === "rotateX" || key === "rotateY" || key === "rotateZ";
    const skip =
      (is3dRotate && type === "2d") || (key === "rotate" && type === "3d");
    if (skip) continue;

    if (value !== undefined && value !== null && value !== "") {
      transformStrings.push(`${key}(${value})`);
    }
  }

  return transformStrings.length === 0 ? "none" : transformStrings.join(" ");
};

export const $updateTransformCSS = (args: {
  editor: LexicalEditor;
  node: WPLexicalNode;
  transform: Partial<types.CSSTransform>;
  type?: "mouse" | "input";
}) => {
  const { editor, type } = args;
  const latestNode = args.node.getLatest(); //$getNodeByKey(args.node.getKey()) as WPLexicalNode;
  const transformObject = {
    ...(latestNode.__css.get()[TRANSFORM_CSS_KEY] || {}),
    ...args.transform,
  };

  //const transformString = Object.entries(transformObject);

  $updateCSS({
    editor,
    node: latestNode,
    styles: {
      //transform: transformValueToCSSString(transformObject),
      [TRANSFORM_CSS_KEY]: transformObject,
    },
    type: type || "input",
  });
};
