import {
  extendTheme as materialExtendTheme,
  createTheme,
} from "@mui/material/styles";
import type { CSSProperties } from "react";
import type { WPTheme } from "../wp-theme";

export {};

declare module "@rnaga/wp-next-core/types/hooks/filters.d" {
  export interface Filters {
    next_ui_theme: (options: {
      mui: Parameters<typeof materialExtendTheme>;
      wp: WPTheme;
    }) => {
      mui: Parameters<typeof materialExtendTheme>;
      wp: WPTheme;
    };
  }
}
