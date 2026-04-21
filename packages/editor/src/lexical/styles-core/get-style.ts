import { CSS_EXTERNAL_CLASS_NAMES_KEY } from "./constants";

import { getDevices } from "./get-devices";
import type * as types from "../../types";
import { getUnmergedStyle } from "./get-unmerged-style";
import { cloneStyle } from "./clone-style";
import { verticalMerge } from "./vertical-merge";
import { horizontalMerge } from "./horizontal-merge";
import { resolveCSSVariableUsage } from "./resolve-css-variable-usage";
import { CSSDevice } from "./css-device";
import { CSSEditorElementState } from "./css-editor-element-state";
import type { WPLexicalNode } from "../nodes/wp/types";

export const getStyle = (
  css: WPLexicalNode["__css"],
  options?: {
    device?: types.BreakpointDevice;
    state?: types.CSSState;
    mode?: "toString" | "toObject";
  }
): Record<types.CSSKey, any> => {
  // Get current device and state
  const currentDevice = options?.device || CSSDevice.__current;
  const currentState =
    options?.state || CSSEditorElementState.getCurrent(css.__nodeKey);
  const mode = options?.mode || "toObject";

  const clonedStyles = cloneStyle(css.__styles);
  const clonedStateStyles = cloneStyle(css.__stylesStates);

  // Get available devices
  const devices = getDevices();

  let noneStyle: types.CSSKeyValue = {};
  let stateStyle: types.CSSKeyValue = {};

  // In editor mode, when the user switches to a device other than desktop
  // (e.g. tablet or mobile), __customProperties need to be inherited through
  // vertical and horizontal merges. This ensures the preview layer shows
  // custom properties defined on larger breakpoints even when viewing a
  // smaller device or a non-"none" state (hover, focus, active).
  //
  // Example — desktop none defines { backgroundColor: "red" } and
  // tablet hover defines { width: "400px" } as custom properties.
  // When previewing tablet hover, the merged result should contain both:
  //   { backgroundColor: "red", width: "400px" }
  //
  // This only applies in "toString" mode (CSS output/preview).
  const shouldMergeCustomProperties = mode === "toString";

  // Loop through device and do a vertical merge
  // merge styles from larger device to smaller device (same state, different device)
  // e.g. desktop -> tablet -> mobile
  for (const device of devices) {
    // For none state style
    const noneDeviceStyle = getUnmergedStyle(
      clonedStyles,
      clonedStateStyles,
      device,
      "none"
    );

    // If device is "desktop", then copy directly with resolve CSS variable usage
    if (device === "desktop") {
      noneStyle = resolveCSSVariableUsage(noneDeviceStyle);
    } else {
      noneStyle = verticalMerge(noneStyle, noneDeviceStyle, {
        shouldMergeCustomProperties,
      });
    }

    // If current state is not "none", then merge state style as well
    if (currentState !== "none") {
      const stateDeviceStyle = getUnmergedStyle(
        clonedStyles,
        clonedStateStyles,
        device,
        currentState
      );

      if (device === "desktop") {
        stateStyle = resolveCSSVariableUsage(stateDeviceStyle);
      } else {
        stateStyle = verticalMerge(stateStyle, stateDeviceStyle, {
          shouldMergeCustomProperties,
        });
      }
    }

    // Break the loop if we reached the current device
    if (device === currentDevice) {
      break;
    }
  }

  // Normalize externalClassNames to a string in case if it's stored as an array (for backward compatibility)
  const rawExternalClassNames = css[CSS_EXTERNAL_CLASS_NAMES_KEY] ?? "";
  const externalClassNames = Array.isArray(rawExternalClassNames)
    ? rawExternalClassNames.join(" ")
    : rawExternalClassNames;

  // Return if current state is "none"
  if (currentState === "none") {
    // Finalize the style by resolving CSS variable usage and attaching external class names
    const finalStyle = {
      ...noneStyle,
      [CSS_EXTERNAL_CLASS_NAMES_KEY]: externalClassNames,
    };

    return finalStyle as Record<types.CSSKey, any>;
  }

  // For other states, merge noneStyle into stateStyle horizontally
  // (same device, different state)
  // none style -> state style
  stateStyle = horizontalMerge(noneStyle, stateStyle, {
    shouldMergeCustomProperties,
  });

  // Finalize the style by resolving CSS variable usage and attaching external class names
  const finalStyle = {
    ...stateStyle,
    [CSS_EXTERNAL_CLASS_NAMES_KEY]: externalClassNames,
  };

  return finalStyle as Record<types.CSSKey, any>;
};
