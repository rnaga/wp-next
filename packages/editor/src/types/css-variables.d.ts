import { z } from "zod";
import {
  cssVariablesContentValidator,
  cssVariablesListValidator,
} from "../lexical/nodes/css-variables/css-variables-validator";
import { CSSProperties } from "react";
import { CSSKeyValue } from "./css";

import { CSS_VARIABLES_OBJECT_KEYS } from "../lexical/styles-core/constants";

export type CSSVariablesList = z.infer<typeof cssVariablesListValidator>;

export type CSSVariables = NonNullable<CSSVariablesList[number]>;

export type CSSVariablesContent = z.infer<typeof cssVariablesContentValidator>;

export type CSSVariableContentSyntax = CSSVariablesContent[number]["syntax"];

export type CSSVariablesContentItem = NonNullable<CSSVariablesContent[number]>;

export type CSSCustomPropertyChangeFunction = (
  propertyName: string,
  contentItem: CSSVariablesContentItem,
  cssVariables: CSSVariables
) => Promise<
  | { close: true; usageName: keyof CSSProperties }
  | {
      close: false;
      usageName: never;
    }
>;

export type KeyOfCSSVariablesUsageArray = "textShadow" | "background";

export type KeyOfPrefixOfCSSVariablesUsageObject =
  (typeof CSS_VARIABLES_OBJECT_KEYS)[number];

export type KeyOfCSSVariablesUsageObject =
  `${KeyOfPrefixOfCSSVariablesUsageObject}-${string}`;

export type KeyOfCSSVariablesUsage = Exclude<
  keyof CSSProperties | `$${string}`,
  KeyOfCSSVariablesUsageArray
>;

export type KeyOfCSSVariablesUsageMixed =
  | KeyOfCSSVariablesUsage
  | KeyOfCSSVariablesUsageArray
  | KeyOfCSSVariablesUsageObject;

export type AltKeyOfCSSVariablesUsage = keyof CSSKeyValue;

export type ValueOfCSSVariablesUsage =
  CSSVariablesUsage[KeyOfCSSVariablesUsage];

type CSSVariablesUsageValue = {
  slug: string;
  variableName: string;

  // Indicates whether the variable usage is inherited from higher-level devices.
  // Defaults to false. Set to true when the variable is inherited (e.g., via get()).
  inherit?: boolean;
};

// export type KeyOfCSSVariablesUsage =
//   infer T extends CSSVariablesMultipleValueKey
//     ? never
//     : T extends KeyOfCSSVariablesUsage
//     ? KeyOfCSSVariablesUsage
//     : never;

export type CSSVariablesUsage = Record<string, CSSVariablesUsageValue>;

export type CSSVariablesUsageArray = Record<
  AltKeyOfCSSVariablesUsage,
  CSSVariablesUsageValue[]
>;

export type CSSVariablesUsageMixed = Record<
  string,
  CSSVariablesUsageValue | CSSVariablesUsageValue[]
>;

export type CSSVariablesUsageUpdate = Record<
  string,
  ValueOfCSSVariablesUsage | undefined
>;
