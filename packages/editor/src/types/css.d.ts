import type { CSSProperties } from "react";
import { CSS_EXTERNAL_CLASS_NAMES_KEY } from "../lexical/styles-core/constants";

export type CSSTransformKey =
  | "$type"
  | "translate"
  | "translateX"
  | "translateY"
  | "translateZ"
  | "scale"
  | "scaleX"
  | "scaleY"
  | "scaleZ"
  | "rotate"
  | "rotateX"
  | "rotateY"
  | "rotateZ"
  | "skew"
  | "skewX"
  | "skewY"
  | "perspective";
export type CSSTransform = Record<CSSTransformKey, string | number>;

export type CSSKey =
  | keyof Omit<CSSProperties, "transform">
  | typeof CSS_EXTERNAL_CLASS_NAMES_KEY
  | CSSTransformKey
  | `$${string}`
  | `__${string}`
  | `%${string}`;

export type CSSKeyValue = Partial<Record<CSSKey, any>>;

// Omit<CSSProperties, "transform"> &
//   Partial<Record<"transform", Partial<CSSTransform>>> &
//   Partial<Record<`$${string}` | `__${string}` | `%${string}`, any>>;

export type CSSRecord<T extends CSSKeyValue = CSSKeyValue> = Record<
  types.BreakpointDevice,
  T | undefined
>;

export type CSSState =
  | "none"
  | "hover"
  | "active"
  | "focus"
  | "focus-within"
  | "visited";

export type CSSStateRecord<T extends CSSKeyValue = CSSKeyValue> = Partial<
  Record<CSSState, T>
>;

// New structure: state first, then devices
export type CSSStatesRecord<T extends CSSKeyValue = CSSKeyValue> = Partial<
  Record<CSSState, types.CSSRecord<T>>
>;

export type CSSRecordWithStates<T extends CSSKeyValue = CSSKeyValue> = Record<
  types.BreakpointDevice,
  | {
      base?: T;
      states?: CSSStateRecord<T>;
    }
  | undefined
>;

export type StyleObjectValue = Record<string, string>;

export type StyleStringObject = Record<
  string,
  string | string[] | StyleObjectValue
>;

export type StyleStringObjectWithUndefined = Record<
  string,
  string | string[] | StyleObjectValue | undefined
>;
