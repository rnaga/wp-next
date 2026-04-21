import type * as types from "../../types";
import { getStyle } from "./get-style";
import { styleToString } from "./style-to-string";
import { cloneStyle } from "./clone-style";
import { getMediaQueryMaxAndMin } from "./media-query";
import { getUnmergedStyle } from "./get-unmerged-style";
import type { WPLexicalNode } from "../nodes/wp/types";
import { isEditorMode } from "../editor-mode";

const wrapMediaQueryAndState = (
  styleStringArray: string[],
  styleString: string | undefined,
  device: types.BreakpointDevice,
  state: types.CSSState,
  className: string
): string[] => {
  // If styleString is empty, return as is
  if (!styleString || styleString.trim().length === 0) {
    return styleStringArray;
  }

  const mediaQuery = getMediaQueryMaxAndMin(device);

  let closureStart = `.${className} {`;
  let closureEnd = "}";

  if (state !== "none") {
    closureStart = `.${className}:${state} {`;
  }

  if (device !== "desktop") {
    styleStringArray.push(`${mediaQuery} {`);
    styleStringArray.push(closureStart);
    styleStringArray.push(styleString);
    styleStringArray.push(closureEnd);
    styleStringArray.push(`}`);
  } else {
    styleStringArray.push(closureStart);
    styleStringArray.push(styleString);
    styleStringArray.push(closureEnd);
  }

  return styleStringArray;
};

export const stylesToString = <T extends boolean = false>(
  css: WPLexicalNode["__css"],
  options?: {
    targetDevice?: types.BreakpointDevice;
    targetState?: types.CSSState;
    className?: string;
    excludeCSSKeys?: Array<keyof types.CSSKeyValue>;
    returnAsObject?: boolean;
  }
): T extends true ? string[] : string => {
  const targetDevice = !isEditorMode()
    ? "desktop"
    : options?.targetDevice || "desktop";
  const targetState = !isEditorMode() ? "none" : options?.targetState || "none";

  const className = options?.className || css.__className;

  let styleStringArray: string[] = [];

  // if device is desktop and state is none, should do the complete style to string
  const clonedStyles = cloneStyle(css.__styles);
  const clonedStateStyles = cloneStyle(css.__stylesStates);

  // if targetState is not none, we only process for a specific state
  // This only occurs in the editor mode
  if (targetState !== "none") {
    // Get styles which is vertically and horizontally merged for the target state
    const style = getStyle(css, {
      device: targetDevice,
      state: targetState,
      mode: "toString",
    });

    const styleString = styleToString<false>(
      style,
      {
        className,
      },
      {
        excludeCSSKeys: options?.excludeCSSKeys,
      }
    );

    wrapMediaQueryAndState(
      styleStringArray,
      styleString,
      targetDevice,
      "none",
      className
    );

    return options?.returnAsObject
      ? (styleStringArray as T extends true ? string[] : never)
      : (styleStringArray.join(" ") as T extends true ? never : string);
  }

  // Get all styles from all devices and states
  const devices = Object.keys(clonedStyles) as types.BreakpointDevice[];
  const states = Object.keys(clonedStateStyles) as types.CSSState[];

  for (const device of devices) {
    const style = getUnmergedStyle(
      clonedStyles,
      clonedStateStyles,
      device,
      targetState
    );

    const styleString = styleToString<false>(
      style,
      {
        className,
      },
      {
        excludeCSSKeys: options?.excludeCSSKeys,
      }
    );

    wrapMediaQueryAndState(
      styleStringArray,
      styleString,
      device,
      "none",
      className
    );

    // Process styles for each state
    for (const state of states) {
      const stateStyle = getUnmergedStyle(
        clonedStyles,
        clonedStateStyles,
        device,
        state
      );

      const stateStyleString = styleToString<false>(
        stateStyle,
        {
          className: css.__className,
        },
        {
          excludeCSSKeys: options?.excludeCSSKeys,
        }
      );

      wrapMediaQueryAndState(
        styleStringArray,
        stateStyleString,
        device,
        state,
        className
      );
    }
  }

  return options?.returnAsObject
    ? (styleStringArray as T extends true ? string[] : never)
    : (styleStringArray.join(" ") as T extends true ? never : string);
};
